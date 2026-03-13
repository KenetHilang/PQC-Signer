from io import BytesIO
from pathlib import Path
import sys

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from app.config import AppConfig


@pytest.fixture()
def app(tmp_path):
    config = AppConfig(
        storage_dir=str(tmp_path / "keys"),
        signatures_dir=str(tmp_path / "signatures"),
        max_upload_size_bytes=2 * 1024 * 1024,
        pbkdf2_iterations=2_000,
        default_algorithm="ML-DSA-44",
        log_level="INFO",
    )
    return create_app(config)


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def service(app):
    return app.config["SIGNER_SERVICE"]


@pytest.fixture()
def sample_file_bytes():
    return b"q-sealnet sample payload\x00\x01\x02"


@pytest.fixture()
def upload(sample_file_bytes):
    def _make(name="sample.bin", payload=None):
        return BytesIO(payload or sample_file_bytes), name
    return _make
