import json

import pytest


@pytest.mark.parametrize("algorithm", ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"])
def test_full_sign_verify_patch_roundtrip(client, upload, sample_file_bytes, algorithm):
    response = client.post(
        "/generate-keys",
        json={"key_id": f"key-{algorithm}", "algorithm": algorithm, "encrypt": False},
    )
    assert response.status_code == 200
    assert response.json["data"]["algorithm"] == algorithm

    response = client.post(
        "/sign-file",
        data={"key_id": f"key-{algorithm}", "file": upload(payload=sample_file_bytes)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    manifest = response.json["manifest"]
    assert manifest["algorithm"] == algorithm
    assert manifest["signature_id"] == response.json["signature_id"]

    response = client.post(
        "/verify-signature",
        data={
            "key_id": f"key-{algorithm}",
            "signature_data": json.dumps(manifest),
            "file": upload(payload=sample_file_bytes),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["valid"] is True
    assert response.json["manifest"]["algorithm"] == algorithm

    response = client.post(
        "/patch-binary",
        data={"key_id": f"key-{algorithm}", "file": upload(payload=sample_file_bytes)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200

    patched_binary = response.data
    response = client.post(
        "/verify-patched-binary",
        data={"file": upload(name="patched.bin", payload=patched_binary)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["valid"] is True
    assert response.json["signature_info"]["algorithm"] == algorithm


def test_duplicate_key_generation_requires_overwrite(client):
    response = client.post(
        "/generate-keys",
        json={"key_id": "duplicate-key", "algorithm": "ML-DSA-44", "encrypt": False},
    )
    assert response.status_code == 200

    response = client.post(
        "/generate-keys",
        json={"key_id": "duplicate-key", "algorithm": "ML-DSA-65", "encrypt": False},
    )
    assert response.status_code == 409
    assert "overwrite=true" in response.json["error"]

    response = client.post(
        "/generate-keys",
        json={
            "key_id": "duplicate-key",
            "algorithm": "ML-DSA-65",
            "encrypt": False,
            "overwrite": True,
        },
    )
    assert response.status_code == 200
    assert response.json["data"]["algorithm"] == "ML-DSA-65"


def test_verify_detects_tampering(client, upload, sample_file_bytes):
    client.post(
        "/generate-keys",
        json={"key_id": "tamper-key", "algorithm": "ML-DSA-44", "encrypt": False},
    )
    sign_response = client.post(
        "/sign-file",
        data={"key_id": "tamper-key", "file": upload(payload=sample_file_bytes)},
        content_type="multipart/form-data",
    )
    manifest = sign_response.json["manifest"]

    response = client.post(
        "/verify-signature",
        data={
            "key_id": "tamper-key",
            "signature_data": json.dumps(manifest),
            "file": upload(payload=sample_file_bytes + b"tampered"),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.json["valid"] is False
    assert response.json["message"] == "File hash mismatch"


def test_health_and_index_expose_supported_algorithms(client):
    response = client.get("/")
    assert response.status_code == 200
    features = response.json["security_features"]
    assert features["default_signature_algorithm"] == "ML-DSA-44"
    assert features["supported_signature_algorithms"] == [
        "ML-DSA-44",
        "ML-DSA-65",
        "ML-DSA-87",
    ]
    assert set(features["variant_profiles"].keys()) == {
        "ML-DSA-44",
        "ML-DSA-65",
        "ML-DSA-87",
    }

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json["status"] == "healthy"
