'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import FileDropzone from '@/components/ui/file-dropzone';
import Pill from '@/components/ui/pill';
import SectionCard from '@/components/ui/section-card';
import ToastRegion from '@/components/ui/toast-region';
import { apiBinary, apiForm, apiGet, apiJson, API_BASE } from '@/lib/api';
import { downloadBlob, downloadJson } from '@/lib/download';
import { formatBytes, formatTimestamp, parseJsonInput, truncateMiddle } from '@/lib/formatters';
import type {
  ExportKeyResponse,
  ExportPreview,
  GenerateKeyResponse,
  HealthResponse,
  ImportKeyResponse,
  KeyInfo,
  KeysResponse,
  ServerInfoResponse,
  SignatureManifest,
  SignaturesResponse,
  SignResponse,
  ToastItem,
  ToastType,
  VariantProfile,
  VerifyPatchedResponse,
  VerifyResponse,
} from '@/lib/types';

interface GenerateFormState {
  keyId: string;
  algorithm: string;
  encrypt: boolean;
  password: string;
  overwrite: boolean;
}

interface ImportFormState {
  keyId: string;
  overwrite: boolean;
  payload: string;
}

interface SignFormState {
  keyId: string;
  password: string;
  file: File | null;
}

interface VerifyFormState {
  file: File | null;
  signatureFile: File | null;
  signatureText: string;
  keyId: string;
}

interface ExportFormState {
  keyId: string;
  format: 'base64' | 'encrypted';
  password: string;
}

interface ChangePasswordFormState {
  keyId: string;
  oldPassword: string;
  newPassword: string;
}

interface KeyEntry extends KeyInfo {
  keyId: string;
}

interface SignatureEntry extends SignatureManifest {
  signatureId: string;
}

const inputClass =
  'w-full rounded-2xl border border-[rgba(24,32,29,0.12)] bg-white/85 px-4 py-3 text-[color:var(--ink)] outline-none transition focus:-translate-y-px focus:border-[rgba(214,107,45,0.45)] focus:ring-4 focus:ring-[rgba(214,107,45,0.12)]';
const buttonClass =
  'rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#fff9f0] transition hover:-translate-y-px disabled:cursor-progress disabled:opacity-55';
const ghostButtonClass =
  'rounded-full bg-[rgba(24,32,29,0.08)] px-4 py-2.5 text-[color:var(--ink)] transition hover:-translate-y-px disabled:cursor-progress disabled:opacity-55';
const resultPanelBase =
  'mt-4 rounded-[18px] border border-white/50 p-4 shadow-[0_24px_60px_rgba(34,24,9,0.12)]';

function createToast(type: ToastType, message: string): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
  };
}

function buildPreview(exportPayload: ExportKeyResponse, format: ExportFormState['format']): ExportPreview {
  const preview: ExportPreview = {
    key_id: exportPayload.key_id,
    algorithm: exportPayload.algorithm,
    format,
    encrypted: Boolean(exportPayload.encrypted_private_key),
    public_key_size: exportPayload.public_key_size,
  };

  if (exportPayload.private_key_size) {
    preview.private_key_size = exportPayload.private_key_size;
  }
  if (exportPayload.encrypted_private_key) {
    preview.encryption_algorithm = exportPayload.encrypted_private_key.algorithm;
    preview.kdf = exportPayload.encrypted_private_key.kdf;
    preview.kdf_iterations = exportPayload.encrypted_private_key.kdf_iterations;
  }
  return preview;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

export default function Dashboard() {
  const [serverInfo, setServerInfo] = useState<ServerInfoResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [keys, setKeys] = useState<Record<string, KeyInfo>>({});
  const [signatures, setSignatures] = useState<Record<string, SignatureManifest>>({});
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    keyId: '',
    algorithm: '',
    encrypt: true,
    password: '',
    overwrite: false,
  });
  const [importForm, setImportForm] = useState<ImportFormState>({
    keyId: '',
    overwrite: false,
    payload: '',
  });
  const [signForm, setSignForm] = useState<SignFormState>({ keyId: '', password: '', file: null });
  const [verifyForm, setVerifyForm] = useState<VerifyFormState>({
    file: null,
    signatureFile: null,
    signatureText: '',
    keyId: '',
  });
  const [patchForm, setPatchForm] = useState<SignFormState>({ keyId: '', password: '', file: null });
  const [verifyPatchedFile, setVerifyPatchedFile] = useState<File | null>(null);
  const [exportForm, setExportForm] = useState<ExportFormState>({
    keyId: '',
    format: 'base64',
    password: '',
  });
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordFormState>({
    keyId: '',
    oldPassword: '',
    newPassword: '',
  });
  const [filters, setFilters] = useState({ variant: 'all', encryption: 'all' });
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [patchedResult, setPatchedResult] = useState<VerifyPatchedResponse | null>(null);

  const pushToast = useCallback((type: ToastType, message: string) => {
    const toast = createToast(type, message);
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== toast.id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [indexInfo, healthInfo, keysInfo, signaturesInfo] = await Promise.all([
        apiGet<ServerInfoResponse>('/'),
        apiGet<HealthResponse>('/health'),
        apiGet<KeysResponse>('/keys'),
        apiGet<SignaturesResponse>('/signatures'),
      ]);
      setServerInfo(indexInfo);
      setHealth(healthInfo);
      setKeys(keysInfo.keys || {});
      setSignatures(signaturesInfo.signatures || {});
      setGenerateForm((current) => ({
        ...current,
        algorithm:
          current.algorithm || indexInfo.security_features?.default_signature_algorithm || 'ML-DSA-44',
      }));
    } catch (error) {
      pushToast('error', `Failed to load backend data: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const supportedAlgorithms: string[] = serverInfo?.security_features?.supported_signature_algorithms || [
    'ML-DSA-44',
    'ML-DSA-65',
    'ML-DSA-87',
  ];
  const variantProfiles: Record<string, VariantProfile> =
    serverInfo?.security_features?.variant_profiles || {};

  const keyEntries = useMemo<KeyEntry[]>(
    () =>
      Object.entries(keys)
        .map(([keyId, info]) => ({ keyId, ...info }))
        .sort((left, right) => left.keyId.localeCompare(right.keyId)),
    [keys]
  );

  useEffect(() => {
    const firstKey = keyEntries[0]?.keyId || '';
    if (firstKey) {
      setSignForm((current) => ({ ...current, keyId: current.keyId || firstKey }));
      setPatchForm((current) => ({ ...current, keyId: current.keyId || firstKey }));
      setExportForm((current) => ({ ...current, keyId: current.keyId || firstKey }));
      setChangePasswordForm((current) => ({ ...current, keyId: current.keyId || firstKey }));
    }
  }, [keyEntries]);

  const filteredKeys = useMemo<KeyEntry[]>(() => {
    return keyEntries.filter((entry) => {
      const variantMatch = filters.variant === 'all' || entry.algorithm === filters.variant;
      const encryptionMatch =
        filters.encryption === 'all' ||
        (filters.encryption === 'encrypted' ? entry.encrypted : !entry.encrypted);
      return variantMatch && encryptionMatch;
    });
  }, [filters.encryption, filters.variant, keyEntries]);

  const signatureEntries = useMemo<SignatureEntry[]>(
    () =>
      Object.entries(signatures)
        .map(([signatureId, info]) => ({ signatureId, ...info }))
        .sort(
          (left, right) =>
            new Date(right.timestamp || 0).valueOf() - new Date(left.timestamp || 0).valueOf()
        )
        .slice(0, 6),
    [signatures]
  );

  function withBusy<Args extends unknown[]>(label: string, fn: (...args: Args) => Promise<void>) {
    return async (...args: Args) => {
      setBusyAction(label);
      try {
        await fn(...args);
      } catch (error) {
        pushToast('error', getErrorMessage(error));
      } finally {
        setBusyAction('');
      }
    };
  }

  const handleGenerateKey = withBusy('generate-key', async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!generateForm.keyId.trim()) {
      pushToast('error', 'Key ID is required.');
      return;
    }

    const response = await apiJson<GenerateKeyResponse>('/generate-keys', {
      body: {
        key_id: generateForm.keyId,
        algorithm: generateForm.algorithm,
        encrypt: generateForm.encrypt,
        password: generateForm.encrypt ? generateForm.password || undefined : undefined,
        overwrite: generateForm.overwrite,
      },
    });

    pushToast('success', `Generated ${response.data.algorithm} key ${response.data.key_id}.`);
    setGenerateForm((current) => ({ ...current, keyId: '', password: '', overwrite: false }));
    await refreshData();
  });

  const handleImportKey = withBusy('import-key', async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!importForm.payload.trim()) {
      pushToast('error', 'Paste an exported key JSON payload first.');
      return;
    }

    const keyMaterial = parseJsonInput<ExportKeyResponse>(importForm.payload);
    const response = await apiJson<ImportKeyResponse>('/import-key', {
      body: {
        key_id: importForm.keyId || undefined,
        overwrite: importForm.overwrite,
        key_material: keyMaterial,
      },
    });

    pushToast('success', `Imported key ${response.data.key_id}.`);
    setImportForm({ keyId: '', overwrite: false, payload: '' });
    await refreshData();
  });

  const handleSign = withBusy('sign-file', async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signForm.file || !signForm.keyId) {
      pushToast('error', 'Select a file and a key.');
      return;
    }

    const formData = new FormData();
    formData.append('file', signForm.file);
    formData.append('key_id', signForm.keyId);
    if (signForm.password) {
      formData.append('password', signForm.password);
    }

    const response = await apiForm<SignResponse>('/sign-file', formData);
    downloadJson(response.manifest, `${signForm.file.name}.sig`);
    pushToast('success', `Detached manifest written for ${signForm.file.name}.`);
    await refreshData();
  });

  const handleVerifySignature = withBusy(
    'verify-signature',
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!verifyForm.file) {
        pushToast('error', 'Choose a file to verify.');
        return;
      }

      let signaturePayloadText = verifyForm.signatureText.trim();
      if (!signaturePayloadText && verifyForm.signatureFile) {
        signaturePayloadText = await verifyForm.signatureFile.text();
        setVerifyForm((current) => ({ ...current, signatureText: signaturePayloadText }));
      }

      if (!signaturePayloadText) {
        pushToast('error', 'Provide a signature manifest JSON payload.');
        return;
      }

      const manifest = parseJsonInput<SignatureManifest>(signaturePayloadText);
      const formData = new FormData();
      formData.append('file', verifyForm.file);
      formData.append('signature_data', JSON.stringify(manifest));
      if (verifyForm.keyId.trim()) {
        formData.append('key_id', verifyForm.keyId.trim());
      }

      const response = await apiForm<VerifyResponse>('/verify-signature', formData);
      setVerifyResult(response);
      pushToast(response.valid ? 'success' : 'warning', response.message);
    }
  );

  const handlePatch = withBusy('patch-binary', async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patchForm.file || !patchForm.keyId) {
      pushToast('error', 'Select a file and a key.');
      return;
    }

    const formData = new FormData();
    formData.append('file', patchForm.file);
    formData.append('key_id', patchForm.keyId);
    if (patchForm.password) {
      formData.append('password', patchForm.password);
    }

    const blob = await apiBinary('/patch-binary', formData);
    const targetName = patchForm.file.name.includes('.')
      ? patchForm.file.name.replace(/(\.[^.]+)$/u, '_signed$1')
      : `${patchForm.file.name}_signed`;
    downloadBlob(blob, targetName);
    pushToast('success', `Embedded signature written into ${targetName}.`);
    await refreshData();
  });

  const handleVerifyPatched = withBusy(
    'verify-patched',
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!verifyPatchedFile) {
        pushToast('error', 'Choose a patched binary first.');
        return;
      }

      const formData = new FormData();
      formData.append('file', verifyPatchedFile);
      const response = await apiForm<VerifyPatchedResponse>('/verify-patched-binary', formData);
      setPatchedResult(response);
      pushToast(response.valid ? 'success' : 'warning', response.message);
    }
  );

  const requestExport = withBusy('export-key', async (download: boolean) => {
    if (!exportForm.keyId) {
      pushToast('error', 'Select a key to export.');
      return;
    }

    const response = await apiJson<ExportKeyResponse>('/export-key', {
      body: {
        key_id: exportForm.keyId,
        format: exportForm.format,
        password: exportForm.password || undefined,
      },
    });

    setExportPreview(buildPreview(response, exportForm.format));
    if (download) {
      downloadJson(response, `${response.key_id}.${exportForm.format}.json`);
      pushToast('success', `Exported ${response.key_id} as ${exportForm.format}.`);
    } else {
      pushToast('success', `Prepared ${response.key_id} export preview.`);
    }
  });

  const handleChangePassword = withBusy(
    'change-password',
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (
        !changePasswordForm.keyId ||
        !changePasswordForm.oldPassword ||
        !changePasswordForm.newPassword
      ) {
        pushToast('error', 'Fill every password field.');
        return;
      }

      await apiJson<{ success: boolean; message: string }>('/change-key-password', {
        body: {
          key_id: changePasswordForm.keyId,
          old_password: changePasswordForm.oldPassword,
          new_password: changePasswordForm.newPassword,
        },
      });

      pushToast('success', `Password rotated for ${changePasswordForm.keyId}.`);
      setChangePasswordForm((current) => ({ ...current, oldPassword: '', newPassword: '' }));
      await refreshData();
    }
  );

  return (
    <main className="mx-auto w-[min(1440px,calc(100vw-20px))] pb-8 pt-4 md:w-[min(1440px,calc(100vw-32px))] md:pb-16 md:pt-7">
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />

      <section
        className="relative grid gap-6 overflow-hidden rounded-[32px] border border-white/50 px-5 py-5 text-[#fef8ef] shadow-[0_24px_60px_rgba(34,24,9,0.12)] md:grid-cols-[minmax(0,1.5fr)_minmax(280px,420px)] md:px-7 md:py-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(28, 33, 30, 0.95), rgba(46, 58, 53, 0.88)), linear-gradient(180deg, rgba(214, 107, 45, 0.08), transparent 80%)',
        }}
      >
        <div
          className="pointer-events-none absolute -bottom-[35%] -right-[20%] h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(214, 107, 45, 0.22), transparent 68%)' }}
        />
        <div className="relative z-10">
          <p className="mb-2 text-[0.8rem] uppercase tracking-[0.18em] text-[rgba(255,248,239,0.74)]">
            Post-Quantum Signing Workbench
          </p>
          <h1 className="m-0 text-[clamp(2.4rem,14vw,6rem)] leading-[0.94]">Q-SealNet</h1>
          <p className="mt-4 max-w-[58ch] text-[1.05rem] leading-7 text-[rgba(255,248,239,0.84)]">
            Generate ML-DSA keys, export manifests, patch binaries, and inspect variant tradeoffs from one surface.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Pill variant="accent">API {API_BASE}</Pill>
            <Pill variant={health?.status === 'healthy' ? 'success' : 'warning'}>
              {health?.status || 'loading'}
            </Pill>
            <Pill>{serverInfo?.security_features?.private_key_encryption || 'AES-256-GCM'}</Pill>
          </div>
        </div>
        <div className="grid gap-3.5">
          {[
            { label: 'Keys', value: health?.keys_count ?? '-' },
            { label: 'Signatures', value: health?.signatures_count ?? '-' },
            {
              label: 'Upload limit',
              value: formatBytes(serverInfo?.security_features?.max_upload_size_bytes),
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[18px] border border-[rgba(255,250,241,0.14)] bg-white/8 px-5 py-4 backdrop-blur"
            >
              <span className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[rgba(255,248,239,0.72)]">
                {item.label}
              </span>
              <strong className="text-[clamp(1.8rem,4vw,2.6rem)]">{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {supportedAlgorithms.map((algorithm) => {
          const profile = variantProfiles[algorithm] || {};
          const isDefault = algorithm === serverInfo?.security_features?.default_signature_algorithm;
          return (
            <article
              key={algorithm}
              className="rounded-[28px] border border-white/50 bg-[rgba(255,250,241,0.92)] p-5 shadow-[0_24px_60px_rgba(34,24,9,0.12)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <h2 className="m-0 text-2xl leading-tight">{algorithm}</h2>
                <Pill variant={isDefault ? 'accent' : 'default'}>{isDefault ? 'default' : 'supported'}</Pill>
              </div>
              <dl className="mt-5 grid gap-3 md:grid-cols-3">
                <div>
                  <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Public key</dt>
                  <dd className="m-0 text-lg">{formatBytes(profile.public_key_size)}</dd>
                </div>
                <div>
                  <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Private key</dt>
                  <dd className="m-0 text-lg">{formatBytes(profile.private_key_size)}</dd>
                </div>
                <div>
                  <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Signature</dt>
                  <dd className="m-0 text-lg">{formatBytes(profile.signature_size)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SectionCard
          eyebrow="Key Creation"
          title="Generate keys"
          description="Select a variant, decide whether to encrypt the secret key, and optionally overwrite an existing record."
          tone="accent"
        >
          <form className="grid gap-4" onSubmit={handleGenerateKey}>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Key ID</span>
              <input
                className={inputClass}
                value={generateForm.keyId}
                onChange={(event) => setGenerateForm((current) => ({ ...current, keyId: event.target.value }))}
                placeholder="release-signing"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Variant</span>
                <select
                  className={inputClass}
                  value={generateForm.algorithm}
                  onChange={(event) =>
                    setGenerateForm((current) => ({ ...current, algorithm: event.target.value }))
                  }
                >
                  {supportedAlgorithms.map((algorithm) => (
                    <option key={algorithm} value={algorithm}>
                      {algorithm}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Encryption</span>
                <select
                  className={inputClass}
                  value={generateForm.encrypt ? 'encrypted' : 'raw'}
                  onChange={(event) =>
                    setGenerateForm((current) => ({
                      ...current,
                      encrypt: event.target.value === 'encrypted',
                    }))
                  }
                >
                  <option value="encrypted">Encrypted private key</option>
                  <option value="raw">Raw private key</option>
                </select>
              </label>
            </div>
            {generateForm.encrypt ? (
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Password</span>
                <input
                  className={inputClass}
                  type="password"
                  value={generateForm.password}
                  onChange={(event) =>
                    setGenerateForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Required to encrypt the key"
                />
              </label>
            ) : null}
            <label className="flex items-center gap-2.5 text-[color:var(--muted)]">
              <input
                checked={generateForm.overwrite}
                className="accent-[var(--accent)]"
                onChange={(event) =>
                  setGenerateForm((current) => ({ ...current, overwrite: event.target.checked }))
                }
                type="checkbox"
              />
              <span>Allow overwrite for an existing key ID.</span>
            </label>
            <button className={buttonClass} type="submit" disabled={busyAction === 'generate-key'}>
              {busyAction === 'generate-key' ? 'Generating...' : 'Generate key pair'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Key Import"
          title="Import exported key JSON"
          description="Paste a base64 or encrypted export. Override the key ID only when you need to rename it on import."
        >
          <form className="grid gap-4" onSubmit={handleImportKey}>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Override key ID</span>
              <input
                className={inputClass}
                value={importForm.keyId}
                onChange={(event) => setImportForm((current) => ({ ...current, keyId: event.target.value }))}
                placeholder="Leave empty to keep the exported key ID"
              />
            </label>
            <label className="flex items-center gap-2.5 text-[color:var(--muted)]">
              <input
                checked={importForm.overwrite}
                className="accent-[var(--accent)]"
                onChange={(event) =>
                  setImportForm((current) => ({ ...current, overwrite: event.target.checked }))
                }
                type="checkbox"
              />
              <span>Replace an existing key with the same ID.</span>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Export payload</span>
              <textarea
                className={`${inputClass} min-h-40 resize-y text-[0.92rem] leading-6`}
                rows={8}
                value={importForm.payload}
                onChange={(event) => setImportForm((current) => ({ ...current, payload: event.target.value }))}
                placeholder='{"key_id":"team-key","algorithm":"ML-DSA-65",...}'
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </label>
            <button className={ghostButtonClass} type="submit" disabled={busyAction === 'import-key'}>
              {busyAction === 'import-key' ? 'Importing...' : 'Import key'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Detached Signing"
          title="Sign a file"
          description="Signs raw file bytes and downloads a detached manifest JSON payload."
          tone="accent"
        >
          <form className="grid gap-4" onSubmit={handleSign}>
            <FileDropzone
              label="Input file"
              file={signForm.file}
              onFileSelect={(file) => setSignForm((current) => ({ ...current, file }))}
            />
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Signing key</span>
              <select
                className={inputClass}
                value={signForm.keyId}
                onChange={(event) => setSignForm((current) => ({ ...current, keyId: event.target.value }))}
              >
                <option value="">Select key</option>
                {keyEntries.map((entry) => (
                  <option key={entry.keyId} value={entry.keyId}>
                    {entry.keyId} · {entry.algorithm} · {entry.encrypted ? 'encrypted' : 'raw'}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Password</span>
              <input
                className={inputClass}
                type="password"
                value={signForm.password}
                onChange={(event) => setSignForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Only required for encrypted keys"
              />
            </label>
            <button className={buttonClass} type="submit" disabled={busyAction === 'sign-file'}>
              {busyAction === 'sign-file' ? 'Signing...' : 'Sign and download manifest'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Detached Verification"
          title="Verify a manifest"
          description="Upload the original file plus a manifest JSON file, or paste a manifest payload directly."
        >
          <form className="grid gap-4" onSubmit={handleVerifySignature}>
            <FileDropzone
              label="Original file"
              file={verifyForm.file}
              onFileSelect={(file) => setVerifyForm((current) => ({ ...current, file }))}
            />
            <FileDropzone
              accept="application/json,.json,.sig"
              label="Manifest JSON"
              file={verifyForm.signatureFile}
              onFileSelect={(file) => setVerifyForm((current) => ({ ...current, signatureFile: file }))}
            />
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Manual key override</span>
              <input
                className={inputClass}
                value={verifyForm.keyId}
                onChange={(event) => setVerifyForm((current) => ({ ...current, keyId: event.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Manifest payload</span>
              <textarea
                className={`${inputClass} min-h-40 resize-y text-[0.92rem] leading-6`}
                rows={8}
                value={verifyForm.signatureText}
                onChange={(event) =>
                  setVerifyForm((current) => ({ ...current, signatureText: event.target.value }))
                }
                placeholder='{"manifest_type":"qsealnet.detached-signature",...}'
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </label>
            <button
              className={ghostButtonClass}
              type="submit"
              disabled={busyAction === 'verify-signature'}
            >
              {busyAction === 'verify-signature' ? 'Verifying...' : 'Verify manifest'}
            </button>
          </form>
          {verifyResult ? (
            <div
              className={resultPanelBase}
              style={{
                background: verifyResult.valid
                  ? 'linear-gradient(180deg, rgba(31, 122, 91, 0.12), rgba(255, 255, 255, 0.92))'
                  : 'linear-gradient(180deg, rgba(181, 109, 16, 0.12), rgba(255, 255, 255, 0.92))',
              }}
            >
              <strong>{verifyResult.message}</strong>
              <p className="mt-2 text-[color:var(--muted)]">
                {verifyResult.manifest.algorithm} · {truncateMiddle(verifyResult.manifest.file_hash, 12, 10)}
              </p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          eyebrow="Embedded Signing"
          title="Patch a binary"
          description="Embeds a manifest block into the output artifact so it can be verified without a detached file."
        >
          <form className="grid gap-4" onSubmit={handlePatch}>
            <FileDropzone
              label="Binary to patch"
              file={patchForm.file}
              onFileSelect={(file) => setPatchForm((current) => ({ ...current, file }))}
            />
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Signing key</span>
              <select
                className={inputClass}
                value={patchForm.keyId}
                onChange={(event) => setPatchForm((current) => ({ ...current, keyId: event.target.value }))}
              >
                <option value="">Select key</option>
                {keyEntries.map((entry) => (
                  <option key={entry.keyId} value={entry.keyId}>
                    {entry.keyId} · {entry.algorithm}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Password</span>
              <input
                className={inputClass}
                type="password"
                value={patchForm.password}
                onChange={(event) => setPatchForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Only required for encrypted keys"
              />
            </label>
            <button className={buttonClass} type="submit" disabled={busyAction === 'patch-binary'}>
              {busyAction === 'patch-binary' ? 'Patching...' : 'Patch and download binary'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Embedded Verification"
          title="Verify a patched binary"
          description="Extracts the appended manifest block, recomputes the original file hash, and verifies the ML-DSA signature."
        >
          <form className="grid gap-4" onSubmit={handleVerifyPatched}>
            <FileDropzone
              label="Patched binary"
              file={verifyPatchedFile}
              onFileSelect={setVerifyPatchedFile}
            />
            <button className={ghostButtonClass} type="submit" disabled={busyAction === 'verify-patched'}>
              {busyAction === 'verify-patched' ? 'Verifying...' : 'Verify embedded signature'}
            </button>
          </form>
          {patchedResult ? (
            <div
              className={resultPanelBase}
              style={{
                background: patchedResult.valid
                  ? 'linear-gradient(180deg, rgba(31, 122, 91, 0.12), rgba(255, 255, 255, 0.92))'
                  : 'linear-gradient(180deg, rgba(181, 109, 16, 0.12), rgba(255, 255, 255, 0.92))',
              }}
            >
              <strong>{patchedResult.message}</strong>
              <p className="mt-2 text-[color:var(--muted)]">
                {patchedResult.signature_info.algorithm} · {patchedResult.signature_info.key_id} ·{' '}
                {formatBytes(patchedResult.file_info.signature_size)} embedded data
              </p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          eyebrow="Key Vault"
          title="Manage stored keys"
          description="Filter by variant or encryption state, preview export metadata, and rotate passwords for encrypted keys."
          actions={
            <button className={ghostButtonClass} type="button" onClick={() => void refreshData()}>
              Refresh
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(180px,240px))]">
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Variant</span>
              <select
                className={inputClass}
                value={filters.variant}
                onChange={(event) => setFilters((current) => ({ ...current, variant: event.target.value }))}
              >
                <option value="all">All</option>
                {supportedAlgorithms.map((algorithm) => (
                  <option key={algorithm} value={algorithm}>
                    {algorithm}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Encryption</span>
              <select
                className={inputClass}
                value={filters.encryption}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, encryption: event.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="encrypted">Encrypted</option>
                <option value="raw">Raw</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {filteredKeys.length ? (
              filteredKeys.map((entry) => (
                <article
                  key={entry.keyId}
                  className="rounded-[18px] border border-white/50 bg-[rgba(255,250,241,0.92)] p-4 shadow-[0_24px_60px_rgba(34,24,9,0.12)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <strong>{entry.keyId}</strong>
                    <div className="flex flex-wrap gap-2">
                      <Pill>{entry.algorithm}</Pill>
                      <Pill variant={entry.encrypted ? 'warning' : 'success'}>
                        {entry.encrypted ? 'encrypted' : 'raw'}
                      </Pill>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Created</dt>
                      <dd className="m-0 leading-6">{formatTimestamp(entry.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Public key</dt>
                      <dd className="m-0 leading-6">{formatBytes(entry.public_key_size)}</dd>
                    </div>
                    <div>
                      <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Signature size</dt>
                      <dd className="m-0 leading-6">{formatBytes(entry.signature_size)}</dd>
                    </div>
                    <div>
                      <dt className="mb-2 block text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Key digest</dt>
                      <dd className="m-0 leading-6">{truncateMiddle(entry.public_key_b64, 12, 10)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            ) : (
              <p className="text-[color:var(--muted)]">No keys match the current filters.</p>
            )}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
              <h3 className="m-0 text-xl">Export</h3>
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Key</span>
                <select
                  className={inputClass}
                  value={exportForm.keyId}
                  onChange={(event) => setExportForm((current) => ({ ...current, keyId: event.target.value }))}
                >
                  <option value="">Select key</option>
                  {keyEntries.map((entry) => (
                    <option key={entry.keyId} value={entry.keyId}>
                      {entry.keyId}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Format</span>
                  <select
                    className={inputClass}
                    value={exportForm.format}
                    onChange={(event) =>
                      setExportForm((current) => ({
                        ...current,
                        format: event.target.value as ExportFormState['format'],
                      }))
                    }
                  >
                    <option value="base64">base64</option>
                    <option value="encrypted">encrypted</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Password</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={exportForm.password}
                    onChange={(event) =>
                      setExportForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Needed for base64 export of encrypted keys"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button className={ghostButtonClass} type="button" onClick={() => void requestExport(false)}>
                  Preview
                </button>
                <button
                  className={ghostButtonClass}
                  type="button"
                  onClick={() => void requestExport(true)}
                  style={{ background: 'var(--ink)', color: '#fff7ed' }}
                >
                  Download
                </button>
              </div>
            </form>

            <div className="rounded-[18px] border border-white/50 bg-[rgba(255,250,241,0.92)] p-4 shadow-[0_24px_60px_rgba(34,24,9,0.12)]">
              <h3 className="m-0 text-xl">Export preview</h3>
              {exportPreview ? (
                <pre
                  className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--muted)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {JSON.stringify(exportPreview, null, 2)}
                </pre>
              ) : (
                <p className="mt-3 text-[color:var(--muted)]">No export prepared yet.</p>
              )}
            </div>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleChangePassword}>
            <h3 className="m-0 text-xl">Rotate encrypted key password</h3>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Key</span>
                <select
                  className={inputClass}
                  value={changePasswordForm.keyId}
                  onChange={(event) =>
                    setChangePasswordForm((current) => ({ ...current, keyId: event.target.value }))
                  }
                >
                  <option value="">Select key</option>
                  {keyEntries
                    .filter((entry) => entry.encrypted)
                    .map((entry) => (
                      <option key={entry.keyId} value={entry.keyId}>
                        {entry.keyId}
                      </option>
                    ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">Old password</span>
                <input
                  className={inputClass}
                  type="password"
                  value={changePasswordForm.oldPassword}
                  onChange={(event) =>
                    setChangePasswordForm((current) => ({ ...current, oldPassword: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[0.85rem] uppercase tracking-[0.06em] text-[color:var(--muted)]">New password</span>
                <input
                  className={inputClass}
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(event) =>
                    setChangePasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                />
              </label>
            </div>
            <button className={ghostButtonClass} type="submit" disabled={busyAction === 'change-password'}>
              {busyAction === 'change-password' ? 'Updating...' : 'Rotate password'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Service View"
          title="Recent signature manifests"
          description="The backend persists manifests as versioned JSON records. This gives you a quick audit view without opening the storage directory."
        >
          {loading ? <p className="text-[color:var(--muted)]">Loading...</p> : null}
          <div className="mt-5 grid gap-4 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {signatureEntries.length ? (
              signatureEntries.map((entry) => (
                <article
                  key={entry.signature_id || entry.signatureId}
                  className="rounded-[18px] border border-white/50 bg-[rgba(255,250,241,0.92)] p-4 shadow-[0_24px_60px_rgba(34,24,9,0.12)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <strong>{entry.signature_id || entry.signatureId}</strong>
                    <Pill>{entry.algorithm}</Pill>
                  </div>
                  <p className="mt-2 text-[color:var(--muted)]">{entry.key_id}</p>
                  <p className="mt-2 text-[color:var(--muted)]">{formatTimestamp(entry.timestamp)}</p>
                  <p className="mt-2 text-[color:var(--muted)]">{truncateMiddle(entry.file_hash, 14, 12)}</p>
                </article>
              ))
            ) : (
              <p className="text-[color:var(--muted)]">No signature manifests persisted yet.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
