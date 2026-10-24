import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { plansService } from '@/api/plans';
import { ApiError } from '@/api/client';
import { extractList } from '@/utils/platformMap';
import { PLANS } from '@/constants/plans';
import type { ApiPlan, CreatePlanRequest } from '@/types/api';
import { Modal } from '@/components/admin/Modal';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-text-secondary">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white';

const EMPTY: CreatePlanRequest = {
  name: '',
  basePrice: 0,
  currency: 'USD',
  history: '',
  years: 1,
  extraYearPrice: null,
  isInception: false,
  support: '',
  features: [],
  popular: false,
};

const planToRequest = (p: (typeof PLANS)[number]): CreatePlanRequest => ({
  name:      p.name,
  basePrice: p.basePrice,
  currency:  'USD',
  history:   p.history,
  years:     1,
  isInception: false,
  support:   p.support,
  features:  p.features,
  popular:   p.popular ?? false,
});

// ─── Page ─────────────────────────────────────────────────────────────────────
const PlansPage: React.FC = () => {
  const [plans, setPlans]   = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<ApiPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPlan | null>(null);

  const [form, setForm]             = useState<CreatePlanRequest>(EMPTY);
  const [featuresText, setFeaturesText] = useState('');
  // "Historical years": whether customers may add years beyond the plan. Off sends no price, which is what
  // hides the selector on the user side; the typed price is kept in the form so toggling doesn't lose it.
  const [yearsEnabled, setYearsEnabled] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await plansService.list();
      setPlans(extractList<ApiPlan>(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setF = <K extends keyof CreatePlanRequest>(key: K, value: CreatePlanRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (preset: (typeof PLANS)[number]) => {
    const req = planToRequest(preset);
    setForm(req);
    setFeaturesText(req.features.join('\n'));
    setYearsEnabled(false);
  };

  const buildForm = (): CreatePlanRequest => ({
    ...form,
    // Unlimited plans don't carry a year count — let the backend null it out.
    years: form.isInception ? undefined : form.years,
    // null = Historical years disabled (customers can't extend); unlimited plans have no years to extend.
    extraYearPrice: form.isInception || !yearsEnabled ? null : (form.extraYearPrice ?? null),
    features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
  });

  /** Enabled needs a price (0 = free); otherwise the plan would silently save as disabled. */
  const yearsProblem = (): string | null =>
    yearsEnabled && !form.isInception && form.extraYearPrice == null
      ? 'Enter the price per extra year for Historical years (0 makes extra years free), or set it to Disabled.'
      : null;

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = yearsProblem();
    if (problem) { setFormError(problem); return; }
    setSaving(true);
    setFormError('');
    try {
      await plansService.create(buildForm());
      setCreateOpen(false);
      setForm(EMPTY);
      setFeaturesText('');
      setYearsEnabled(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create plan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Seed defaults (create all PLANS that don't already exist) ─────────────
  const [seeding, setSeeding] = useState(false);
  const handleSeedDefaults = async () => {
    setSeeding(true);
    setError('');
    const existingNames = new Set(plans.map((p) => p.name.toLowerCase()));
    const toCreate = PLANS.filter((p) => !existingNames.has(p.name.toLowerCase()));
    try {
      await Promise.all(toCreate.map((p) => plansService.create(planToRequest(p))));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to seed plans.');
    } finally {
      setSeeding(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (plan: ApiPlan) => {
    setEditTarget(plan);
    setForm({
      name:      plan.name,
      basePrice: Number(plan.basePrice),
      currency:  plan.currency,
      history:   plan.history,
      years:     plan.years ?? 1,
      extraYearPrice: plan.extraYearPrice == null ? null : Number(plan.extraYearPrice),
      isInception: plan.isInception,
      support:   plan.support,
      features:  plan.features,
      popular:   plan.popular,
    });
    setFeaturesText(plan.features.join('\n'));
    setYearsEnabled(plan.extraYearPrice != null && !plan.isInception);
    setFormError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const problem = yearsProblem();
    if (problem) { setFormError(problem); return; }
    setSaving(true);
    setFormError('');
    try {
      await plansService.update(editTarget.id, buildForm());
      setEditTarget(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update plan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await plansService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete plan.');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const formFields = (isCreate: boolean) => (
    <div className="space-y-4">
      {/* Preset buttons — only shown on create */}
      {isCreate && (
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1.5">Start from a preset</p>
          <div className="flex gap-2">
            {PLANS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex-1 px-2 py-1.5 text-xs font-medium border border-border rounded-lg hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors text-text-secondary"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label="Plan Name" required>
        <input
          className={inputCls}
          value={form.name}
          onChange={(e) => setF('name', e.target.value)}
          placeholder="Basic"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Base Price" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">$</span>
            <input
              className={`${inputCls} pl-6`}
              type="number"
              min={0}
              step={0.01}
              value={form.basePrice}
              onChange={(e) => setF('basePrice', parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </Field>
        <Field label="Currency">
          <input
            className={inputCls}
            value={form.currency ?? ''}
            onChange={(e) => setF('currency', e.target.value)}
            placeholder="AUD"
            maxLength={3}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="History" required>
          <input
            className={inputCls}
            value={form.history}
            onChange={(e) => setF('history', e.target.value)}
            placeholder="1 year"
            required
          />
        </Field>
        <Field label="Support" required>
          <input
            className={inputCls}
            value={form.support}
            onChange={(e) => setF('support', e.target.value)}
            placeholder="Email support"
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <Field label="Years" required={!form.isInception}>
          <input
            type="number"
            min={1}
            className={`${inputCls} disabled:bg-bg-light disabled:text-text-tertiary`}
            value={form.isInception ? '' : (form.years ?? '')}
            onChange={(e) => setF('years', parseInt(e.target.value, 10) || 1)}
            placeholder={form.isInception ? 'Unlimited' : '1'}
            disabled={form.isInception}
            required={!form.isInception}
          />
        </Field>
        <Field label="Unlimited plan">
          <label className="flex items-center gap-2 h-9">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
              checked={form.isInception ?? false}
              onChange={(e) => setF('isInception', e.target.checked)}
            />
            <span className="text-sm text-text-secondary">Inception to date (no year limit)</span>
          </label>
        </Field>
      </div>

      <fieldset className="space-y-2" disabled={form.isInception}>
        <legend className="block text-xs font-medium text-text-secondary mb-1.5">Historical years</legend>
        <div className="flex items-center gap-5" role="radiogroup" aria-label="Historical years">
          {([['Enabled', true], ['Disabled', false]] as const).map(([label, value]) => (
            <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input
                type="radio"
                name={`historical-years-${isCreate ? 'create' : 'edit'}`}
                className="w-4 h-4 border-border text-blue-600 focus:ring-blue-500"
                checked={!form.isInception && yearsEnabled === value}
                onChange={() => setYearsEnabled(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {form.isInception ? (
          <p className="text-xs text-text-secondary">Not applicable: an inception-to-date plan already covers all years.</p>
        ) : yearsEnabled ? (
          <Field label="Price per extra year" required>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputCls}
              value={form.extraYearPrice ?? ''}
              onChange={(e) => setF('extraYearPrice', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 25 (0 = extra years are free)"
              required
            />
            <p className="text-xs text-text-secondary mt-0.5">
              Customers see a Historical years selector on the plan page and pay this for each financial year added beyond the plan&apos;s years (15 in total at most).
            </p>
          </Field>
        ) : (
          <p className="text-xs text-text-secondary">
            Customers can&apos;t add years: the Historical years selector is hidden on the plan page. The Operation Team can always extend, at no charge.
          </p>
        )}
      </fieldset>

      <Field label="Features (one per line)" required>
        <textarea
          className={`${inputCls} resize-none`}
          rows={5}
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder={'All data categories\nEmail support\n2 revisions\nReconciliation report'}
          required
        />
        <p className="text-xs text-text-secondary mt-0.5">
          {featuresText.split('\n').filter((s) => s.trim()).length} feature(s)
        </p>
      </Field>

      <Field label="Popular">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border accent-blue-600"
            checked={form.popular ?? false}
            onChange={(e) => setF('popular', e.target.checked)}
          />
          <span className="text-sm text-text-secondary">Mark as most popular plan</span>
        </label>
      </Field>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Plans</h1>
          <p className="mt-1 text-sm text-text-secondary">Create and manage subscription plans for your customers</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && plans.length < PLANS.length && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg text-text-secondary hover:bg-bg-light disabled:opacity-60 transition-colors"
              title="Create any missing default plans"
            >
              {seeding ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              Seed Defaults
            </button>
          )}
          <button
            onClick={() => { setCreateOpen(true); setForm(EMPTY); setFeaturesText(''); setYearsEnabled(false); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Plan
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-text-secondary bg-white border border-border rounded-xl">
          <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-sm font-medium mb-1">No plans yet</p>
          <p className="text-xs">Use "Seed Defaults" to create the standard plans, or add one manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary text-base">{plan.name}</h3>
                    {plan.popular && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-medium rounded-full border border-blue-100">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {plan.currency} {Number(plan.basePrice).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-1.5 rounded-md text-text-secondary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(plan)}
                    className="p-1.5 rounded-md text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-text-secondary border-t border-border pt-3">
                <div className="flex justify-between">
                  <span>History</span>
                  <span className="font-semibold text-text-primary">{plan.history}</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical years</span>
                  <span className="font-semibold text-text-primary">
                    {plan.extraYearPrice == null || plan.isInception ? 'Disabled' : Number(plan.extraYearPrice) === 0 ? 'Enabled · free' : `Enabled · ${plan.currency} ${Number(plan.extraYearPrice).toLocaleString()} / year`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Support</span>
                  <span className="font-semibold text-text-primary text-right max-w-[160px]">{plan.support}</span>
                </div>
                <ul className="pt-1.5 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <Modal title="Create New Plan" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            {formFields(true)}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Creating…' : 'Create Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {formError && (
              <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            {formFields(false)}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete Plan" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete the <span className="font-semibold text-text-primary">{deleteTarget.name}</span> plan? This action cannot be undone.
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

export default PlansPage;
