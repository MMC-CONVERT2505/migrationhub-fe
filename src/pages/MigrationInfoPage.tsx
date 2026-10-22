import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FlowLayout } from '@/components/migration/FlowLayout';
import { FaqAccordion } from '@/components/migration/FaqAccordion';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { InputField } from '@/components/auth/InputField';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/format';
import { useAppStore } from '@/store/appStore';
import { inquiryMigrationsService } from '@/api/inquiryMigrations';
import { ApiError } from '@/api/client';
import { FY_ENDS, COUNTRY_FY_END, DEFAULT_FY_END } from '@/constants/financialYear';
import {
  PAYMENT_PATH, SUCCESS_PATH, findSelectedPlan, inquiryForPair, isFreeSelection, resolveFlowRedirect,
} from '@/constants/migrationFlow';
import { pairPlanPath } from '@/utils/platformMap';
import { countryForDialCode } from '@/utils/phone';
import { countryDisplayName } from '@/utils/country';

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

/**
 * Inverse of the above, for edit-mode pre-fill: splits a stored "+61412345678"
 * back into the separate dial-code + national-number controls the form shows.
 * Falls back to the pair's/country's own dial code if the stored value somehow
 * doesn't start with one of the known codes.
 */
function splitPhone(stored: string, fallbackDialCode: string): { dialCode: string; phone: string } {
  const code = DIAL_CODES_LONGEST_FIRST.find((c) => stored.startsWith(c));
  return code ? { dialCode: code, phone: stored.slice(code.length) } : { dialCode: fallbackDialCode, phone: stored };
}

// QBO → MYOB is only offered in Australia and New Zealand.
const QBO_MYOB_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];

// MYOB → QBO — the opposite direction to the pair above, and a separate row in the DB
// (source 'myob', destination 'qbo'). Sold in Australia and New Zealand only; kept as
// its own list so the two directions' regions can diverge later.
const MYOB_QBO_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];

// Xero → MYOB is likewise only offered in Australia and New Zealand. Kept as its own
// list so the regions each pair is sold in can move independently.
const XERO_MYOB_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];

// Xero → Reckon One is sold in Australia and New Zealand only — its own list for the
// same reason: these three pairs' regions are free to diverge later.
const XERO_RECKON_COUNTRIES = [AUSTRALIA, NEW_ZEALAND];

/**
 * Statutory FY end for a country, on every pair — not just the region-restricted ones,
 * which is what used to leave most customers on a flat 31st March whatever they picked.
 * A country with no statutory rule falls back to DEFAULT_FY_END; either way the customer
 * can still override it for a substituted accounting period. Module-level because it
 * depends on nothing but the selected country, which keeps it out of effect deps.
 */
const fyEndFor = (country: string) => COUNTRY_FY_END[country] ?? DEFAULT_FY_END;


interface FieldErr { field: string; message: string }

// Unanswered until the customer picks one: a pre-selected Yes/No would record a
// confirmation they never gave, and these answers drive scoping and quoting.
type YesNo = boolean | null;

const YES_NO_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors';

// Error treatment for a bare input, matching InputField's.
const inputErrCls = 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20';

/**
 * One required Yes/No question, rendered as a real radio group so it is keyboard
 * operable and announced as a group. Module-level, not nested in the page, so a
 * re-render never remounts it and steals focus mid-answer.
 */
const YesNoField: React.FC<{
  name: string;
  legend: string;
  hint?: string;
  value: YesNo;
  onChange: (v: boolean) => void;
  error?: string;
}> = ({ name, legend, hint, value, onChange, error }) => (
  <fieldset
    className={cn(
      'rounded-xl border p-4 transition-colors',
      error ? 'border-red-300 bg-red-50/50' : 'border-border bg-bg-light/50',
    )}
    aria-describedby={
      [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined
    }
  >
    <legend className="px-1 text-sm font-semibold text-text-primary">
      {legend} <span className="text-red-500">*</span>
    </legend>
    {hint && <p id={`${name}-hint`} className="text-xs text-text-secondary">{hint}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {YES_NO_OPTIONS.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.label}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-lg border cursor-pointer transition-colors',
              'focus-within:ring-2 focus-within:ring-blue-500/30',
              checked
                ? 'border-blue-500 bg-blue-50 text-text-primary font-medium'
                : 'border-border bg-white text-text-secondary hover:border-border-medium',
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(opt.value)}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
    {error && (
      <p id={`${name}-error`} className="mt-2 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </fieldset>
);

const MigrationInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedPair = useAppStore((s) => s.selectedPair);
  const setInquiryDetails = useAppStore((s) => s.setInquiryDetails);
  const inquiryDetails = useAppStore((s) => s.inquiryDetails);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);

  // Going back to this page after the inquiry was created (e.g. "Edit details" on the
  // payment page) updates that inquiry rather than creating a duplicate.
  const existing = inquiryForPair(selectedPair, inquiryDetails);
  const canUpdate = !!(existing?.id && existing.editToken);

  const isQboToMyob =
    selectedPair?.src?.toLowerCase() === 'qbo' && selectedPair?.dst?.toLowerCase() === 'myob';
  // Distinct from isQboToMyob above: the same two platforms, the opposite direction.
  const isMyobToQbo =
    selectedPair?.src?.toLowerCase() === 'myob' && selectedPair?.dst?.toLowerCase() === 'qbo';
  const isXeroToMyob =
    selectedPair?.src?.toLowerCase() === 'xero' && selectedPair?.dst?.toLowerCase() === 'myob';
  // "reckon" is the pair's destination key in the DB; "Reckon One" is the product name.
  const isXeroToReckon =
    selectedPair?.src?.toLowerCase() === 'xero' && selectedPair?.dst?.toLowerCase() === 'reckon';

  // Tracked inventory is a MYOB-destination question: both MYOB tools have to know
  // whether inventory items carry a quantity on hand before they can map them.
  const asksTrackingInventory = isXeroToMyob || isQboToMyob;

  // QBO → MYOB, MYOB → QBO, Xero → MYOB and Xero → Reckon One are each sold in a fixed
  // set of regions, so they ship a restricted country list. Every other pair offers the
  // full list. This governs which countries are *offered* only — the FY end follows the
  // selected country on every pair alike, via fyEndFor.
  const restrictedCountries =
    (isQboToMyob && QBO_MYOB_COUNTRIES) ||
    (isMyobToQbo && MYOB_QBO_COUNTRIES) ||
    (isXeroToMyob && XERO_MYOB_COUNTRIES) ||
    (isXeroToReckon && XERO_RECKON_COUNTRIES) ||
    null;
  const countries = restrictedCountries ?? COUNTRIES;
  // A restricted pair opens on the first country it is sold in; the rest keep the
  // historical default so an unrestricted pair lands where it always has.
  const defaultCountry = restrictedCountries ? restrictedCountries[0] : COUNTRIES[3];

  const [form, setForm] = useState(() => {
    // Pre-fill from the inquiry the customer already submitted — everything
    // it might be missing (an in-flight session from before this field was
    // widened into the store) falls back exactly like a fresh form would.
    if (existing) {
      const inquiry = existing;
      const country = inquiry.country ?? defaultCountry;
      const { dialCode, phone } = splitPhone(
        inquiry.phone,
        COUNTRY_DIAL_CODE[country] ?? COUNTRY_DIAL_CODE[defaultCountry],
      );
      return {
        name: inquiry.name,
        email: inquiry.email,
        phone,
        dialCode,
        country,
        entityName: inquiry.entityName,
        financialYearEnd: inquiry.financialYearEnd ?? fyEndFor(country),
        addOnsConfirmed: (inquiry.addOnsConfirmed ?? null) as YesNo,
        trackingInventory: (inquiry.trackingInventory ?? null) as YesNo,
      };
    }
    const country = defaultCountry;
    return {
      name: '',
      email: '',
      phone: '',
      dialCode: COUNTRY_DIAL_CODE[country],
      country,
      entityName: '',
      financialYearEnd: fyEndFor(country),
      addOnsConfirmed: null as YesNo,
      trackingInventory: null as YesNo,
    };
  });
  const [errors, setErrors] = useState<FieldErr[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  // Set from a 409 mid-submit (already confirmed in another tab). Editing is then no
  // longer possible — replace the form with a clear way out rather than leaving it
  // looking submittable.
  const [editBlocked, setEditBlocked] = useState<string | null>(null);

  // Both generic step-2 URLs render this same element, so React reuses the component
  // across a pair change and the form survives with whatever country was picked for the
  // previous pair — one the new pair may not be sold in. That would leave the select
  // showing a value it has no <option> for and let submit record a region this pair is
  // not offered in, so snap back to the pair's own default when it happens. The arrays
  // are module constants, so this settles in one pass and cannot loop.
  useEffect(() => {
    if (countries.includes(form.country)) return;
    const country = countries[0];
    setForm((p) => ({
      ...p,
      country,
      dialCode: COUNTRY_DIAL_CODE[country] ?? p.dialCode,
      financialYearEnd: fyEndFor(country),
    }));
  }, [countries, form.country]);

  // Pair or plan missing (refresh, pasted URL, stale session): back to the earliest incomplete step.
  const redirect = resolveFlowRedirect('details', { pair: selectedPair, planId: selectedPlanId, inquiry: inquiryDetails });
  if (!selectedPair || redirect) return <Navigate to={redirect ?? '/'} replace />;

  const plan = findSelectedPlan(selectedPair, selectedPlanId);
  // A free selection skips the Payment page and goes straight to Start Migration.
  const isFree = isFreeSelection(selectedPair, plan);
  const nextPath = isFree ? SUCCESS_PATH : PAYMENT_PATH;

  if (editBlocked) {
    return (
      <FlowLayout page="details">
        <div className="bg-white border border-border rounded-2xl shadow-card p-6 sm:p-8 text-center">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Editing unavailable</h1>
          <p className="mt-2 text-sm text-text-secondary">{editBlocked}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/migrations')}>View your migrations</Button>
          </div>
        </div>
      </FlowLayout>
    );
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear the field's error the moment it changes: a section already showing the
    // customer's answer must not still be shouting that it is unanswered. Errors are
    // recomputed on submit, so nothing that is still wrong stays hidden.
    setErrors((p) => (p.some((e) => e.field === k) ? p.filter((e) => e.field !== k) : p));
  };

  // Changing the country re-points the dial code at that country, and the FY end at
  // that country's statutory date — on every pair now, not just the region-restricted
  // ones. The customer can still override either: a dial code for an overseas contact
  // number, an FY end for a substituted period.
  const setCountry = (country: string) =>
    setForm((p) => ({
      ...p,
      country,
      dialCode: COUNTRY_DIAL_CODE[country] ?? p.dialCode,
      financialYearEnd: fyEndFor(country),
    }));
  // Picking a dial code follows through to the country when that is unambiguous (see
  // countryForDialCode). The FY end follows only if the customer hasn't changed it from the
  // old country's statutory date, so a deliberately chosen period is never overwritten.
  const setDialCode = (dialCode: string) =>
    setForm((p) => {
      const country = countryForDialCode(dialCode, countries, p.country, COUNTRY_DIAL_CODE);
      if (!country) return { ...p, dialCode };
      const fyUntouched = p.financialYearEnd === fyEndFor(p.country);
      return {
        ...p,
        dialCode,
        country,
        financialYearEnd: fyUntouched ? fyEndFor(country) : p.financialYearEnd,
      };
    });
  const fieldError = (f: string) => errors.find((e) => e.field === f)?.message;

  const validate = (): FieldErr[] => {
    const e: FieldErr[] = [];
    if (!form.name.trim()) e.push({ field: 'name', message: 'Name is required.' });
    if (!form.email.trim()) e.push({ field: 'email', message: 'Email is required.' });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.push({ field: 'email', message: 'Enter a valid email address.' });
    if (!form.phone.trim()) e.push({ field: 'phone', message: 'Phone number is required.' });
    else if (!/^\+?[0-9\s()-]{6,20}$/.test(form.phone.trim())) e.push({ field: 'phone', message: 'Enter a valid phone number.' });
    if (!form.entityName.trim()) e.push({ field: 'entityName', message: 'Entity name is required.' });
    // Add-ons are quoted on top of a paid plan; a free migration has nothing to quote, so it isn't asked.
    if (!isFree && form.addOnsConfirmed === null) e.push({ field: 'addOnsConfirmed', message: 'Please confirm whether you need any add-ons.' });
    if (asksTrackingInventory && form.trackingInventory === null) e.push({ field: 'trackingInventory', message: 'Please tell us whether this file uses tracking inventory.' });
    return e;
  };

  // Inline validation: check a field as the customer leaves it, so a mistake shows up
  // beside the field instead of only after pressing the CTA.
  const validateOnBlur = (field: string) => {
    const msg = validate().find((e) => e.field === field);
    setErrors((p) => {
      const rest = p.filter((e) => e.field !== field);
      return msg ? [...rest, msg] : rest;
    });
  };

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
    const addOnsConfirmed = isFree ? undefined : (form.addOnsConfirmed ?? undefined);
    const trackingInventory = asksTrackingInventory ? (form.trackingInventory ?? undefined) : undefined;

    if (canUpdate && existing?.id && existing.editToken) {
      try {
        await inquiryMigrationsService.update(existing.id, existing.editToken, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone,
          country: form.country,
          entityName: form.entityName.trim(),
          financialYearEnd: form.financialYearEnd,
          addOnsConfirmed,
          trackingInventory,
        });

        setInquiryDetails({
          ...existing,
          name: form.name.trim(),
          email: form.email.trim(),
          phone,
          country: form.country,
          entityName: form.entityName.trim(),
          financialYearEnd: form.financialYearEnd,
          addOnsConfirmed,
          trackingInventory,
        });

        navigate(nextPath);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 409) {
          setEditBlocked(err.message);
        } else {
          setGlobalError(err instanceof ApiError ? err.message : 'Could not save your details. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const created = await inquiryMigrationsService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        country: form.country,
        entityName: form.entityName.trim(),
        financialYearEnd: form.financialYearEnd,
        ...(addOnsConfirmed !== undefined ? { addOnsConfirmed } : {}),
        ...(trackingInventory !== undefined ? { trackingInventory } : {}),
        ...(selectedPair.id ? { migrationPairId: String(selectedPair.id) } : {}),
      });

      setInquiryDetails({
        id: created.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        country: form.country,
        entityName: form.entityName.trim(),
        financialYearEnd: form.financialYearEnd,
        addOnsConfirmed,
        trackingInventory,
        editToken: created.editToken,
        migrationPairId: selectedPair.id ? String(selectedPair.id) : undefined,
      });

      navigate(nextPath);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FlowLayout page="details" widthClass="max-w-6xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 bg-white border border-border rounded-2xl shadow-card p-5 sm:p-8">
          {/* Selected migration pair — highlighted so the user always sees which flow this is */}
          <SelectedPairBanner pair={selectedPair} className="mb-6" />

          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Information</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tell us about the entity you want to migrate — this helps us scope and price your migration.
          </p>

          {globalError && (
            <div role="alert" className="mt-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="lg:contents">
            <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Name" id="name" required
                value={form.name} onChange={(e) => set('name', e.target.value)} onBlur={() => validateOnBlur('name')}
                placeholder="John Doe" error={fieldError('name')}
              />
              <InputField
                label="Email" id="email" type="email" required
                value={form.email} onChange={(e) => set('email', e.target.value)} onBlur={() => validateOnBlur('email')}
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
                    onChange={(e) => setDialCode(e.target.value)}
                    aria-label="Dial code"
                    className={cn(inputCls, 'w-24 flex-shrink-0 px-2')}
                  >
                    {DIAL_CODES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    id="phone" type="tel" inputMode="tel" aria-required="true"
                    value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => validateOnBlur('phone')}
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
                  {countries.map((c) => <option key={c} value={c}>{countryDisplayName(c)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Name of Entity to be Migrated" id="entityName" required
                value={form.entityName} onChange={(e) => set('entityName', e.target.value)} onBlur={() => validateOnBlur('entityName')}
                placeholder="Acme Pty Ltd" maxLength={150} error={fieldError('entityName')}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fye" className="text-xs font-medium text-text-secondary">Financial Year End Date <span className="text-red-500">*</span></label>
                <select id="fye" value={form.financialYearEnd} onChange={(e) => set('financialYearEnd', e.target.value)} className={inputCls}>
                  {FY_ENDS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Add-ons confirmation — asked on paid migrations only, so the quote reflects what
                the customer wants before payment. A free migration never reaches payment. */}
            {!isFree && (
              <YesNoField
                name="addOnsConfirmed"
                legend="Add-ons Confirmation"
                hint="Add-ons are quoted on top of your migration plan. Do you want any add-ons included in this migration?"
                value={form.addOnsConfirmed}
                onChange={(v) => set('addOnsConfirmed', v)}
                error={fieldError('addOnsConfirmed')}
              />
            )}

            {asksTrackingInventory && (
              <YesNoField
                name="trackingInventory"
                legend="Tracking Inventory"
                hint="MYOB handles tracked inventory differently. Does this file use tracking inventory — inventory items that carry a quantity on hand?"
                value={form.trackingInventory}
                onChange={(v) => set('trackingInventory', v)}
                error={fieldError('trackingInventory')}
              />
            )}

            </div>

            {/* CTA — sticks to the bottom of the viewport on desktop so it never scrolls out of view */}
            <div className="mt-5 lg:sticky lg:bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 bg-white/95 backdrop-blur-sm border-t border-border">
              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                {nextPath === SUCCESS_PATH ? 'Continue' : 'Continue to Payment'}
              </Button>
              <button
                type="button"
                onClick={() => navigate(pairPlanPath(selectedPair))}
                className="mt-2 w-full text-center text-xs font-medium text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
              >
                Change plan
              </button>
            </div>
          </form>
        </div>

        {/* FAQ — right column on desktop, below the form on mobile (DOM order) */}
        <aside className="min-w-0 lg:sticky lg:top-6">
          <FaqAccordion pairId={selectedPair.id} free={isFree} />
        </aside>
      </div>
    </FlowLayout>
  );
};

export default MigrationInfoPage;
