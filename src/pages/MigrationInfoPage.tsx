import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MigrationJourney } from '@/components/migration/MigrationJourney';
import { InputField } from '@/components/auth/InputField';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/appStore';
import { inquiryMigrationsService } from '@/api/inquiryMigrations';
import { ApiError } from '@/api/client';

const COUNTRIES = [
  'Australia (AUD)', 'New Zealand (NZD)', 'United Kingdom (GBP)', 'United States (USD)',
  'Canada (CAD)', 'Singapore (SGD)', 'India (INR)', 'United Arab Emirates (AED)', 'South Africa (ZAR)',
];

const FY_ENDS = ['31st March', '30th June', '30th September', '31st December'];

const YEARS = [
  { value: 1, label: '1 Year (Current Year)' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 5, label: '5 Years' },
  { value: 7, label: '7 Years (Full history)' },
];

interface FieldErr { field: string; message: string }

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors';

const MigrationInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedPair = useAppStore((s) => s.selectedPair);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: COUNTRIES[3],
    entityName: '',
    financialYearEnd: FY_ENDS[0],
    yearsToMigrate: 1,
    migrationStartDate: '',
    migrationEndDate: '',
  });
  const [errors, setErrors] = useState<FieldErr[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const period = useMemo(() => {
    if (!form.migrationStartDate || !form.migrationEndDate) return null;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(form.migrationStartDate)} → ${fmt(form.migrationEndDate)}`;
  }, [form.migrationStartDate, form.migrationEndDate]);

  if (!selectedPair) {
    navigate('/');
    return null;
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const fieldError = (f: string) => errors.find((e) => e.field === f)?.message;

  const validate = (): FieldErr[] => {
    const e: FieldErr[] = [];
    if (!form.name.trim()) e.push({ field: 'name', message: 'Name is required.' });
    if (!form.email.trim()) e.push({ field: 'email', message: 'Email is required.' });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.push({ field: 'email', message: 'Enter a valid email address.' });
    if (!form.phone.trim()) e.push({ field: 'phone', message: 'Phone number is required.' });
    else if (!/^\+?[0-9\s()-]{6,20}$/.test(form.phone.trim())) e.push({ field: 'phone', message: 'Enter a valid phone number.' });
    if (!form.entityName.trim()) e.push({ field: 'entityName', message: 'Entity name is required.' });
    if (!form.migrationStartDate) e.push({ field: 'migrationStartDate', message: 'Start date is required.' });
    if (!form.migrationEndDate) e.push({ field: 'migrationEndDate', message: 'End date is required.' });
    if (form.migrationStartDate && form.migrationEndDate && form.migrationEndDate < form.migrationStartDate)
      e.push({ field: 'migrationEndDate', message: 'End date must be after the start date.' });
    return e;
  };

  const setInquiryDetails = useAppStore(
    (s) => s.setInquiryDetails
  );

  console.log('setter', setInquiryDetails);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setGlobalError('');
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      const created = await inquiryMigrationsService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country,
        entityName: form.entityName.trim(),
        financialYearEnd: form.financialYearEnd,
        yearsToMigrate: form.yearsToMigrate,
        migrationStartDate: form.migrationStartDate,
        migrationEndDate: form.migrationEndDate,
        ...(selectedPair.id ? { migrationPairId: String(selectedPair.id) } : {}),
      });

      setInquiryDetails({
        id: created.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        entityName: form.entityName.trim(),
      });

      console.log('Saved');

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
              <InputField
                label="Phone Number" id="phone" type="tel" required
                value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 555 123 4567" error={fieldError('phone')}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className="text-xs font-medium text-text-secondary">Country <span className="text-red-500">*</span></label>
                <select id="country" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls}>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Name of Entity to be Migrated" id="entityName" required
                value={form.entityName} onChange={(e) => set('entityName', e.target.value)}
                placeholder="Acme Pty Ltd" maxLength={150} error={fieldError('entityName')}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fye" className="text-xs font-medium text-text-secondary">Financial Year End Date <span className="text-red-500">*</span></label>
                <select id="fye" value={form.financialYearEnd} onChange={(e) => set('financialYearEnd', e.target.value)} className={inputCls}>
                  {FY_ENDS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="years" className="text-xs font-medium text-text-secondary">Number of Years to Migrate</label>
              <select id="years" value={form.yearsToMigrate} onChange={(e) => set('yearsToMigrate', Number(e.target.value))} className={inputCls}>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>

            {/* Migration period summary */}
            <div className="bg-blue-light border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">📅 Migration Period</p>
              <p className="mt-2 text-sm text-text-primary font-medium">{period ?? 'Select a start and end date below'}</p>
              <p className="mt-1 text-xs text-text-secondary">
                {form.yearsToMigrate} financial {form.yearsToMigrate === 1 ? 'year' : 'years'} of data · based on financial year ending {form.financialYearEnd}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start" className="text-xs font-medium text-text-secondary">Migration Start Date <span className="text-red-500">*</span></label>
                <input id="start" type="date" value={form.migrationStartDate} onChange={(e) => set('migrationStartDate', e.target.value)} className={inputCls} />
                {fieldError('migrationStartDate') && <p className="text-xs text-red-600">{fieldError('migrationStartDate')}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="end" className="text-xs font-medium text-text-secondary">Migration End Date <span className="text-red-500">*</span></label>
                <input id="end" type="date" value={form.migrationEndDate} onChange={(e) => set('migrationEndDate', e.target.value)} className={inputCls} />
                {fieldError('migrationEndDate') && <p className="text-xs text-red-600">{fieldError('migrationEndDate')}</p>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/')}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>Continue to FAQ</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MigrationInfoPage;
