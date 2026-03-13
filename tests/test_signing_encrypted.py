import json


def test_encrypted_key_requires_password_to_sign(client, upload, sample_file_bytes):
    response = client.post(
        "/generate-keys",
        json={
            "key_id": "encrypted-key",
            "algorithm": "ML-DSA-87",
            "password": "secret-123",
            "encrypt": True,
        },
    )
    assert response.status_code == 200
    assert response.json["data"]["encrypted"] is True

    response = client.post(
        "/sign-file",
        data={"key_id": "encrypted-key", "file": upload(payload=sample_file_bytes)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert "Password required" in response.json["error"]

    response = client.post(
        "/sign-file",
        data={
            "key_id": "encrypted-key",
            "password": "secret-123",
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["manifest"]["algorithm"] == "ML-DSA-87"


def test_export_and_import_base64_key_roundtrip(client, upload, sample_file_bytes):
    response = client.post(
        "/generate-keys",
        json={"key_id": "source-key", "algorithm": "ML-DSA-65", "encrypt": False},
    )
    assert response.status_code == 200

    response = client.post(
        "/export-key",
        json={"key_id": "source-key", "format": "base64"},
    )
    assert response.status_code == 200
    exported = response.json
    assert exported["algorithm"] == "ML-DSA-65"
    assert "private_key_b64" in exported

    response = client.post(
        "/import-key",
        json={
            "key_id": "imported-key",
            "overwrite": False,
            "key_material": exported,
        },
    )
    assert response.status_code == 200
    assert response.json["data"]["algorithm"] == "ML-DSA-65"

    response = client.post(
        "/sign-file",
        data={"key_id": "imported-key", "file": upload(payload=sample_file_bytes)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200

    manifest = response.json["manifest"]
    response = client.post(
        "/verify-signature",
        data={
            "key_id": "imported-key",
            "signature_data": json.dumps(manifest),
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["valid"] is True


def test_export_and_import_encrypted_key_roundtrip(client, upload, sample_file_bytes):
    client.post(
        "/generate-keys",
        json={
            "key_id": "enc-source",
            "algorithm": "ML-DSA-44",
            "encrypt": True,
            "password": "old-password",
        },
    )

    response = client.post(
        "/export-key",
        json={"key_id": "enc-source", "format": "encrypted"},
    )
    assert response.status_code == 200
    exported = response.json
    assert "encrypted_private_key" in exported

    response = client.post(
        "/import-key",
        json={"key_id": "enc-imported", "key_material": exported},
    )
    assert response.status_code == 200
    assert response.json["data"]["encrypted"] is True

    response = client.post(
        "/sign-file",
        data={
            "key_id": "enc-imported",
            "password": "old-password",
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200


def test_change_password_updates_encrypted_key(client, upload, sample_file_bytes):
    client.post(
        "/generate-keys",
        json={
            "key_id": "change-me",
            "algorithm": "ML-DSA-87",
            "encrypt": True,
            "password": "before",
        },
    )

    response = client.post(
        "/change-key-password",
        json={"key_id": "change-me", "old_password": "before", "new_password": "after"},
    )
    assert response.status_code == 200

    response = client.post(
        "/sign-file",
        data={
            "key_id": "change-me",
            "password": "after",
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200


def test_manifest_backward_compatibility_and_storage_migration(service, client, upload, sample_file_bytes):
    service.generate_key_pair("legacy-key", algorithm="ML-DSA-44", store_encrypted=False)
    signature_id, manifest = service.sign_file(sample_file_bytes, "legacy-key")

    legacy_key_record = {
        "key_id": "legacy-manual-key",
        "created_at": service.key_storage["legacy-key"]["created_at"],
        "algorithm": "ML-DSA-44",
        "encrypted": False,
        "public_key_b64": service._encode_bytes(service.key_storage["legacy-key"]["public_key"]),
        "private_key_b64": service._encode_bytes(service.key_storage["legacy-key"]["private_key"]),
    }
    service.storage.write_key_record("legacy-manual-key", legacy_key_record)

    legacy_signature_record = {
        "signature_id": signature_id,
        "signature_data": {
            key: value
            for key, value in manifest.items()
            if key not in {"schema_version", "manifest_type", "signature_id"}
        },
    }
    service.storage.write_signature_record(signature_id, legacy_signature_record)

    report = service.migrate_storage()
    assert report["keys_migrated"] >= 1
    assert report["signatures_migrated"] >= 1

    migrated_key = service.storage.read_key_record("legacy-manual-key")
    assert migrated_key["schema_version"] == 2
    assert migrated_key["record_type"] == "signing_key"

    migrated_signature = service.storage.read_signature_record(signature_id)
    assert migrated_signature["schema_version"] == 2
    assert migrated_signature["record_type"] == "signature_manifest"
    assert migrated_signature["manifest"]["manifest_type"] == "qsealnet.detached-signature"

    legacy_payload = legacy_signature_record["signature_data"]
    response = client.post(
        "/verify-signature",
        data={
            "key_id": "legacy-key",
            "signature_data": json.dumps(legacy_payload),
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["valid"] is True
