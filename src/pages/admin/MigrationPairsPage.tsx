import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { migrationPairsService } from '@/api/migrationPairs';
import { plansService } from '@/api/plans';
import { bannersService } from '@/api/banners';
import { usersService } from '@/api/users';
import { ApiError } from '@/api/client';
import { extractList, normalizePlatform } from '@/utils/platformMap';
import type {
  ApiPlan,
  ApiPlanPrice,
  BannerEntity,
  MigrationPairEntity,
  CreateMigrationPairRequest,
  UpdateMigrationPairRequest,
  MigrationEnvironment,
  MigrationPairAssignee,
  UserProfile,
} from '@/types/api';
import { Modal } from '@/components/admin/Modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENV_OPTIONS: MigrationEnvironment[] = ['PRODUCTION', 'STAGING', 'DEVELOPMENT'];

function autoDisplayName(source: string, destination: string): string {
  const src = source.trim();
  const dst = destination.trim();
  if (!src && !dst) return '';
  return `${normalizePlatform(src || '…')} → ${normalizePlatform(dst || '…')}`;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white disabled:bg-bg-light disabled:text-text-tertiary';

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-text-secondary">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative flex-shrink-0 mt-0.5">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div
        className={`w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-border'}`}
      />
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </div>
    <div>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
    </div>
  </label>
);

const StatusBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-400'}`} />
    {label}
  </span>
);

const EnvBadge: React.FC<{ env: MigrationEnvironment }> = ({ env }) => {
  const color = env === 'PRODUCTION' ? 'bg-blue-50 text-blue-700' : env === 'STAGING' ? 'bg-yellow-50 text-yellow-700' : 'bg-purple-50 text-purple-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{env}</span>;
};

// ─── Shared form sections ─────────────────────────────────────────────────────

interface PairFormFields {
  source: string;
  destination: string;
  displayName: string;
  serviceUrl: string;
  fallbackServiceUrl: string;
  apiVersion: string;
  healthCheckPath: string;
  environment: MigrationEnvironment;
  isActive: boolean;
  isMaintenance: boolean;
  isFree: boolean;
  enquiryEmails: string[];
  sourceLogoId: number | null;
  destinationLogoId: number | null;
  assigneeIds: number[];
}

// ─── Assignee picker (Operation Team / users this pair is assigned to) ────────

interface AssigneeOption {
  id: number;
  name: string;
  email: string | null;
  isOpTeam: boolean;
  inactive: boolean;
}

const roleNames = (u: UserProfile): string[] =>
  ((u.roles ?? []) as unknown[]).map((r) =>
    typeof r === 'string' ? r : ((r as { role?: { name?: string } })?.role?.name ?? ''),
  );

const userOption = (u: UserProfile): AssigneeOption => ({
  id: u.id,
  name: `${u.firstname} ${u.lastname}`.trim() || (u.email ?? `User #${u.id}`),
  email: u.email,
  isOpTeam: roleNames(u).includes('OP_TEAM'),
  inactive: u.status !== 'Active',
});

const AssigneePicker: React.FC<{
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  users: UserProfile[];
  /** Already-assigned people, so an assignee who was later deactivated still shows (and can be removed). */
  existing?: MigrationPairAssignee[];
  disabledReason?: string;
}> = ({ selectedIds, onChange, users, existing = [], disabledReason }) => {
  const [query, setQuery] = useState('');

  const options = React.useMemo(() => {
    const byId = new Map<number, AssigneeOption>();
    users.filter((u) => u.status === 'Active').forEach((u) => byId.set(u.id, userOption(u)));
    existing.forEach((a) =>
      byId.set(a.id, {
        id: a.id,
        name: a.name,
        email: a.email,
        isOpTeam: a.isOpTeam,
        inactive: a.status !== 'Active',
      }),
    );
    return [...byId.values()].sort(
      (a, b) => Number(b.isOpTeam) - Number(a.isOpTeam) || a.name.localeCompare(b.name),
    );
  }, [users, existing]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? options.filter((o) => `${o.name} ${o.email ?? ''}`.toLowerCase().includes(q))
    : options;

  const toggle = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <Field
      label="Assigned team"
      hint="Operation Team members or users this tool is assigned to. Used by migration features later."
    >
      {disabledReason ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{disabledReason}</p>
      ) : (
        <div className="border border-border rounded-lg">
          <input
            className="w-full px-3 py-2 text-sm border-b border-border rounded-t-lg focus:outline-none"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-44 overflow-y-auto divide-y divide-border">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-text-secondary">No matching users</p>
            ) : (
              visible.map((o) => (
                <label key={o.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-bg-light">
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggle(o.id)} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-text-primary">{o.name}</span>
                    <span className="block truncate text-[11px] text-text-secondary">{o.email}</span>
                  </span>
                  {o.isOpTeam && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">Operation Team</span>
                  )}
                  {o.inactive && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">Inactive</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      )}
      <p className="text-[11px] text-text-secondary">{selectedIds.length} selected</p>
    </Field>
  );
};

const LogoSelect: React.FC<{
  label: string;
  logos: BannerEntity[];
  value: number | null;
  onChange: (id: number | null) => void;
}> = ({ label, logos, value, onChange }) => {
  const selected = logos.find((l) => l.id === value) ?? null;
  return (
    <Field label={label} hint="Pick from uploaded Tool Logos.">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-md border border-border bg-bg-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {selected ? (
            <img src={selected.image} alt={selected.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-text-secondary text-[10px]">—</span>
          )}
        </div>
        <select
          className={`${inputCls} flex-1`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— None —</option>
          {logos.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    </Field>
  );
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ENQUIRY_EMAILS = 20;

/**
 * Chip-style multi-email input. Splits on comma/whitespace/newline so pasting
 * a whole team list at once works, not just one-at-a-time typing. Mirrors the
 * backend's own normalize+validate rules (trim, lowercase, de-dupe, reject a
 * malformed address instead of silently dropping it) so what the admin sees
 * here always matches what will actually be saved.
 */
const EmailListInput: React.FC<{
  values: string[];
  onChange: (emails: string[]) => void;
}> = ({ values, onChange }) => {
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');

  const addCandidates = (raw: string) => {
    const candidates = raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (candidates.length === 0) return;

    const next = [...values];
    for (const email of candidates) {
      if (!EMAIL_RE.test(email)) {
        setErr(`"${email}" doesn't look like a valid email address.`);
        return;
      }
      if (next.length >= MAX_ENQUIRY_EMAILS) {
        setErr(`Up to ${MAX_ENQUIRY_EMAILS} addresses.`);
        return;
      }
      if (!next.includes(email)) next.push(email);
    }
    setErr('');
    setDraft('');
    onChange(next);
  };

  const remove = (email: string) => onChange(values.filter((v) => v !== email));

  return (
    <Field
      label="Enquiry emails"
      hint={`Who gets notified for this pair (e.g. "Ask MMC to Review" requests). Press Enter or paste a list — up to ${MAX_ENQUIRY_EMAILS}.`}
    >
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-light border border-border rounded-full text-text-primary"
          >
            {email}
            <button
              type="button"
              onClick={() => remove(email)}
              aria-label={`Remove ${email}`}
              className="text-text-secondary hover:text-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        className={inputCls}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); if (err) setErr(''); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCandidates(draft); }
        }}
        onBlur={() => draft.trim() && addCandidates(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (/[\s,;]/.test(text)) { e.preventDefault(); addCandidates(text); }
        }}
        placeholder={values.length >= MAX_ENQUIRY_EMAILS ? `Maximum ${MAX_ENQUIRY_EMAILS} reached` : 'ops@example.com'}
        disabled={values.length >= MAX_ENQUIRY_EMAILS}
      />
      {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
    </Field>
  );
};

const PairFormBody: React.FC<{
  values: PairFormFields;
  onChange: (patch: Partial<PairFormFields>) => void;
  logos: BannerEntity[];
  users: UserProfile[];
  existingAssignees?: MigrationPairAssignee[];
  assigneeNote?: string;
  /** The pair has a country price list: prices (and which countries are free) come from it, not from the switch below. */
  priced?: boolean;
  sourceReadOnly?: boolean;
  destinationReadOnly?: boolean;
}> = ({ values, onChange, logos, users, existingAssignees, assigneeNote, priced = false, sourceReadOnly = false, destinationReadOnly = false }) => {
  const handleSourceChange = (src: string) => {
    const auto = autoDisplayName(src, values.destination);
    onChange({ source: src, displayName: auto });
  };
  const handleDestinationChange = (dst: string) => {
    const auto = autoDisplayName(values.source, dst);
    onChange({ destination: dst, displayName: auto });
  };

  return (
    <div className="space-y-4">
      {/* Source / Destination */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source" required>
          <input
            className={inputCls}
            value={values.source}
            onChange={(e) => handleSourceChange(e.target.value)}
            placeholder="xero"
            required
            disabled={sourceReadOnly}
          />
        </Field>
        <Field label="Destination" required>
          <input
            className={inputCls}
            value={values.destination}
            onChange={(e) => handleDestinationChange(e.target.value)}
            placeholder="qbo"
            required
            disabled={destinationReadOnly}
          />
        </Field>
      </div>

      {/* Display name — auto-populated, still editable */}
      <Field label="Display name" required hint="Auto-generated from source → destination. Edit to override.">
        <input
          className={inputCls}
          value={values.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          placeholder="Xero → QBO"
          required
        />
      </Field>

      {/* Service URLs */}
      <Field label="Service URL" required>
        <input
          className={inputCls}
          value={values.serviceUrl}
          onChange={(e) => onChange({ serviceUrl: e.target.value })}
          placeholder="https://service.example.com"
          required
        />
      </Field>
      <Field label="Fallback service URL">
        <input
          className={inputCls}
          value={values.fallbackServiceUrl}
          onChange={(e) => onChange({ fallbackServiceUrl: e.target.value })}
          placeholder="https://fallback.example.com"
        />
      </Field>

      {/* API version + health check */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="API version">
          <input
            className={inputCls}
            value={values.apiVersion}
            onChange={(e) => onChange({ apiVersion: e.target.value })}
            placeholder="v1"
          />
        </Field>
        <Field label="Health check path">
          <input
            className={inputCls}
            value={values.healthCheckPath}
            onChange={(e) => onChange({ healthCheckPath: e.target.value })}
            placeholder="/health"
          />
        </Field>
      </div>

      {/* Environment */}
      <Field label="Environment">
        <select
          className={inputCls}
          value={values.environment}
          onChange={(e) => onChange({ environment: e.target.value as MigrationEnvironment })}
        >
          {ENV_OPTIONS.map((env) => <option key={env} value={env}>{env}</option>)}
        </select>
      </Field>


      <AssigneePicker
        selectedIds={values.assigneeIds}
        onChange={(ids) => onChange({ assigneeIds: ids })}
        users={users}
        existing={existingAssignees}
        disabledReason={assigneeNote}
      />

      {/* Source / destination brand logos */}
      <div className="grid grid-cols-2 gap-3">
        <LogoSelect
          label="Source logo"
          logos={logos}
          value={values.sourceLogoId}
          onChange={(id) => onChange({ sourceLogoId: id })}
        />
        <LogoSelect
          label="Destination logo"
          logos={logos}
          value={values.destinationLogoId}
          onChange={(id) => onChange({ destinationLogoId: id })}
        />
      </div>

      {/* Toggles */}
      <div className="pt-2 space-y-3 border-t border-border">
        <Toggle
          checked={values.isActive}
          onChange={(v) => onChange({ isActive: v })}
          label="Active"
          description="Visible and selectable by users on the public site."
        />
        <Toggle
          checked={values.isMaintenance}
          onChange={(v) => onChange({ isMaintenance: v })}
          label="Maintenance mode"
          description="Temporarily hides the pair from users without deleting it."
        />
        <Toggle
          checked={values.isFree}
          onChange={(v) => onChange({ isFree: v })}
          label="Free migration"
          description={
            priced
              ? 'No effect on this pair: it has a country price list, so customers pay (or not) per country as listed. Operation Team members never pay.'
              : 'Skip the payment step — users can start migrating at no charge.'
          }
        />
      </div>

      {/* Enquiry emails */}
      <div className="pt-4 border-t border-border">
        <EmailListInput
          values={values.enquiryEmails}
          onChange={(enquiryEmails) => onChange({ enquiryEmails })}
        />
      </div>
    </div>
  );
};

/**
 * What a plan costs on a pair, for the admin: a pair with a country price list is priced from it (the plan's own
 * price is only a default there), so say that instead of showing a number that is never charged.
 */
const planPriceText = (plan: ApiPlan, rows: ApiPlanPrice[] | undefined): string => {
  const own = (rows ?? []).filter((r) => r.planId === plan.id);
  return own.length > 0
    ? `${own.length} country price${own.length === 1 ? '' : 's'}`
    : `${plan.currency} ${parseFloat(plan.basePrice).toFixed(2)}`;
};

// ─── Plan manager (attach / detach plans on an existing pair) ─────────────────

const RotateSecretPanel: React.FC<{ pairId: number | string }> = ({ pairId }) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rotate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await migrationPairsService.rotateSecret(pairId);
      if (!res.webhookSecret) {
        setError('The secret was rotated but the new value could not be shown. Rotate again to get a fresh one.');
        return;
      }
      setSecret(res.webhookSecret);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to rotate the secret.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setError('Could not copy. Select the secret and copy it manually.');
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <h3 className="text-sm font-bold text-text-primary">Webhook secret</h3>
      <p className="mt-1 text-xs text-text-secondary">
        Rotating invalidates the current secret immediately. Update the migration tool with the new value or its webhooks will be rejected.
      </p>
      {error && <div role="alert" className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
      {secret && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800">New secret. It is shown only once, so copy it now.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 px-2 py-1.5 bg-white border border-border rounded font-mono text-xs break-all select-all">{secret}</code>
            <button type="button" onClick={copy} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-bg-light">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {!confirming ? (
          <button type="button" onClick={() => { setConfirming(true); setSecret(null); setCopied(false); }} className="px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50">
            Rotate secret
          </button>
        ) : (
          <>
            <button type="button" onClick={rotate} disabled={busy} className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-60">
              {busy ? 'Rotating…' : 'Yes, rotate now'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PlanManager: React.FC<{
  pairId: number | string;
  attachedPlans: ApiPlan[];
  availablePlans: ApiPlan[];
  priceRows?: ApiPlanPrice[];
  onRefresh: () => void;
}> = ({ pairId, attachedPlans, availablePlans, priceRows, onRefresh }) => {
  const [attachId, setAttachId] = useState('');
  const [working, setWorking]   = useState(false);
  const [err, setErr]           = useState('');

  const unattached = availablePlans.filter((p) => !attachedPlans.some((a) => a.id === p.id));

  const doAttach = async () => {
    if (!attachId) return;
    setWorking(true);
    setErr('');
    try {
      await migrationPairsService.attachPlan(pairId, attachId);
      setAttachId('');
      onRefresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to attach plan.');
    } finally {
      setWorking(false);
    }
  };

  const doDetach = async (planId: string) => {
    setWorking(true);
    setErr('');
    try {
      await migrationPairsService.detachPlan(pairId, planId);
      onRefresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to detach plan.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-border space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Attached plans</p>

      {attachedPlans.length === 0 ? (
        <p className="text-xs text-text-secondary italic">No plans attached yet.</p>
      ) : (
        <div className="space-y-2">
          {attachedPlans.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-bg-light rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-secondary font-mono">
                  {planPriceText(p, priceRows)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => doDetach(p.id)}
                disabled={working}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {unattached.length > 0 && (
        <div className="flex gap-2 items-center">
          <select
            className={`${inputCls} flex-1`}
            value={attachId}
            onChange={(e) => setAttachId(e.target.value)}
            disabled={working}
          >
            <option value="">— Attach a plan —</option>
            {unattached.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.currency} {parseFloat(p.basePrice).toFixed(2)} (default)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={doAttach}
            disabled={!attachId || working}
            className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            Attach
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const MigrationPairsPage: React.FC = () => {
  const [pairs, setPairs]         = useState<MigrationPairEntity[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<MigrationPairEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MigrationPairEntity | null>(null);

  const [createForm, setCreateForm] = useState<PairFormFields>({
    source: '', destination: '', displayName: '',
    serviceUrl: '', fallbackServiceUrl: '',
    apiVersion: 'v1', healthCheckPath: '/health',
    environment: 'PRODUCTION', isActive: true,
    isMaintenance: false, isFree: false, enquiryEmails: [],
    sourceLogoId: null, destinationLogoId: null, assigneeIds: [],
  });

  const [editForm, setEditForm]   = useState<PairFormFields | null>(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [availablePlans, setAvailablePlans] = useState<ApiPlan[]>([]);
  const [toolLogos, setToolLogos] = useState<BannerEntity[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersError, setUsersError] = useState('');
  // Edit modal: the pair's current team. Until it has loaded (or if it failed) we
  // never send assigneeIds, so saving can't wipe a team we couldn't read.
  const [editAssignees, setEditAssignees] = useState<{
    loaded: boolean;
    error: string;
    existing: MigrationPairAssignee[];
  }>({ loaded: false, error: '', existing: [] });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pairsRes, plansRes, logosRes] = await Promise.all([
        migrationPairsService.list({ limit: 100 } as any),
        plansService.list(),
        bannersService.list({ type: 'ToolLogo', take: 200 }),
      ]);
      setPairs(extractList<MigrationPairEntity>(pairsRes));
      setAvailablePlans(extractList<ApiPlan>(plansRes));
      setToolLogos(extractList<BannerEntity>(logosRes));
      // Separate from the main load: a missing "users.read" permission must not break this page.
      usersService
        .listUsers({ limit: 500 })
        .then((res) => {
          setUsers(extractList<UserProfile>(res));
          setUsersError('');
        })
        .catch(() => setUsersError('You do not have permission to list users, so the team cannot be assigned here.'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load migration pairs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ──────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm({
      source: '', destination: '', displayName: '',
      serviceUrl: '', fallbackServiceUrl: '',
      apiVersion: 'v1', healthCheckPath: '/health',
      environment: 'PRODUCTION', isActive: true,
      isMaintenance: false, isFree: false, enquiryEmails: [],
      sourceLogoId: null, destinationLogoId: null, assigneeIds: [],
    });
    setFormError('');
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload: CreateMigrationPairRequest = {
        source:             createForm.source,
        destination:        createForm.destination,
        displayName:        createForm.displayName,
        serviceUrl:         createForm.serviceUrl,
        fallbackServiceUrl: createForm.fallbackServiceUrl || undefined,
        apiVersion:         createForm.apiVersion || undefined,
        healthCheckPath:    createForm.healthCheckPath || undefined,
        environment:        createForm.environment,
        isActive:           createForm.isActive,
        isFree:             createForm.isFree,
        enquiryEmails:      createForm.enquiryEmails,
        sourceLogoId:       createForm.sourceLogoId,
        destinationLogoId:  createForm.destinationLogoId,
        ...(!usersError && { assigneeIds: createForm.assigneeIds }),
      };
      await migrationPairsService.create(payload);
      setCreateOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create pair.');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────

  const openEdit = (pair: MigrationPairEntity) => {
    setEditForm({
      source:             pair.source,
      destination:        pair.destination,
      displayName:        pair.displayName,
      serviceUrl:         pair.serviceUrl ?? '',
      fallbackServiceUrl: pair.fallbackServiceUrl ?? '',
      apiVersion:         pair.apiVersion ?? 'v1',
      healthCheckPath:    pair.healthCheckPath ?? '/health',
      environment:        pair.environment,
      isActive:           pair.isActive,
      isMaintenance:      pair.isMaintenance,
      isFree:             pair.isFree ?? false,
      enquiryEmails:      pair.enquiryEmails ?? [],
      sourceLogoId:       pair.sourceLogoId ?? null,
      destinationLogoId:  pair.destinationLogoId ?? null,
      assigneeIds:        [],
    });
    setEditTarget(pair);
    setFormError('');
    setEditAssignees({ loaded: false, error: '', existing: [] });
    migrationPairsService
      .getAssignees(pair.id)
      .then((existing) => {
        setEditAssignees({ loaded: true, error: '', existing });
        setEditForm((f) => (f ? { ...f, assigneeIds: existing.map((a) => a.id) } : f));
      })
      .catch(() =>
        setEditAssignees({ loaded: false, error: 'Could not load the current team — it will be left unchanged.', existing: [] }),
      );
  };

  // Sync editTarget when pairs list refreshes (e.g. after attach/detach)
  useEffect(() => {
    if (!editTarget) return;
    const updated = pairs.find((p) => p.id === editTarget.id);
    if (updated) setEditTarget(updated);
  }, [pairs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editForm) return;
    setSaving(true);
    setFormError('');
    try {
      const payload: UpdateMigrationPairRequest = {
        source:             editForm.source,
        destination:        editForm.destination,
        displayName:        editForm.displayName,
        serviceUrl:         editForm.serviceUrl,
        fallbackServiceUrl: editForm.fallbackServiceUrl || undefined,
        apiVersion:         editForm.apiVersion || undefined,
        healthCheckPath:    editForm.healthCheckPath || undefined,
        environment:        editForm.environment,
        isActive:           editForm.isActive,
        isMaintenance:      editForm.isMaintenance,
        isFree:             editForm.isFree,
        enquiryEmails:      editForm.enquiryEmails,
        sourceLogoId:       editForm.sourceLogoId,
        destinationLogoId:  editForm.destinationLogoId,
        ...(editAssignees.loaded && !usersError && { assigneeIds: editForm.assigneeIds }),
      };
      await migrationPairsService.update(editTarget.id, payload);
      setEditTarget(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update pair.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await migrationPairsService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete pair.');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Pairs</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage source-to-destination migration service endpoints</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Pair
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p className="text-sm">No migration pairs yet</p>
          </div>
        ) : (
          <div className="admin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-light">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Route</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Env</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Maintenance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{pair.displayName}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        {pair.sourceLogo ? (
                          <img src={pair.sourceLogo.image} alt={pair.sourceLogo.name} title={pair.sourceLogo.name} className="w-5 h-5 object-contain rounded-sm" />
                        ) : null}
                        <span className="font-mono text-xs">{pair.source}</span>
                        <span className="mx-0.5 text-text-secondary">→</span>
                        <span className="font-mono text-xs">{pair.destination}</span>
                        {pair.destinationLogo ? (
                          <img src={pair.destinationLogo.image} alt={pair.destinationLogo.name} title={pair.destinationLogo.name} className="w-5 h-5 object-contain rounded-sm" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {pair.isFree && !(pair.planPrices?.length) ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Free</span>
                      ) : pair.plans.length > 0 ? (
                        <div className="space-y-0.5">
                          {pair.plans.map((pl) => (
                            <div key={pl.id} className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-text-primary">{pl.name}</span>
                              <span className="text-[11px] text-text-secondary font-mono">{planPriceText(pl, pair.planPrices)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">No plans</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><EnvBadge env={pair.environment} /></td>
                    <td className="px-4 py-3"><StatusBadge active={pair.isActive} label={pair.isActive ? 'Active' : 'Inactive'} /></td>
                    <td className="px-4 py-3"><StatusBadge active={!pair.isMaintenance} label={pair.isMaintenance ? 'Yes' : 'No'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(pair)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(pair)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ───────────────────────────────────────────────────────── */}
      {createOpen && (
        <Modal size="xl" title="Add Migration Pair" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-0">
            {formError && (
              <div role="alert" className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            <PairFormBody
              values={createForm}
              onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
              logos={toolLogos}
              users={users}
              assigneeNote={usersError || undefined}
            />
            <div className="flex justify-end gap-2 pt-5 border-t border-border mt-5">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Creating…' : 'Create Pair'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────────── */}
      {editTarget && editForm && (
        <Modal size="xl" title={`Edit — ${editTarget.displayName}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-0">
            {formError && (
              <div role="alert" className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            <PairFormBody
              values={editForm}
              onChange={(patch) => setEditForm((f) => f ? { ...f, ...patch } : f)}
              logos={toolLogos}
              users={users}
              existingAssignees={editAssignees.existing}
              assigneeNote={usersError || editAssignees.error || (!editAssignees.loaded ? 'Loading the current team…' : undefined)}
              priced={(editTarget.planPrices?.length ?? 0) > 0}
            />
            <PlanManager
              pairId={editTarget.id}
              attachedPlans={editTarget.plans}
              availablePlans={availablePlans}
              priceRows={editTarget.planPrices}
              onRefresh={load}
            />
            <RotateSecretPanel pairId={editTarget.id} />
            <div className="flex justify-end gap-2 pt-5 border-t border-border mt-5">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal size="xl" title="Delete Migration Pair" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-text-primary">{deleteTarget.displayName}</span>?
              {' '}This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default MigrationPairsPage;
