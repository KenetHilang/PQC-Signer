from dataclasses import dataclass
from datetime import datetime
import json

from flask import request


class ValidationError(ValueError):
    pass


def _parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValidationError(f"Invalid boolean value: {value}")


def _required_string(payload, field_name):
    value = payload.get(field_name)
    if value is None or not str(value).strip():
        raise ValidationError(f"{field_name} required")
    return str(value).strip()


def _optional_string(payload, field_name):
    value = payload.get(field_name)
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def parse_json_request():
    payload = request.get_json(silent=True)
    if payload is None:
        raise ValidationError("JSON body required")
    if not isinstance(payload, dict):
        raise ValidationError("JSON body must be an object")
    return payload


@dataclass(frozen=True)
class GenerateKeyRequest:
    key_id: str
    password: str | None
    encrypt: bool
    algorithm: str | None
    overwrite: bool

    @classmethod
    def from_request(cls):
        payload = parse_json_request()
        return cls(
            key_id=payload.get("key_id")
            or f"key_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            password=_optional_string(payload, "password"),
            encrypt=_parse_bool(payload.get("encrypt"), True),
            algorithm=_optional_string(payload, "algorithm")
            or _optional_string(payload, "variant"),
            overwrite=_parse_bool(payload.get("overwrite"), False),
        )


@dataclass(frozen=True)
class ExportKeyRequest:
    key_id: str
    password: str | None
    export_format: str

    @classmethod
    def from_request(cls):
        payload = parse_json_request()
        export_format = _optional_string(payload, "format") or "base64"
        return cls(
            key_id=_required_string(payload, "key_id"),
            password=_optional_string(payload, "password"),
            export_format=export_format,
        )


@dataclass(frozen=True)
class ChangePasswordRequest:
    key_id: str
    old_password: str
    new_password: str

    @classmethod
    def from_request(cls):
        payload = parse_json_request()
        return cls(
            key_id=_required_string(payload, "key_id"),
            old_password=_required_string(payload, "old_password"),
            new_password=_required_string(payload, "new_password"),
        )


@dataclass(frozen=True)
class ImportKeyRequest:
    key_material: dict
    key_id: str | None
    overwrite: bool

    @classmethod
    def from_request(cls):
        payload = parse_json_request()
        key_material = payload.get("key_material") or payload.get("key_export")
        if not isinstance(key_material, dict):
            raise ValidationError("key_material must be an object")
        return cls(
            key_material=key_material,
            key_id=_optional_string(payload, "key_id"),
            overwrite=_parse_bool(payload.get("overwrite"), False),
        )


@dataclass(frozen=True)
class SignFormRequest:
    file_data: bytes
    filename: str
    key_id: str
    password: str | None

    @classmethod
    def from_request(cls):
        if "file" not in request.files:
            raise ValidationError("No file provided")
        file = request.files["file"]
        key_id = request.form.get("key_id")
        if not key_id:
            raise ValidationError("key_id required")
        return cls(
            file_data=file.read(),
            filename=file.filename,
            key_id=key_id,
            password=request.form.get("password") or None,
        )


@dataclass(frozen=True)
class VerifySignatureFormRequest:
    file_data: bytes
    filename: str
    signature_payload: dict
    key_id: str | None

    @classmethod
    def from_request(cls):
        if "file" not in request.files:
            raise ValidationError("No file provided")
        file = request.files["file"]
        signature_data = request.form.get("signature_data")
        if not signature_data:
            raise ValidationError("signature_data required")
        try:
            payload = json.loads(signature_data)
        except json.JSONDecodeError as exc:
            raise ValidationError("signature_data must be valid JSON") from exc

        return cls(
            file_data=file.read(),
            filename=file.filename,
            signature_payload=payload,
            key_id=request.form.get("key_id") or None,
        )


@dataclass(frozen=True)
class VerifyPatchedBinaryRequest:
    file_data: bytes
    filename: str

    @classmethod
    def from_request(cls):
        if "file" not in request.files:
            raise ValidationError("No file provided")
        file = request.files["file"]
        return cls(file_data=file.read(), filename=file.filename)
