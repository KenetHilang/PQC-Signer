import hashlib
import io

from flask import Blueprint, current_app, jsonify, send_file
from werkzeug.exceptions import RequestEntityTooLarge

from .manifest import coerce_signature_manifest, get_signature_payload
from .validation import (
    ChangePasswordRequest,
    ExportKeyRequest,
    GenerateKeyRequest,
    ImportKeyRequest,
    SignFormRequest,
    ValidationError,
    VerifyPatchedBinaryRequest,
    VerifySignatureFormRequest,
)
from .service import DuplicateKeyError


api = Blueprint("api", __name__)


def get_service():
    return current_app.config["SIGNER_SERVICE"]


@api.route("/")
def index():
    service = get_service()
    return jsonify(
        {
            "message": "ML-DSA digital signing service with encrypted key storage",
            "endpoints": {
                "generate_keys": "/generate-keys",
                "import_key": "/import-key",
                "sign_file": "/sign-file",
                "verify_signature": "/verify-signature",
                "patch_binary": "/patch-binary",
                "verify_patched_binary": "/verify-patched-binary",
                "list_keys": "/keys",
                "export_key": "/export-key",
                "change_key_password": "/change-key-password",
                "list_signatures": "/signatures",
            },
            "security_features": service.get_security_features(),
        }
    )


@api.route("/generate-keys", methods=["POST"])
def generate_keys():
    payload = GenerateKeyRequest.from_request()
    service = get_service()
    result = service.generate_key_pair(
        payload.key_id,
        password=payload.password,
        store_encrypted=payload.encrypt,
        algorithm=payload.algorithm,
        overwrite=payload.overwrite,
    )
    return jsonify({"success": True, "data": result})


@api.route("/import-key", methods=["POST"])
def import_key():
    payload = ImportKeyRequest.from_request()
    result = get_service().import_key(
        payload.key_material,
        key_id=payload.key_id,
        overwrite=payload.overwrite,
    )
    return jsonify({"success": True, "data": result})


@api.route("/sign-file", methods=["POST"])
def sign_file():
    payload = SignFormRequest.from_request()
    signature_id, manifest = get_service().sign_file(
        payload.file_data,
        payload.key_id,
        payload.password,
    )
    return jsonify(
        {
            "success": True,
            "signature_id": signature_id,
            "manifest": manifest,
            "signature_data": manifest,
            "file_info": {
                "filename": payload.filename,
                "size": len(payload.file_data),
                "hash": manifest["file_hash"],
            },
        }
    )


@api.route("/verify-signature", methods=["POST"])
def verify_signature():
    payload = VerifySignatureFormRequest.from_request()
    valid, message, manifest = get_service().verify_signature(
        payload.file_data,
        payload.signature_payload,
        payload.key_id,
    )
    return jsonify(
        {
            "success": True,
            "valid": valid,
            "message": message,
            "manifest": manifest,
            "file_info": {
                "filename": payload.filename,
                "size": len(payload.file_data),
                "hash": hashlib.sha256(payload.file_data).hexdigest(),
            },
        }
    )


@api.route("/patch-binary", methods=["POST"])
def patch_binary():
    payload = SignFormRequest.from_request()
    _, manifest = get_service().sign_file(payload.file_data, payload.key_id, payload.password)
    patched_data = get_service().patch_binary_with_manifest(payload.file_data, manifest)
    return send_file(
        io.BytesIO(patched_data),
        as_attachment=True,
        download_name=f"signed_{payload.filename}",
        mimetype="application/octet-stream",
    )


@api.route("/verify-patched-binary", methods=["POST"])
def verify_patched_binary():
    payload = VerifyPatchedBinaryRequest.from_request()
    original_data, manifest = get_service().extract_signature_from_patched_binary(
        payload.file_data
    )
    if original_data is None or manifest is None:
        return jsonify({"success": False, "error": "No valid signature found in file"}), 400

    valid, message, manifest = get_service().verify_signature(original_data, manifest)
    return jsonify(
        {
            "success": True,
            "valid": valid,
            "message": message,
            "signature_info": manifest,
            "file_info": {
                "filename": payload.filename,
                "original_size": len(original_data),
                "patched_size": len(payload.file_data),
                "signature_size": len(payload.file_data) - len(original_data),
            },
        }
    )


@api.route("/keys", methods=["GET"])
def list_keys():
    return jsonify({"success": True, "keys": get_service().list_keys_info()})


@api.route("/export-key", methods=["POST"])
def export_key():
    payload = ExportKeyRequest.from_request()
    result = get_service().export_key(
        payload.key_id,
        export_format=payload.export_format,
        password=payload.password,
    )
    return jsonify({"success": True, **result})


@api.route("/change-key-password", methods=["POST"])
def change_key_password():
    payload = ChangePasswordRequest.from_request()
    get_service().change_key_password(
        payload.key_id, payload.old_password, payload.new_password
    )
    return jsonify(
        {
            "success": True,
            "message": "Password changed successfully",
            "key_id": payload.key_id,
        }
    )


@api.route("/signatures", methods=["GET"])
def list_signatures():
    return jsonify({"success": True, "signatures": get_service().signatures_db})


@api.route("/health", methods=["GET"])
def health_check():
    service = get_service()
    return jsonify(
        {
            "status": "healthy",
            "keys_count": len(service.key_storage),
            "signatures_count": len(service.signatures_db),
        }
    )


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"success": False, "error": str(error)}), 400

    @app.errorhandler(DuplicateKeyError)
    def handle_duplicate_key_error(error):
        return jsonify({"success": False, "error": str(error)}), 409

    @app.errorhandler(RequestEntityTooLarge)
    def handle_request_too_large(error):
        return jsonify({"success": False, "error": "Uploaded file exceeds server limit"}), 413

    @app.errorhandler(ValueError)
    def handle_value_error(error):
        return jsonify({"success": False, "error": str(error)}), 400

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("unexpected_error", extra={"event": "unexpected_error", "details": {}})
        return jsonify({"success": False, "error": "Internal server error"}), 500
