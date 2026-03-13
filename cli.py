#!/usr/bin/env python3
"""Command-line interface for the ML-DSA digital signing system."""

import argparse
import getpass
import json
import os
import sys
from pathlib import Path

import requests

DEFAULT_BASE_URL = os.getenv("QSEALNET_API_BASE_URL", "http://localhost:5000")
SUPPORTED_ALGORITHMS = ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"]
REQUEST_TIMEOUT = 10


def request_json(base_url, method, path, **kwargs):
    response = requests.request(method, f"{base_url}{path}", timeout=REQUEST_TIMEOUT, **kwargs)
    if not response.ok:
        try:
            payload = response.json()
            message = payload.get("error") or payload.get("message") or response.text
        except ValueError:
            message = response.text or response.reason
        raise RuntimeError(message)
    if not response.content:
        return {}
    return response.json()


def request_binary(base_url, path, **kwargs):
    response = requests.post(f"{base_url}{path}", timeout=REQUEST_TIMEOUT, **kwargs)
    if not response.ok:
        try:
            payload = response.json()
            message = payload.get("error") or payload.get("message") or response.text
        except ValueError:
            message = response.text or response.reason
        raise RuntimeError(message)
    return response.content


def check_server(base_url):
    try:
        response = requests.get(f"{base_url}/health", timeout=2)
        return response.status_code == 200
    except requests.RequestException:
        return False


def fetch_keys(base_url):
    return request_json(base_url, "GET", "/keys").get("keys", {})


def prompt_for_key_password(base_url, key_id):
    keys = fetch_keys(base_url)
    if key_id in keys and keys[key_id].get("encrypted"):
        return getpass.getpass("Enter password for encrypted private key: ")
    return None


def generate_key(base_url, key_id, encrypt=True, algorithm=None, overwrite=False):
    password = None
    if encrypt:
        password = getpass.getpass(
            "Enter password to encrypt private key (press Enter for no encryption): "
        )
        if not password.strip():
            password = None
            encrypt = False

    payload = {
        "key_id": key_id,
        "encrypt": encrypt,
        "overwrite": overwrite,
    }
    if algorithm:
        payload["algorithm"] = algorithm
    if password:
        payload["password"] = password

    result = request_json(base_url, "POST", "/generate-keys", json=payload)
    data = result["data"]
    print(f"Key '{data['key_id']}' generated")
    print(f"Algorithm: {data['algorithm']}")
    print(f"Encrypted: {data['encrypted']}")
    print(f"Public key size: {data['public_key_size']} bytes")
    if data["encrypted"]:
        encryption_info = data["encryption_info"]
        print(f"Encryption: {encryption_info['algorithm']} / {encryption_info['kdf']}")
    else:
        print(f"Private key size: {data['private_key_size']} bytes")
    return True


def import_key(base_url, key_export_path, key_id=None, overwrite=False):
    export_path = Path(key_export_path)
    if not export_path.exists():
        print(f"File not found: {export_path}")
        return False

    key_material = json.loads(export_path.read_text())
    result = request_json(
        base_url,
        "POST",
        "/import-key",
        json={
            "key_id": key_id,
            "overwrite": overwrite,
            "key_material": key_material,
        },
    )
    data = result["data"]
    print(f"Imported key '{data['key_id']}'")
    print(f"Algorithm: {data['algorithm']}")
    print(f"Encrypted: {data['encrypted']}")
    return True


def sign_file(base_url, file_path, key_id, output_path=None):
    target = Path(file_path)
    if not target.exists():
        print(f"File not found: {target}")
        return False

    password = prompt_for_key_password(base_url, key_id)
    output_path = Path(output_path) if output_path else Path(f"{target}.sig")

    with target.open("rb") as handle:
        result = request_json(
            base_url,
            "POST",
            "/sign-file",
            files={"file": (target.name, handle, "application/octet-stream")},
            data={k: v for k, v in {"key_id": key_id, "password": password}.items() if v},
        )

    output_path.write_text(json.dumps(result["manifest"], indent=2))
    print(f"Signed: {target}")
    print(f"Signature ID: {result['signature_id']}")
    print(f"Algorithm: {result['manifest']['algorithm']}")
    print(f"Manifest saved to: {output_path}")
    return True


def verify_file(base_url, file_path, signature_path=None, key_id=None):
    target = Path(file_path)
    if not target.exists():
        print(f"File not found: {target}")
        return False

    manifest_path = Path(signature_path) if signature_path else Path(f"{target}.sig")
    if not manifest_path.exists():
        print(f"Signature manifest not found: {manifest_path}")
        return False

    manifest = json.loads(manifest_path.read_text())
    with target.open("rb") as handle:
        result = request_json(
            base_url,
            "POST",
            "/verify-signature",
            files={"file": (target.name, handle, "application/octet-stream")},
            data={
                "signature_data": json.dumps(manifest),
                "key_id": key_id or manifest.get("key_id", ""),
            },
        )

    print(result["message"])
    if result["valid"]:
        print(f"Algorithm: {result['manifest']['algorithm']}")
        print(f"Key ID: {result['manifest']['key_id']}")
    return result["valid"]


def patch_binary(base_url, file_path, key_id, output_path=None):
    target = Path(file_path)
    if not target.exists():
        print(f"File not found: {target}")
        return False

    if output_path:
        destination = Path(output_path)
    elif target.suffix:
        destination = target.with_name(f"{target.stem}_signed{target.suffix}")
    else:
        destination = target.with_name(f"{target.name}_signed")

    password = prompt_for_key_password(base_url, key_id)
    with target.open("rb") as handle:
        payload = request_binary(
            base_url,
            "/patch-binary",
            files={"file": (target.name, handle, "application/octet-stream")},
            data={k: v for k, v in {"key_id": key_id, "password": password}.items() if v},
        )

    destination.write_bytes(payload)
    print(f"Patched binary saved to: {destination}")
    print(f"Original size: {target.stat().st_size} bytes")
    print(f"Patched size: {destination.stat().st_size} bytes")
    return True


def verify_patched_binary(base_url, file_path):
    target = Path(file_path)
    if not target.exists():
        print(f"File not found: {target}")
        return False

    with target.open("rb") as handle:
        result = request_json(
            base_url,
            "POST",
            "/verify-patched-binary",
            files={"file": (target.name, handle, "application/octet-stream")},
        )

    print(result["message"])
    if result["valid"]:
        signature_info = result["signature_info"]
        print(f"Algorithm: {signature_info['algorithm']}")
        print(f"Key ID: {signature_info['key_id']}")
        print(f"Timestamp: {signature_info['timestamp']}")
    return result["valid"]


def list_keys(base_url):
    keys = fetch_keys(base_url)
    if not keys:
        print("No keys found")
        return True

    print("Available keys:")
    for key_id, key_info in keys.items():
        status = "encrypted" if key_info["encrypted"] else "raw"
        print(
            f"  - {key_id} [{key_info['algorithm']}, {status}] "
            f"created={key_info['created_at']} pub={key_info['public_key_size']}B sig={key_info['signature_size']}B"
        )
    return True


def export_key(base_url, key_id, export_format="base64", output_path=None):
    password = None
    if export_format == "base64":
        password = prompt_for_key_password(base_url, key_id)

    payload = {"key_id": key_id, "format": export_format}
    if password:
        payload["password"] = password

    result = request_json(base_url, "POST", "/export-key", json=payload)
    destination = Path(output_path) if output_path else Path(f"{key_id}.{export_format}.json")
    destination.write_text(json.dumps(result, indent=2))
    print(f"Exported key '{key_id}' to: {destination}")
    print(f"Algorithm: {result['algorithm']}")
    return True


def change_key_password(base_url, key_id):
    old_password = getpass.getpass("Enter current password: ")
    new_password = getpass.getpass("Enter new password: ")
    confirm_password = getpass.getpass("Confirm new password: ")

    if new_password != confirm_password:
        print("Passwords do not match")
        return False

    request_json(
        base_url,
        "POST",
        "/change-key-password",
        json={
            "key_id": key_id,
            "old_password": old_password,
            "new_password": new_password,
        },
    )
    print(f"Password changed for key '{key_id}'")
    return True


def build_parser():
    parser = argparse.ArgumentParser(
        description="ML-DSA digital signing system CLI with manifest-aware workflows"
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Backend base URL (default: {DEFAULT_BASE_URL})",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    gen_parser = subparsers.add_parser("generate-key", help="Generate a new key pair")
    gen_parser.add_argument("key_id", help="Unique identifier for the key")
    gen_parser.add_argument(
        "--no-encrypt", action="store_true", help="Store private key unencrypted"
    )
    gen_parser.add_argument(
        "--algorithm",
        choices=SUPPORTED_ALGORITHMS,
        help="ML-DSA variant for the generated key",
    )
    gen_parser.add_argument(
        "--overwrite", action="store_true", help="Replace an existing key with the same ID"
    )

    import_parser = subparsers.add_parser("import-key", help="Import an exported key JSON file")
    import_parser.add_argument("key_export", help="Path to exported key JSON")
    import_parser.add_argument("--key-id", help="Override the imported key ID")
    import_parser.add_argument(
        "--overwrite", action="store_true", help="Replace an existing key with the same ID"
    )

    sign_parser = subparsers.add_parser("sign", help="Sign a file and save a detached manifest")
    sign_parser.add_argument("file", help="File to sign")
    sign_parser.add_argument("key_id", help="Key ID to use for signing")
    sign_parser.add_argument("--output", help="Path to save the detached manifest")

    verify_parser = subparsers.add_parser("verify", help="Verify a file against a detached manifest")
    verify_parser.add_argument("file", help="File to verify")
    verify_parser.add_argument("--signature", help="Manifest file (default: file.sig)")
    verify_parser.add_argument("--key-id", help="Override the key ID used for verification")

    patch_parser = subparsers.add_parser("patch", help="Patch a binary with an embedded signature")
    patch_parser.add_argument("file", help="File to patch")
    patch_parser.add_argument("key_id", help="Key ID to use for signing")
    patch_parser.add_argument("--output", help="Output file path")

    verify_patched_parser = subparsers.add_parser(
        "verify-patched", help="Verify a binary with an embedded signature"
    )
    verify_patched_parser.add_argument("file", help="Patched file to verify")

    subparsers.add_parser("list-keys", help="List stored keys")

    export_parser = subparsers.add_parser("export-key", help="Export a key to JSON")
    export_parser.add_argument("key_id", help="Key ID to export")
    export_parser.add_argument(
        "--format",
        choices=["base64", "encrypted"],
        default="base64",
        help="Export format",
    )
    export_parser.add_argument("--output", help="Destination JSON path")

    password_parser = subparsers.add_parser(
        "change-password", help="Rotate the password on an encrypted key"
    )
    password_parser.add_argument("key_id", help="Key ID to update")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    if not check_server(args.base_url):
        print("Server is not running. Start the backend with:")
        print("  cd backend && uv run main.py")
        sys.exit(1)

    try:
        if args.command == "generate-key":
            success = generate_key(
                args.base_url,
                args.key_id,
                encrypt=not args.no_encrypt,
                algorithm=args.algorithm,
                overwrite=args.overwrite,
            )
        elif args.command == "import-key":
            success = import_key(
                args.base_url,
                args.key_export,
                key_id=args.key_id,
                overwrite=args.overwrite,
            )
        elif args.command == "sign":
            success = sign_file(args.base_url, args.file, args.key_id, args.output)
        elif args.command == "verify":
            success = verify_file(args.base_url, args.file, args.signature, args.key_id)
        elif args.command == "patch":
            success = patch_binary(args.base_url, args.file, args.key_id, args.output)
        elif args.command == "verify-patched":
            success = verify_patched_binary(args.base_url, args.file)
        elif args.command == "list-keys":
            success = list_keys(args.base_url)
        elif args.command == "export-key":
            success = export_key(args.base_url, args.key_id, args.format, args.output)
        elif args.command == "change-password":
            success = change_key_password(args.base_url, args.key_id)
        else:
            parser.error(f"Unknown command: {args.command}")
            return
    except (RuntimeError, requests.RequestException, json.JSONDecodeError) as error:
        print(f"Error: {error}")
        success = False

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
