from dataclasses import dataclass
import os

from .algorithms import SUPPORTED_ALGORITHMS, normalize_algorithm_name

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_KEYS_DIR = os.path.join(BASE_DIR, "keys")
DEFAULT_SIGNATURES_DIR = os.path.join(BASE_DIR, "signatures")
DEFAULT_MAX_UPLOAD_SIZE_MB = 32
DEFAULT_PBKDF2_ITERATIONS = 100_000
DEFAULT_LOG_LEVEL = "INFO"


@dataclass(frozen=True)
class AppConfig:
    storage_dir: str
    signatures_dir: str
    max_upload_size_bytes: int
    pbkdf2_iterations: int
    default_algorithm: str
    log_level: str

    @property
    def supported_algorithms(self):
        return list(SUPPORTED_ALGORITHMS.keys())


    @classmethod
    def from_env(cls):
        max_upload_size_mb = int(
            os.getenv("MAX_UPLOAD_SIZE_MB", str(DEFAULT_MAX_UPLOAD_SIZE_MB))
        )
        return cls(
            storage_dir=os.getenv("KEYS_STORAGE_DIR", DEFAULT_KEYS_DIR),
            signatures_dir=os.getenv("SIGNATURES_STORAGE_DIR", DEFAULT_SIGNATURES_DIR),
            max_upload_size_bytes=max_upload_size_mb * 1024 * 1024,
            pbkdf2_iterations=int(
                os.getenv("PBKDF2_ITERATIONS", str(DEFAULT_PBKDF2_ITERATIONS))
            ),
            default_algorithm=normalize_algorithm_name(
                os.getenv("ML_DSA_DEFAULT_VARIANT", "ML-DSA-44")
            ),
            log_level=os.getenv("LOG_LEVEL", DEFAULT_LOG_LEVEL).upper(),
        )
