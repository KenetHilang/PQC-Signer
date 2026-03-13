from dataclasses import dataclass

from pqcrypto.sign import ml_dsa_44, ml_dsa_65, ml_dsa_87


@dataclass(frozen=True)
class AlgorithmSpec:
    name: str
    module: object
    public_key_size: int
    private_key_size: int
    signature_size: int


SUPPORTED_ALGORITHMS = {
    "ML-DSA-44": AlgorithmSpec(
        name="ML-DSA-44",
        module=ml_dsa_44,
        public_key_size=ml_dsa_44.PUBLIC_KEY_SIZE,
        private_key_size=ml_dsa_44.SECRET_KEY_SIZE,
        signature_size=ml_dsa_44.SIGNATURE_SIZE,
    ),
    "ML-DSA-65": AlgorithmSpec(
        name="ML-DSA-65",
        module=ml_dsa_65,
        public_key_size=ml_dsa_65.PUBLIC_KEY_SIZE,
        private_key_size=ml_dsa_65.SECRET_KEY_SIZE,
        signature_size=ml_dsa_65.SIGNATURE_SIZE,
    ),
    "ML-DSA-87": AlgorithmSpec(
        name="ML-DSA-87",
        module=ml_dsa_87,
        public_key_size=ml_dsa_87.PUBLIC_KEY_SIZE,
        private_key_size=ml_dsa_87.SECRET_KEY_SIZE,
        signature_size=ml_dsa_87.SIGNATURE_SIZE,
    ),
}


ALGORITHM_ALIASES = {}
for canonical in SUPPORTED_ALGORITHMS:
    suffix = canonical.rsplit("-", 1)[-1]
    aliases = {
        canonical,
        canonical.lower(),
        canonical.replace("-", "_"),
        canonical.lower().replace("-", "_"),
        suffix,
        f"ml-dsa-{suffix}",
        f"ml_dsa_{suffix}",
        f"ML_DSA_{suffix}",
        f"mldsa{suffix}",
        f"MLDSA{suffix}",
    }
    for alias in aliases:
        ALGORITHM_ALIASES[alias.lower()] = canonical


def normalize_algorithm_name(algorithm_name, default=None):
    if algorithm_name is None or not str(algorithm_name).strip():
        if default is not None:
            return default
        raise ValueError("ML-DSA variant is required")

    normalized = str(algorithm_name).strip().lower()
    try:
        return ALGORITHM_ALIASES[normalized]
    except KeyError as exc:
        raise ValueError(f"Unsupported ML-DSA variant: {algorithm_name}") from exc


def get_algorithm_spec(algorithm_name, default=None):
    canonical = normalize_algorithm_name(algorithm_name, default)
    return SUPPORTED_ALGORITHMS[canonical]


def infer_algorithm_from_public_key(public_key):
    for spec in SUPPORTED_ALGORITHMS.values():
        if len(public_key) == spec.public_key_size:
            return spec.name
    return None


def infer_algorithm_from_private_key(private_key):
    for spec in SUPPORTED_ALGORITHMS.values():
        if len(private_key) == spec.private_key_size:
            return spec.name
    return None


def get_variant_profiles():
    return {
        name: {
            "public_key_size": spec.public_key_size,
            "private_key_size": spec.private_key_size,
            "signature_size": spec.signature_size,
        }
        for name, spec in SUPPORTED_ALGORITHMS.items()
    }
