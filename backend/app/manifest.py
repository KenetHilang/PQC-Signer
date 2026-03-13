from copy import deepcopy
from datetime import UTC, datetime

MANIFEST_SCHEMA_VERSION = 2
MANIFEST_TYPE = "qsealnet.detached-signature"
EMBEDDED_SIGNATURE_BLOCK_TYPE = "qsealnet.embedded-signature"


def utc_now_iso():
    return datetime.now(UTC).isoformat()


REQUIRED_SIGNATURE_FIELDS = {
    "signature",
    "file_hash",
    "key_id",
    "timestamp",
    "algorithm",
    "file_size",
}


class ManifestError(ValueError):
    pass


def build_signature_manifest(signature_id, signature_payload):
    manifest = {
        "schema_version": MANIFEST_SCHEMA_VERSION,
        "manifest_type": MANIFEST_TYPE,
        "signature_id": signature_id,
        **deepcopy(signature_payload),
    }
    return manifest


def build_embedded_signature_block(signature_manifest):
    return {
        "schema_version": MANIFEST_SCHEMA_VERSION,
        "block_type": EMBEDDED_SIGNATURE_BLOCK_TYPE,
        "signed_at": signature_manifest.get("timestamp", utc_now_iso()),
        "signature_manifest": deepcopy(signature_manifest),
    }


def coerce_signature_manifest(payload, default_signature_id=None):
    if not isinstance(payload, dict):
        raise ManifestError("Signature payload must be a JSON object")

    if payload.get("manifest_type") == MANIFEST_TYPE:
        manifest = deepcopy(payload)
        if default_signature_id and "signature_id" not in manifest:
            manifest["signature_id"] = default_signature_id
        return manifest

    if "signature_manifest" in payload and isinstance(payload["signature_manifest"], dict):
        manifest = coerce_signature_manifest(payload["signature_manifest"], default_signature_id)
        return manifest

    if "signature_data" in payload and isinstance(payload["signature_data"], dict):
        return coerce_signature_manifest(payload["signature_data"], default_signature_id)

    missing = REQUIRED_SIGNATURE_FIELDS.difference(payload)
    if missing:
        missing_fields = ", ".join(sorted(missing))
        raise ManifestError(f"Signature manifest missing fields: {missing_fields}")

    manifest = {
        "schema_version": payload.get("schema_version", MANIFEST_SCHEMA_VERSION),
        "manifest_type": MANIFEST_TYPE,
        "signature_id": payload.get("signature_id", default_signature_id),
        "signature": payload["signature"],
        "file_hash": payload["file_hash"],
        "key_id": payload["key_id"],
        "timestamp": payload["timestamp"],
        "algorithm": payload["algorithm"],
        "file_size": payload["file_size"],
        "signature_size": payload.get("signature_size"),
        "key_encrypted": payload.get("key_encrypted", False),
        "signature_input": payload.get("signature_input", "raw-file-bytes"),
    }
    return manifest


def get_signature_payload(signature_manifest):
    manifest = coerce_signature_manifest(signature_manifest)
    return {
        key: value
        for key, value in manifest.items()
        if key not in {"schema_version", "manifest_type", "signature_id"}
    }
