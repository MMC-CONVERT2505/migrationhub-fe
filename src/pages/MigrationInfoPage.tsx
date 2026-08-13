import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MigrationJourney } from '@/components/migration/MigrationJourney';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { InputField } from '@/components/auth/InputField';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/format';
import { useAppStore } from '@/store/appStore';
import { inquiryMigrationsService } from '@/api/inquiryMigrations';
import { ApiError } from '@/api/client';
import { FY_ENDS, COUNTRY_FY_END, DEFAULT_FY_END } from '@/constants/financialYear';
import { TRANSACTION_PLANS, type TransactionPlan } from '@/constants/transactionPlans';

// Declared once and reused in the restricted list below, so the two lists can never
// spell the same country differently — the label is what gets stored on the inquiry.
const AUSTRALIA = 'Australia (AUD)';
const NEW_ZEALAND = 'New Zealand (NZD)';

const COUNTRIES = [
  AUSTRALIA, NEW_ZEALAND, 'United Kingdom (GBP)', 'United States (USD)',
  'Canada (CAD)', 'Singapore (SGD)', 'India (INR)', 'United Arab Emirates (AED)', 'South Africa (ZAR)',
];

// International dial code per country, keyed by the same labels the country selector
// shows so the two can never drift. Every country in COUNTRIES must appear here.
const COUNTRY_DIAL_CODE: Record<string, string> = {
  [AUSTRALIA]: '+61',
  [NEW_ZEALAND]: '+64',
  'United Kingdom (GBP)': '+44',
  'United States (USD)': '+1',
  'Canada (CAD)': '+1',
  'Singapore (SGD)': '+65',
  'India (INR)': '+91',
  'United Arab Emirates (AED)': '+971',
  'South Africa (ZAR)': '+27',
};

// Selectable dial codes, derived from the map so the list can never offer a code no
// country maps to. Deduped (US and CA share +1) and ordered numerically.
const DIAL_CODES = [...new Set(Object.values(COUNTRY_DIAL_CODE))].sort(
  (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
);

// Longest first, so "+971" is recognised before "+97…" could be mistaken for a
// shorter code and eat a digit of the national number.
const DIAL_CODES_LONGEST_FIRST = [...DIAL_CODES].sort((a, b) => b.length - a.length);

/**
 * Reduces what the customer typed to a bare national number, so it can be appended to
 * the dial code chosen beside it. Strips formatting, an international prefix ("00" or
 * "+" plus a known code) they may have typed in front despite the separate control,
 * and the national trunk "0" that AU/NZ/UK/IN/AE/ZA numbers are written with locally
 * — each of which would otherwise corrupt the composed number.
 */
function toNationalNumber(typed: string): string {
  let n = typed.replace(/[\s()-]/g, '').replace(/^00/, '+');
  const typedCode = DIAL_CODES_LONGEST_FIRST.find((c) => n.startsWith(c));
  if (typedCode) n = n.slice(typedCode.length);
  return n.replace(/^\+/, '').replace(/^0+/, '');
}

// QBO → MYOB is only offered in Australia and New Zealand.
const QBO_MYOB_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];

// Xero → MYOB is likewise only offered in Australia and New Zealand. Kept as its own
// list so the regions each pair is sold in can move independently.
const XERO_MYOB_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];


interface FieldErr { field: string; message: string }

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors';

// Error treatment for a bare input, matching InputField's.
const inputErrCls = 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20';

const MigrationInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedPair = useAppStore((s) => s.selectedPair);
  const entryLocked = useAppStore((s) => s.entryLocked);

  const isXeroToQbo =
    selectedPair?.src?.toLowerCase() === 'xero' && selectedPair?.dst?.toLowerCase() === 'qbo';
  const isQboToMyob =
    selectedPair?.src?.toLowerCase() === 'qbo' && selectedPair?.dst?.toLowerCase() === 'myob';
  const isXeroToMyob =
    selectedPair?.src?.toLowerCase() === 'xero' && selectedPair?.dst?.toLowerCase() === 'myob';

  // QBO → MYOB and Xero → MYOB each ship a region-restricted list whose selected
  // country drives the FY end (AU closes 30 June, NZ 31 March), so neither is left
  // on the flat default. Every other pair keeps the full list and DEFAULT_FY_END.
  const countryDrivesFyEnd = isQboToMyob || isXeroToMyob;
  const countries = isQboToMyob
    ? QBO_MYOB_COUNTRIES
    : isXeroToMyob
      ? XERO_MYOB_COUNTRIES
      : COUNTRIES;
  const fyEndFor = (country: string) =>
    (countryDrivesFyEnd ? COUNTRY_FY_END[country] : undefined) ?? DEFAULT_FY_END;

  const [form, setForm] = useState(() => {
    const country = countryDrivesFyEnd ? countries[0] : COUNTRIES[3];
    return {
      name: '',
      email: '',
      phone: '',
      dialCode: COUNTRY_DIAL_CODE[country],
      country,
      entityName: '',
      financialYearEnd: fyEndFor(country),
      transactionPlan: TRANSACTION_PLANS[0].value as TransactionPlan,
    };
  });
  const [errors, setErrors] = useState<FieldErr[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  if (!selectedPair) return <Navigate to="/" replace />;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Changing the country re-points the dial code at that country, and the FY end at
  // that country's statutory date (region-restricted pairs only); the customer can
  // still override either — a dial code for an overseas contact number, an FY end for
  // a substituted period.
  const setCountry = (country: string) =>
    setForm((p) => ({
      ...p,
      country,
      dialCode: COUNTRY_DIAL_CODE[country] ?? p.dialCode,
      financialYearEnd: countryDrivesFyEnd ? fyEndFor(country) : p.financialYearEnd,
    }));
  const fieldError = (f: string) => errors.find((e) => e.field === f)?.message;

  const validate = (): FieldErr[] => {
    const e: FieldErr[] = [];
    if (!form.name.trim()) e.push({ field: 'name', message: 'Name is required.' });
    if (!form.email.trim()) e.push({ field: 'email', message: 'Email is required.' });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.push({ field: 'email', message: 'Enter a valid email address.' });
    if (!form.phone.trim()) e.push({ field: 'phone', message: 'Phone number is required.' });
    else if (!/^\+?[0-9\s()-]{6,20}$/.test(form.phone.trim())) e.push({ field: 'phone', message: 'Enter a valid phone number.' });
    if (!form.entityName.trim()) e.push({ field: 'entityName', message: 'Entity name is required.' });
    return e;
  };

  const setInquiryDetails = useAppStore((s) => s.setInquiryDetails);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setGlobalError('');
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    // Dial code + national number, still one `phone` string on the wire.
    const phone = `${form.dialCode}${toNationalNumber(form.phone)}`;
    try {
      const created = await inquiryMigrationsService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        country: form.country,
        entityName: form.entityName.trim(),
        financialYearEnd: form.financialYearEnd,
        ...(isXeroToQbo && form.transactionPlan ? { transactionPlan: form.transactionPlan } : {}),
        ...(selectedPair.id ? { migrationPairId: String(selectedPair.id) } : {}),
      });

      setInquiryDetails({
        id: created.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        entityName: form.entityName.trim(),
        financialYearEnd: form.financialYearEnd,
      });

      navigate('/migration/faq');
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar variant="migration" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MigrationJourney current={2} className="mb-8" />

        <div className="bg-white border border-border rounded-2xl shadow-card p-6 sm:p-8">
          {/* Selected migration pair — highlighted so the user always sees which flow this is */}
          <SelectedPairBanner pair={selectedPair} className="mb-6" />

          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Information</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tell us about the entity you want to migrate — this helps us scope and price your migration.
          </p>

          {globalError && (
            <div className="mt-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Name" id="name" required
                value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="John Doe" error={fieldError('name')}
              />
              <InputField
                label="Email" id="email" type="email" required
                value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="john.doe@example.com" error={fieldError('email')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dial code tracks the selected country, and stays overridable for a
                  customer whose contact number is registered overseas. Built from bare
                  controls rather than InputField so both sit on the same baseline as
                  the Country select beside them. */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-medium text-text-secondary">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex items-start gap-2">
                  <select
                    id="dialCode"
                    value={form.dialCode}
                    onChange={(e) => set('dialCode', e.target.value)}
                    aria-label="Dial code"
                    className={cn(inputCls, 'w-24 flex-shrink-0 px-2')}
                  >
                    {DIAL_CODES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    id="phone" type="tel" inputMode="tel" aria-required="true"
                    value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    placeholder="412 345 678" autoComplete="tel-national" maxLength={20}
                    aria-invalid={!!fieldError('phone')}
                    aria-describedby={fieldError('phone') ? 'phone-error' : undefined}
                    className={cn(inputCls, 'placeholder:text-text-tertiary', fieldError('phone') && inputErrCls)}
                  />
                </div>
                {fieldError('phone') && (
                  <p id="phone-error" className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldError('phone')}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className="text-xs font-medium text-text-secondary">Country <span className="text-red-500">*</span></label>
                <select id="country" value={form.country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                  {countries.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Name of Entity to be Migrated" id="entityName" required
                value={form.entityName} onChange={(e) => set('entityName', e.target.value)}
                placeholder="Acme Pty Ltd" maxLength={150} error={fieldError('entityName')}
              />
              {isXeroToQbo && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="transactionPlan" className="text-xs font-medium text-text-secondary">Type of Data Migration <span className="text-red-500">*</span></label>
                  <select
                    id="transactionPlan"
                    value={form.transactionPlan}
                    onChange={(e) => set('transactionPlan', e.target.value as TransactionPlan)}
                    className={inputCls}
                  >
                    {TRANSACTION_PLANS.map((plan) => (
                      <option key={plan.value} value={plan.value}>{plan.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fye" className="text-xs font-medium text-text-secondary">Financial Year End Date <span className="text-red-500">*</span></label>
                <select id="fye" value={form.financialYearEnd} onChange={(e) => set('financialYearEnd', e.target.value)} className={inputCls}>
                  {FY_ENDS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!entryLocked && (
                <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/')}>Cancel</Button>
              )}
              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>Continue to FAQ</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MigrationInfoPage;
