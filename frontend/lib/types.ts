export type ToastType = 'success' | 'warning' | 'error';

export interface VariantProfile {
  public_key_size: number;
  private_key_size: number;
  signature_size: number;
}

export interface SecurityFeatures {
  private_key_encryption: string;
  key_derivation: string;
  kdf_iterations: number;
  default_signature_algorithm: string;
  signature_algorithm: string;
  supported_signature_algorithms: string[];
  variant_profiles: Record<string, VariantProfile>;
  hash_algorithm: string;
  public_key_size_bytes: number;
  private_key_size_bytes: number;
  signature_size_bytes: number;
  max_upload_size_bytes: number;
}

export interface ServerInfoResponse {
  message: string;
  endpoints: Record<string, string>;
  security_features: SecurityFeatures;
}

export interface HealthResponse {
  status: string;
  keys_count: number;
  signatures_count: number;
}

export interface KeyInfo {
  created_at: string;
  algorithm: string;
  encrypted: boolean;
  signature_size: number;
  encoding: string;
  public_key_b64: string;
  public_key_size: number;
  encryption_algorithm?: string;
  kdf?: string;
}

export interface KeysResponse {
  success: boolean;
  keys: Record<string, KeyInfo>;
}

export interface SignatureManifest {
  schema_version?: number;
  manifest_type?: string;
  signature_id?: string;
  signature: string;
  file_hash: string;
  key_id: string;
  timestamp: string;
  algorithm: string;
  file_size: number;
  signature_size?: number;
  key_encrypted?: boolean;
  signature_input?: string;
}

export interface SignaturesResponse {
  success: boolean;
  signatures: Record<string, SignatureManifest>;
}

export interface SignResponse {
  success: boolean;
  signature_id: string;
  manifest: SignatureManifest;
  signature_data: SignatureManifest;
  file_info: {
    filename: string;
    size: number;
    hash: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  valid: boolean;
  message: string;
  manifest: SignatureManifest;
  file_info: {
    filename: string;
    size: number;
    hash: string;
  };
}

export interface VerifyPatchedResponse {
  success: boolean;
  valid: boolean;
  message: string;
  signature_info: SignatureManifest;
  file_info: {
    filename: string;
    original_size: number;
    patched_size: number;
    signature_size: number;
  };
}

export interface GenerateKeyResponse {
  success: boolean;
  data: {
    key_id: string;
    algorithm: string;
    encrypted: boolean;
    encoding: string;
    public_key_b64: string;
    public_key_size: number;
    private_key_b64?: string;
    private_key_size?: number;
  };
}

export interface ImportKeyResponse {
  success: boolean;
  data: {
    key_id: string;
    algorithm: string;
    encrypted: boolean;
    encoding: string;
    public_key_b64: string;
    public_key_size: number;
  };
}

export interface ExportKeyResponse {
  key_id: string;
  algorithm: string;
  encoding?: string;
  public_key_b64: string;
  public_key_size: number;
  private_key_b64?: string;
  private_key_size?: number;
  encrypted_private_key?: {
    algorithm: string;
    kdf: string;
    kdf_iterations: number;
    nonce: string;
    salt: string;
    ciphertext: string;
    tag: string;
    signature_algorithm?: string;
    content_type?: string;
    content_encoding?: string;
  };
}

export interface ExportPreview {
  key_id: string;
  algorithm: string;
  format: string;
  encrypted: boolean;
  public_key_size?: number;
  private_key_size?: number;
  encryption_algorithm?: string;
  kdf?: string;
  kdf_iterations?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}
