from datetime import UTC, datetime
import base64
import hashlib
import json

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes

from .algorithms import (
    get_algorithm_spec,
    get_variant_profiles,
    infer_algorithm_from_private_key,
    infer_algorithm_from_public_key,
    normalize_algorithm_name,
)
from .manifest import (
    EMBEDDED_SIGNATURE_BLOCK_TYPE,
    MANIFEST_SCHEMA_VERSION,
    MANIFEST_TYPE,
    ManifestError,
    build_embedded_signature_block,
    build_signature_manifest,
    coerce_signature_manifest,
    get_signature_payload,
)

KEY_RECORD_SCHEMA_VERSION = 2
KEY_RECORD_TYPE = "signing_key"
SIGNATURE_RECORD_SCHEMA_VERSION = 2
SIGNATURE_RECORD_TYPE = "signature_manifest"
PATCH_MARKER = b"---ML_DSA_SIGNATURE_START---"
PATCH_END_MARKER = b"---ML_DSA_SIGNATURE_END---"
LEGACY_PATCH_MARKER = b"---ECC_SIGNATURE_START---"
LEGACY_PATCH_END_MARKER = b"---ECC_SIGNATURE_END---"


def utc_now_iso():
    return datetime.now(UTC).isoformat()


class DuplicateKeyError(ValueError):
    pass


class MLDSASignerService:
    def __init__(self, config, storage, logger):
        self.config = config
        self.storage = storage
        self.logger = logger
        self.key_storage = {}
        self.signatures_db = {}
        self._load_keys_from_storage()
        self._load_signatures_from_storage()

    def _log(self, level, event, **details):
        getattr(self.logger, level)(event, extra={"event": event, "details": details})

    def _encode_bytes(self, value):
        return base64.b64encode(value).decode("utf-8")

    def _decode_bytes(self, value):
        return base64.b64decode(value)

    def _serialize_public_key(self, public_key):
        return {
            "encoding": "base64",
            "public_key_b64": self._encode_bytes(public_key),
            "public_key_size": len(public_key),
        }

    def _derive_encryption_key(self, password, salt):
        return PBKDF2(
            password,
            salt,
            32,
            count=self.config.pbkdf2_iterations,
            hmac_hash_module=SHA256,
        )

    def _encrypt_private_key(self, private_key_bytes, password, algorithm):
        salt = get_random_bytes(16)
        nonce = get_random_bytes(12)
        key = self._derive_encryption_key(password.encode("utf-8"), salt)
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(private_key_bytes)

        return {
            "salt": self._encode_bytes(salt),
            "nonce": self._encode_bytes(nonce),
            "ciphertext": self._encode_bytes(ciphertext),
            "tag": self._encode_bytes(tag),
            "algorithm": "AES-256-GCM",
            "kdf": "PBKDF2-SHA256",
            "kdf_iterations": self.config.pbkdf2_iterations,
            "signature_algorithm": algorithm,
            "content_type": "ML-DSA private key",
            "content_encoding": "base64-raw-bytes",
        }

    def _decrypt_private_key(self, encrypted_data, password):
        try:
            salt = self._decode_bytes(encrypted_data["salt"])
            nonce = self._decode_bytes(encrypted_data["nonce"])
            ciphertext = self._decode_bytes(encrypted_data["ciphertext"])
            tag = self._decode_bytes(encrypted_data["tag"])
            key = self._derive_encryption_key(password.encode("utf-8"), salt)
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
            return cipher.decrypt_and_verify(ciphertext, tag)
        except Exception as exc:
            raise ValueError(f"Failed to decrypt private key: {exc}") from exc

    def _normalize_export_payload(self, key_material):
        if key_material.get("success") is True:
            return {key: value for key, value in key_material.items() if key != "success"}
        return key_material

    def _validate_key_sizes(self, algorithm, public_key, private_key=None):
        spec = get_algorithm_spec(algorithm)
        if len(public_key) != spec.public_key_size:
            raise ValueError(f"Public key size does not match {spec.name}")
        if private_key is not None and len(private_key) != spec.private_key_size:
            raise ValueError(f"Private key size does not match {spec.name}")

    def _build_key_record(self, key_id, key_data):
        now = utc_now_iso()
        return {
            "schema_version": KEY_RECORD_SCHEMA_VERSION,
            "record_type": KEY_RECORD_TYPE,
            "key_id": key_id,
            "created_at": key_data["created_at"],
            "updated_at": now,
            "algorithm": key_data["algorithm"],
            "encrypted": key_data.get("encrypted", False),
            "public_key_b64": self._encode_bytes(key_data["public_key"]),
            **(
                {"encrypted_private_key": key_data["encrypted_private_key"]}
                if "encrypted_private_key" in key_data
                else {"private_key_b64": self._encode_bytes(key_data["private_key"])}
            ),
        }

    def _build_signature_record(self, signature_id, signature_manifest):
        return {
            "schema_version": SIGNATURE_RECORD_SCHEMA_VERSION,
            "record_type": SIGNATURE_RECORD_TYPE,
            "signature_id": signature_id,
            "saved_at": utc_now_iso(),
            "manifest": signature_manifest,
        }

    def _save_key_to_storage(self, key_id, key_data):
        self.storage.write_key_record(key_id, self._build_key_record(key_id, key_data))

    def _save_signature_to_storage(self, signature_id, signature_manifest):
        self.storage.write_signature_record(
            signature_id, self._build_signature_record(signature_id, signature_manifest)
        )

    def _load_keys_from_storage(self):
        for key_id in self.storage.list_key_ids():
            self._load_key_from_storage(key_id)

    def _load_key_from_storage(self, key_id):
        record = self.storage.read_key_record(key_id)
        if not record:
            return None

        try:
            if record.get("schema_version") == KEY_RECORD_SCHEMA_VERSION and record.get(
                "record_type"
            ) == KEY_RECORD_TYPE:
                return self._load_v2_key_record(key_id, record)

            return self._load_legacy_key_record(key_id, record)
        except Exception as exc:
            self._log("warning", "key_load_failed", key_id=key_id, error=str(exc))
            return None

    def _load_v2_key_record(self, key_id, record):
        algorithm = normalize_algorithm_name(record.get("algorithm"), self.config.default_algorithm)
        public_key = self._decode_bytes(record["public_key_b64"])
        private_key = None
        if "private_key_b64" in record:
            private_key = self._decode_bytes(record["private_key_b64"])
        self._validate_key_sizes(algorithm, public_key, private_key)
        key_data = {
            "created_at": record["created_at"],
            "algorithm": algorithm,
            "encrypted": record.get("encrypted", False),
            "public_key": public_key,
        }
        if "encrypted_private_key" in record:
            key_data["encrypted_private_key"] = record["encrypted_private_key"]
        elif private_key is not None:
            key_data["private_key"] = private_key
        self.key_storage[key_id] = key_data
        return key_data

    def _load_legacy_key_record(self, key_id, record):
        if "public_key_b64" not in record:
            self._log(
                "warning",
                "legacy_key_skipped",
                key_id=key_id,
                reason="unsupported_non_mldsa_record",
            )
            return None

        public_key = self._decode_bytes(record["public_key_b64"])
        algorithm = record.get("algorithm") or infer_algorithm_from_public_key(public_key)
        if algorithm is None:
            self._log(
                "warning",
                "legacy_key_skipped",
                key_id=key_id,
                reason="algorithm_not_detected",
            )
            return None

        private_key = None
        if "private_key_b64" in record:
            private_key = self._decode_bytes(record["private_key_b64"])
            if not record.get("algorithm"):
                algorithm = infer_algorithm_from_private_key(private_key) or algorithm

        algorithm = normalize_algorithm_name(algorithm, self.config.default_algorithm)
        self._validate_key_sizes(algorithm, public_key, private_key)

        key_data = {
            "created_at": record["created_at"],
            "algorithm": algorithm,
            "encrypted": record.get("encrypted", False),
            "public_key": public_key,
        }
        if "encrypted_private_key" in record:
            key_data["encrypted_private_key"] = record["encrypted_private_key"]
        elif private_key is not None:
            key_data["private_key"] = private_key

        self.key_storage[key_id] = key_data
        return key_data

    def _load_signatures_from_storage(self):
        for signature_id in self.storage.list_signature_ids():
            self._load_signature_from_storage(signature_id)

    def _load_signature_from_storage(self, signature_id):
        record = self.storage.read_signature_record(signature_id)
        if not record:
            return None

        try:
            if record.get("schema_version") == SIGNATURE_RECORD_SCHEMA_VERSION and record.get(
                "record_type"
            ) == SIGNATURE_RECORD_TYPE:
                manifest = coerce_signature_manifest(record["manifest"], signature_id)
            else:
                payload = record.get("manifest") or record.get("signature_data") or record
                manifest = coerce_signature_manifest(payload, signature_id)
            self.signatures_db[signature_id] = manifest
            return manifest
        except Exception as exc:
            self._log(
                "warning",
                "signature_load_failed",
                signature_id=signature_id,
                error=str(exc),
            )
            return None

    def _get_private_key(self, key_id, password=None):
        if key_id not in self.key_storage:
            raise ValueError(f"Key ID {key_id} not found")

        key_data = self.key_storage[key_id]
        if "encrypted_private_key" in key_data:
            if password is None:
                raise ValueError("Password required for encrypted private key")
            return self._decrypt_private_key(key_data["encrypted_private_key"], password)

        if "private_key" not in key_data:
            raise ValueError("Private key material not available")
        return key_data["private_key"]

    def _ensure_key_id_available(self, key_id, overwrite=False):
        if key_id in self.key_storage and not overwrite:
            raise DuplicateKeyError(
                f"Key ID {key_id} already exists. Pass overwrite=true to replace it."
            )

    def get_security_features(self):
        default_spec = get_algorithm_spec(self.config.default_algorithm)
        return {
            "private_key_encryption": "AES-256-GCM",
            "key_derivation": "PBKDF2-SHA256",
            "kdf_iterations": self.config.pbkdf2_iterations,
            "default_signature_algorithm": self.config.default_algorithm,
            "signature_algorithm": self.config.default_algorithm,
            "supported_signature_algorithms": self.config.supported_algorithms,
            "variant_profiles": get_variant_profiles(),
            "hash_algorithm": "SHA-256",
            "public_key_size_bytes": default_spec.public_key_size,
            "private_key_size_bytes": default_spec.private_key_size,
            "signature_size_bytes": default_spec.signature_size,
            "max_upload_size_bytes": self.config.max_upload_size_bytes,
        }

    def list_keys_info(self):
        keys_info = {}
        for key_id, key_data in self.key_storage.items():
            spec = get_algorithm_spec(key_data["algorithm"])
            key_info = {
                "created_at": key_data["created_at"],
                "algorithm": key_data["algorithm"],
                "encrypted": key_data.get("encrypted", False),
                "signature_size": spec.signature_size,
                **self._serialize_public_key(key_data["public_key"]),
            }
            if key_data.get("encrypted") and "encrypted_private_key" in key_data:
                encryption_info = key_data["encrypted_private_key"]
                key_info["encryption_algorithm"] = encryption_info.get("algorithm", "Unknown")
                key_info["kdf"] = encryption_info.get("kdf", "Unknown")
            keys_info[key_id] = key_info
        return keys_info

    def generate_key_pair(
        self,
        key_id,
        password=None,
        store_encrypted=True,
        algorithm=None,
        overwrite=False,
    ):
        self._ensure_key_id_available(key_id, overwrite)
        spec = get_algorithm_spec(algorithm, self.config.default_algorithm)
        public_key, private_key = spec.module.generate_keypair()
        key_data = {
            "public_key": public_key,
            "created_at": utc_now_iso(),
            "encrypted": store_encrypted and password is not None,
            "algorithm": spec.name,
        }
        result = {
            "key_id": key_id,
            "algorithm": spec.name,
            "encrypted": key_data["encrypted"],
            **self._serialize_public_key(public_key),
        }
        if key_data["encrypted"]:
            encrypted_private_key = self._encrypt_private_key(private_key, password, spec.name)
            key_data["encrypted_private_key"] = encrypted_private_key
            result["encryption_info"] = {
                "algorithm": encrypted_private_key["algorithm"],
                "kdf": encrypted_private_key["kdf"],
                "kdf_iterations": encrypted_private_key["kdf_iterations"],
            }
        else:
            key_data["private_key"] = private_key
            result["private_key_b64"] = self._encode_bytes(private_key)
            result["private_key_size"] = len(private_key)

        self.key_storage[key_id] = key_data
        self._save_key_to_storage(key_id, key_data)
        self._log("info", "key_generated", key_id=key_id, algorithm=spec.name)
        return result

    def import_key(self, key_material, key_id=None, overwrite=False):
        payload = self._normalize_export_payload(key_material)
        target_key_id = key_id or payload.get("key_id")
        if not target_key_id:
            raise ValueError("key_id required for import")
        self._ensure_key_id_available(target_key_id, overwrite)

        public_key_b64 = payload.get("public_key_b64")
        if not public_key_b64:
            raise ValueError("public_key_b64 required")
        public_key = self._decode_bytes(public_key_b64)

        algorithm = payload.get("algorithm") or infer_algorithm_from_public_key(public_key)
        if algorithm is None:
            raise ValueError("Unable to determine ML-DSA algorithm for imported key")
        spec = get_algorithm_spec(algorithm, self.config.default_algorithm)

        private_key = None
        key_data = {
            "created_at": utc_now_iso(),
            "encrypted": False,
            "algorithm": spec.name,
            "public_key": public_key,
        }

        if "encrypted_private_key" in payload:
            encrypted_private_key = payload["encrypted_private_key"]
            signature_algorithm = encrypted_private_key.get("signature_algorithm")
            if signature_algorithm:
                normalize_algorithm_name(signature_algorithm, spec.name)
            key_data["encrypted_private_key"] = encrypted_private_key
            key_data["encrypted"] = True
        elif "private_key_b64" in payload:
            private_key = self._decode_bytes(payload["private_key_b64"])
            self._validate_key_sizes(spec.name, public_key, private_key)
            key_data["private_key"] = private_key
        else:
            raise ValueError("private_key_b64 or encrypted_private_key required")

        if private_key is None:
            self._validate_key_sizes(spec.name, public_key)
        self.key_storage[target_key_id] = key_data
        self._save_key_to_storage(target_key_id, key_data)
        self._log("info", "key_imported", key_id=target_key_id, algorithm=spec.name)
        return {
            "key_id": target_key_id,
            "algorithm": spec.name,
            "encrypted": key_data["encrypted"],
            **self._serialize_public_key(public_key),
        }

    def export_key(self, key_id, export_format="base64", password=None):
        if key_id not in self.key_storage:
            raise ValueError("Key not found")

        key_data = self.key_storage[key_id]
        export_format = "base64" if export_format == "pem" else export_format
        if export_format == "encrypted":
            if "encrypted_private_key" not in key_data:
                raise ValueError("Key is not encrypted")
            return {
                "key_id": key_id,
                "algorithm": key_data["algorithm"],
                "encrypted_private_key": key_data["encrypted_private_key"],
                **self._serialize_public_key(key_data["public_key"]),
            }

        if export_format == "base64":
            if key_data.get("encrypted", False):
                if not password:
                    raise ValueError("Password required for encrypted key")
                private_key = self._decrypt_private_key(
                    key_data["encrypted_private_key"], password
                )
            else:
                private_key = key_data["private_key"]
            return {
                "key_id": key_id,
                "algorithm": key_data["algorithm"],
                "encoding": "base64",
                "private_key_b64": self._encode_bytes(private_key),
                "private_key_size": len(private_key),
                **self._serialize_public_key(key_data["public_key"]),
            }

        raise ValueError("Invalid export format")

    def change_key_password(self, key_id, old_password, new_password):
        if key_id not in self.key_storage:
            raise ValueError("Key not found")

        key_data = self.key_storage[key_id]
        if not key_data.get("encrypted", False):
            raise ValueError("Key is not encrypted")

        private_key = self._decrypt_private_key(key_data["encrypted_private_key"], old_password)
        key_data["encrypted_private_key"] = self._encrypt_private_key(
            private_key, new_password, key_data["algorithm"]
        )
        self._save_key_to_storage(key_id, key_data)
        self._log("info", "key_password_changed", key_id=key_id)

    def sign_file(self, file_data, key_id, password=None):
        if key_id not in self.key_storage:
            raise ValueError(f"Key ID {key_id} not found")

        key_data = self.key_storage[key_id]
        spec = get_algorithm_spec(key_data["algorithm"])
        private_key = self._get_private_key(key_id, password)
        self._validate_key_sizes(spec.name, key_data["public_key"], private_key)

        file_hash = hashlib.sha256(file_data).hexdigest()
        signature = spec.module.sign(private_key, file_data)
        signature_id = hashlib.sha256(
            f"{key_id}{utc_now_iso()}{file_hash}".encode()
        ).hexdigest()[:16]
        signature_payload = {
            "signature": self._encode_bytes(signature),
            "file_hash": file_hash,
            "key_id": key_id,
            "timestamp": utc_now_iso(),
            "algorithm": spec.name,
            "file_size": len(file_data),
            "signature_size": len(signature),
            "key_encrypted": key_data.get("encrypted", False),
            "signature_input": "raw-file-bytes",
        }
        manifest = build_signature_manifest(signature_id, signature_payload)
        self.signatures_db[signature_id] = manifest
        self._save_signature_to_storage(signature_id, manifest)
        self._log("info", "file_signed", key_id=key_id, signature_id=signature_id)
        return signature_id, manifest

    def verify_signature(self, file_data, signature_payload, key_id=None):
        try:
            manifest = coerce_signature_manifest(signature_payload)
            key_id = key_id or manifest["key_id"]
            if key_id not in self.key_storage:
                return False, "Key not found", manifest

            key_data = self.key_storage[key_id]
            spec = get_algorithm_spec(key_data["algorithm"])
            manifest_algorithm = normalize_algorithm_name(manifest.get("algorithm"))
            if manifest_algorithm != spec.name:
                return (
                    False,
                    f"Signature algorithm {manifest_algorithm} does not match key algorithm {spec.name}",
                    manifest,
                )

            file_hash = hashlib.sha256(file_data).hexdigest()
            if file_hash != manifest["file_hash"]:
                return False, "File hash mismatch", manifest

            self._validate_key_sizes(spec.name, key_data["public_key"])
            signature = self._decode_bytes(manifest["signature"])
            if spec.module.verify(key_data["public_key"], file_data, signature):
                return True, "Signature valid", manifest
            return False, "Invalid signature", manifest
        except (ManifestError, ValueError) as exc:
            return False, f"Verification error: {exc}", None
        except Exception as exc:
            return False, f"Verification error: {exc}", None

    def patch_binary_with_manifest(self, file_data, signature_manifest):
        block = build_embedded_signature_block(signature_manifest)
        signature_json = json.dumps(block, indent=2)
        signature_bytes = signature_json.encode("utf-8")
        return file_data + PATCH_MARKER + signature_bytes + PATCH_END_MARKER

    def _extract_with_markers(self, patched_data, marker, end_marker):
        start_idx = patched_data.rfind(marker)
        end_idx = patched_data.rfind(end_marker)
        if start_idx == -1 or end_idx == -1 or end_idx < start_idx:
            return None, None

        signature_bytes = patched_data[start_idx + len(marker) : end_idx]
        original_data = patched_data[:start_idx]
        try:
            block = json.loads(signature_bytes.decode("utf-8"))
            if block.get("block_type") == EMBEDDED_SIGNATURE_BLOCK_TYPE:
                manifest = coerce_signature_manifest(block["signature_manifest"])
            else:
                manifest = coerce_signature_manifest(block, block.get("signature_id"))
            return original_data, manifest
        except Exception:
            return None, None

    def extract_signature_from_patched_binary(self, patched_data):
        for marker, end_marker in (
            (PATCH_MARKER, PATCH_END_MARKER),
            (LEGACY_PATCH_MARKER, LEGACY_PATCH_END_MARKER),
        ):
            original_data, manifest = self._extract_with_markers(
                patched_data, marker, end_marker
            )
            if original_data is not None and manifest is not None:
                return original_data, manifest
        return None, None

    def migrate_storage(self):
        report = {"keys_migrated": 0, "keys_skipped": 0, "signatures_migrated": 0, "signatures_skipped": 0}

        for key_id in self.storage.list_key_ids():
            record = self.storage.read_key_record(key_id)
            if record.get("schema_version") == KEY_RECORD_SCHEMA_VERSION and record.get("record_type") == KEY_RECORD_TYPE:
                continue
            key_data = self._load_key_from_storage(key_id)
            if key_data is None:
                report["keys_skipped"] += 1
                continue
            self._save_key_to_storage(key_id, key_data)
            report["keys_migrated"] += 1

        for signature_id in self.storage.list_signature_ids():
            record = self.storage.read_signature_record(signature_id)
            if record.get("schema_version") == SIGNATURE_RECORD_SCHEMA_VERSION and record.get("record_type") == SIGNATURE_RECORD_TYPE:
                continue
            manifest = self._load_signature_from_storage(signature_id)
            if manifest is None:
                report["signatures_skipped"] += 1
                continue
            self._save_signature_to_storage(signature_id, manifest)
            report["signatures_migrated"] += 1

        self._log("info", "storage_migrated", **report)
        return report
