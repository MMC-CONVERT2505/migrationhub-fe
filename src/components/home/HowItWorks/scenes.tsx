import React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { FLOWS, stepperFor, type FlowKey, type SceneKey } from './flows';

// ── Motion helpers: everything becomes instant (no motion at all) when the visitor prefers reduced motion ──────────

type Anim = Pick<MotionProps, 'initial' | 'animate' | 'transition'>;

const enter = (reduced: boolean, delay: number): Anim =>
  reduced ? { initial: false } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35 } };

/** The "selected" ring: a brand-coloured overlay that fades in, so the colour always comes from the theme tokens. */
const Highlight: React.FC<{ reduced: boolean; delay: number }> = ({ reduced, delay }) => (
  <motion.span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-blue-600 bg-blue-light"
    {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.35 } })}
  />
);

const fillBar = (reduced: boolean, delay: number, w: string): Anim & { style?: React.CSSProperties } =>
  reduced ? { initial: false, style: { width: w } } : { initial: { width: '0%' }, animate: { width: w }, transition: { delay, duration: 0.6, ease: 'easeOut' } };

export interface SceneProps {
  flow: FlowKey;
  reduced: boolean;
}

// ── Pieces that mirror the real platform's chrome ──────────────────────────────────────────────────────────────────

const Check: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/** The checkout stepper (Prepare / Pay / Connect / Migrate), exactly the stages the platform shows for this flow. */
const Stepper: React.FC<{ flow: FlowKey; scene: SceneKey }> = ({ flow, scene }) => {
  const s = stepperFor(flow, scene);
  if (!s) return null;
  return (
    <ol className="mx-auto mb-4 flex max-w-md items-start">
      {s.labels.map((label, i) => {
        const done = i < s.current;
        const on = i === s.current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <li aria-hidden="true" className={`mt-3.5 h-px flex-1 ${done || on ? 'bg-green-500' : 'bg-border-medium'}`} />}
            <li className="flex w-14 flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${
                  done ? 'border-green-500 bg-white text-green-800' : on ? 'border-blue-700 bg-blue-700 text-white' : 'border-border-medium bg-white text-text-secondary'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={`text-[10px] font-medium ${on ? 'text-blue-800' : done ? 'text-green-800' : 'text-text-secondary'}`}>{label}</span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
};

const Banner: React.FC<{ flow: FlowKey; badge?: string }> = ({ flow, badge }) => {
  const [from, to] = FLOWS[flow].pair;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-light px-3 py-2">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-800">Selected migration</p>
        <p className="truncate text-xs font-semibold text-text-primary">{from} → {to}</p>
      </div>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${flow === 'free' ? 'bg-green-light text-green-800' : 'border border-border bg-white text-text-secondary'}`}>
        {badge ?? (flow === 'free' ? 'Free' : 'Paid')}
      </span>
    </div>
  );
};

const Skeleton: React.FC<{ w?: string }> = ({ w = 'w-16' }) => <span aria-hidden="true" className={`inline-block h-2.5 ${w} rounded bg-bg-lighter align-middle`} />;

const Tile: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <span className={`flex h-9 items-center justify-center rounded-lg border border-border bg-white text-sm font-bold text-text-secondary ${wide ? 'flex-1' : 'w-9'}`}>{children}</span>
);

// ── 1. Choose: the home page's migration pairs ─────────────────────────────────────────────────────────────────────

interface PairCard {
  from: string;
  to: string;
  badges: readonly string[];
  cta: string;
  free: boolean;
}
const PAIR_CARDS: readonly PairCard[] = [
  { from: 'MYOB', to: 'QuickBooks Online', badges: ['Free'], cta: 'Start free', free: true },
  { from: 'QuickBooks Online', to: 'FreshBooks', badges: ['Free in United States, Canada', 'Paid elsewhere'], cta: 'Check your region', free: false },
  { from: 'QuickBooks Online', to: 'MYOB', badges: ['Free'], cta: 'Start free', free: true },
  { from: 'QuickBooks Online', to: 'Xero', badges: ['Paid'], cta: 'See pricing', free: false },
  { from: 'Tally', to: 'Zoho Books', badges: ['Paid'], cta: 'See pricing', free: false },
  { from: 'Xero', to: 'MYOB', badges: ['Free'], cta: 'Start free', free: true },
];

export const ChooseScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const [from, to] = FLOWS[flow].pair;
  return (
    <div>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-blue-800">Migration pairs</p>
      <p className="mb-3 text-center text-sm font-bold text-text-primary">Select your migration path</p>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {PAIR_CARDS.map((c, i) => {
          const chosen = c.from === from && c.to === to;
          return (
            <motion.li
              key={c.from + c.to}
              {...enter(reduced, 0.1 + i * 0.1)}
              className={`relative flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-white p-3 ${i >= 4 ? 'max-lg:hidden' : ''}`}
            >
              {chosen && <Highlight reduced={reduced} delay={1.6} />}
              <div className="flex items-center gap-2">
                <Tile wide>{c.from[0]}</Tile>
                <span aria-hidden="true" className="text-text-secondary">→</span>
                <Tile wide>{c.to[0]}</Tile>
              </div>
              <p className="truncate text-[11px] text-text-secondary">{c.from} → {c.to}</p>
              <div className="flex flex-wrap gap-1">
                {c.badges.map((b) => (
                  <span key={b} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b === 'Paid' || b === 'Paid elsewhere' ? 'border border-border bg-bg-lighter text-text-secondary' : 'bg-green-light text-green-800'}`}>{b}</span>
                ))}
              </div>
              <p className={`border-t border-border pt-1.5 text-right text-[11px] font-semibold ${c.free ? 'text-green-800' : 'text-blue-800'}`}>
                {c.cta} {chosen && !reduced ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>✓</motion.span> : '→'}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

// ── 2. Prepare: plan, then details ─────────────────────────────────────────────────────────────────────────────────

const PLANS = [
  { name: 'Basic', history: 'Current Financial Year + 1 Historical Year', popular: false },
  { name: 'Standard', history: 'Current Financial Year + 3 Historical Years', popular: true },
  { name: 'Enterprise', history: 'Inception to date', popular: false },
] as const;

const PlanPhase: React.FC<SceneProps> = ({ flow, reduced }) => {
  const free = flow === 'free';
  const country = free ? 'Australia' : 'United Kingdom';
  return (
    <div>
      <p className="text-sm font-bold text-text-primary">Choose your migration plan</p>
      <p className="mt-0.5 text-[11px] text-text-secondary">
        {free ? 'This migration is free — choose the plan that fits your data.' : 'Pick the plan that matches how much history you need to bring across.'}
      </p>
      <p className="mt-2.5 text-[11px] font-semibold text-text-primary">Country your business is registered in</p>
      <div className="relative mt-1 h-8 rounded-md border border-border bg-white px-2.5 text-xs leading-8">
        <motion.span {...(reduced ? { initial: false, style: { opacity: 0 } } : { initial: { opacity: 1 }, animate: { opacity: 0 }, transition: { delay: 0.8, duration: 0.2 } })} className="absolute text-text-secondary">Select your country…</motion.span>
        <motion.span {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.9, duration: 0.2 } })} className="text-text-primary">{country}</motion.span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {PLANS.map((p, i) => {
          const chosen = i === 0;
          return (
            <motion.li
              key={p.name}
              {...enter(reduced, 1.0 + i * 0.15)}
              className={`relative flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 ${i === 2 ? 'max-md:hidden' : ''}`}
            >
              {chosen && <Highlight reduced={reduced} delay={1.9} />}
              <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${chosen ? 'border-blue-600' : 'border-border-medium'}`}>
                {chosen && <motion.span {...(reduced ? { initial: false } : { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 2.0 } })} className="h-2 w-2 rounded-full bg-blue-600" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-text-primary">
                  {p.name}
                  {p.popular && <span className="ml-2 rounded bg-blue-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Most popular</span>}
                </span>
                <span className="block truncate text-[10px] text-text-secondary">{p.history}</span>
              </span>
              <span className="flex-shrink-0 text-right">{free ? <span className="font-mono text-sm font-bold text-green-800">Free</span> : <Skeleton w="w-10" />}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

const DetailsPhase: React.FC<SceneProps> = ({ flow, reduced }) => {
  const fields: ReadonlyArray<readonly [string, string, number]> = [
    ['Name', '60%', 3.9],
    ['Email', '72%', 4.3],
    ['Phone Number', '50%', 4.7],
    ['Name of Entity to be Migrated', '55%', 5.1],
  ];
  return (
    <div>
      <p className="text-sm font-bold text-text-primary">Migration Information</p>
      <p className="mt-0.5 text-[11px] text-text-secondary">Tell us about the entity you want to migrate — this helps us scope and price your migration.</p>
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        {fields.map(([label, w, d]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-text-primary">{label}</p>
            <div className="mt-0.5 h-7 rounded-md border border-border bg-white px-2 py-2"><motion.div {...fillBar(reduced, d, w)} className="h-full rounded bg-bg-muted" /></div>
          </div>
        ))}
        <div>
          <p className="text-[10px] font-semibold text-text-primary">Financial Year End Date</p>
          <div className="mt-0.5 flex h-7 items-center rounded-md border border-border bg-white px-2 text-[11px] text-text-secondary">31st March</div>
        </div>
        <div className="sm:col-span-2">
          <motion.div
            {...(reduced ? { initial: false } : { initial: { opacity: 0.55 }, animate: { opacity: 1 }, transition: { delay: 5.8, duration: 0.3 } })}
            className="flex h-9 items-center justify-center rounded-lg bg-blue-700 text-xs font-semibold text-white"
          >
            {flow === 'paid' ? 'Continue to Payment' : 'Continue'}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const PrepareScene: React.FC<SceneProps> = ({ flow, reduced }) => (
  <div>
    <Stepper flow={flow} scene="prepare" />
    <Banner flow={flow} badge={flow === 'paid' ? 'Paid' : 'Free'} />
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)]">
      {/* Two screens in one cell: the plan step fades out as the details step fades in, so the height never changes. */}
      {!reduced && (
        <motion.div className="col-start-1 row-start-1 min-w-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3.3, duration: 0.3 }}>
          <PlanPhase flow={flow} reduced={reduced} />
        </motion.div>
      )}
      <motion.div className="col-start-1 row-start-1 min-w-0" {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 3.6, duration: 0.3 } })}>
        <DetailsPhase flow={flow} reduced={reduced} />
      </motion.div>
    </div>
  </div>
);

// ── 3a. Pay (paid migrations) ──────────────────────────────────────────────────────────────────────────────────────

export const PayScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const [from, to] = FLOWS[flow].pair;
  const rows: ReadonlyArray<readonly [string, React.ReactNode]> = [
    ['Migration pair', `${from} → ${to}`],
    ['Plan', 'Basic'],
    ['Historical data', 'Current Financial Year + 1 Historical Year'],
    ['Country', 'United Kingdom'],
    ['Date range', <Skeleton key="d" w="w-24" />],
  ];
  return (
    <div>
      <Stepper flow={flow} scene="pay" />
      <p className="text-sm font-bold text-text-primary">Review &amp; pay</p>
      <p className="mb-2.5 text-[11px] text-text-secondary">Check your order, then complete payment to begin your migration.</p>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <p className="border-b border-border bg-bg-light px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">Order summary</p>
        {rows.map(([k, v], i) => (
          <motion.div key={k} {...enter(reduced, 0.2 + i * 0.15)} className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 text-[11px]">
            <span className="text-text-secondary">{k}</span>
            <span className="min-w-0 break-words text-right font-semibold text-text-primary">{v}</span>
          </motion.div>
        ))}
        <div className="flex items-center justify-between bg-bg-light px-3 py-2 text-xs">
          <span className="font-bold text-text-primary">Total due today</span>
          <Skeleton w="w-12" />
        </div>
      </div>
      <div className="relative mt-3 flex h-10 items-center justify-center overflow-hidden rounded-lg bg-blue-700 text-sm font-semibold text-white">
        <motion.span aria-hidden="true" className="absolute inset-0 bg-green-700" {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 3.4, duration: 0.3 } })} />
        {reduced ? (
          <span className="relative flex items-center gap-2"><Check /> Payment complete</span>
        ) : (
          <>
            <motion.span className="absolute" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3.4, duration: 0.1 }}>Pay securely</motion.span>
            <motion.span className="relative flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}><Check /> Payment complete</motion.span>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-text-secondary">256-bit SSL · Powered by Razorpay · No card details stored here</p>
    </div>
  );
};

// ── 3b. Review and start (free migrations) ─────────────────────────────────────────────────────────────────────────

export const ReviewScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const rows: ReadonlyArray<readonly [string, React.ReactNode]> = [
    ['Name', <Skeleton key="n" w="w-20" />],
    ['Name of entity to be migrated', <Skeleton key="e" w="w-24" />],
    ['Country', 'Australia'],
    ['Historical period', 'Current Financial Year + 1 Historical Year'],
    ['Total', <span key="t" className="font-mono text-sm font-bold text-green-800">Free</span>],
  ];
  return (
    <div>
      <Stepper flow={flow} scene="review" />
      <div className="flex flex-col items-center text-center">
        <motion.span {...(reduced ? { initial: false } : { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring', stiffness: 380, damping: 18 } })} className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-green-800">
          <Check className="h-5 w-5" />
        </motion.span>
        <p className="mt-1.5 text-sm font-bold text-text-primary">Migration Ready</p>
        <p className="text-[11px] text-text-secondary">Review your migration details below</p>
      </div>
      <div className="mt-2.5 overflow-hidden rounded-lg border border-border bg-white">
        {rows.map(([k, v], i) => (
          <motion.div key={k} {...enter(reduced, 0.4 + i * 0.15)} className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 text-[11px] last:border-b-0">
            <span className="text-text-secondary">{k}</span>
            <span className="min-w-0 break-words text-right font-semibold text-text-primary">{v}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-2.5 rounded-lg border border-border bg-white px-3 py-2.5">
        <p className="text-center text-[11px] text-text-secondary">Your migration will start in 3 seconds…</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-lighter">
          <motion.div {...(reduced ? { initial: false, style: { width: '100%' } } : { initial: { width: '0%' }, animate: { width: '100%' }, transition: { delay: 1.6, duration: 3, ease: 'linear' } })} className="h-full rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  );
};

// ── 4. Connect ─────────────────────────────────────────────────────────────────────────────────────────────────────

export const ConnectScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const [from, to] = FLOWS[flow].pair;
  const tile = (role: string, name: string, delay: number) => (
    <motion.div {...enter(reduced, delay)} className="flex flex-1 flex-col items-center rounded-xl border border-border bg-white px-4 py-4 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-lighter text-base font-bold text-text-secondary">{name[0]}</span>
      <p className="mt-2 text-sm font-semibold text-text-primary">{name}</p>
      <p className="text-[11px] text-text-secondary">{role}</p>
      <div className="relative mt-3 h-8 w-full max-w-[180px]">
        <motion.span
          {...(reduced ? { initial: false, style: { opacity: 0 } } : { initial: { opacity: 1 }, animate: { opacity: 0 }, transition: { delay: delay + 1.5, duration: 0.2 } })}
          className="absolute inset-0 flex items-center justify-center rounded-md border border-blue-600 text-xs font-semibold text-blue-800"
        >
          Authorise
        </motion.span>
        <motion.span
          {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: delay + 1.7, duration: 0.3 } })}
          className="absolute inset-0 flex items-center justify-center gap-1 rounded-md bg-green-light text-xs font-semibold text-green-800"
        >
          <Check className="h-3 w-3" /> Connected
        </motion.span>
      </div>
    </motion.div>
  );
  return (
    <div>
      <Stepper flow={flow} scene="connect" />
      <p className="mb-3 text-sm font-bold text-text-primary">Connect your accounts</p>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {tile('Source account', from, 0.2)}
        <div className="flex justify-center text-text-secondary" aria-hidden="true">
          <span className="hidden sm:inline">→</span>
          <span className="sm:hidden">↓</span>
        </div>
        {tile('Destination account', to, 0.6)}
      </div>
    </div>
  );
};

// ── 5. Migrate and verify ──────────────────────────────────────────────────────────────────────────────────────────

export const MigrateScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const rows = ['Contacts', 'Invoices and bills', 'Bank transactions', 'Chart of accounts'];
  const checks = ['Records match your source', 'Balances match your source', 'Reconciliation report ready'];
  return (
    <div>
      <Stepper flow={flow} scene="migrate" />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary">Migration in progress</p>
            <p className="text-[11px] text-text-secondary">Live progress</p>
          </div>
          <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-bg-lighter">
            <motion.div {...(reduced ? { initial: false, style: { width: '100%' } } : { initial: { width: '0%' }, animate: { width: '100%' }, transition: { delay: 0.3, duration: 2.8, ease: 'easeInOut' } })} className="h-full rounded-full bg-blue-700" />
          </div>
          <ul className="mt-3 space-y-1.5">
            {rows.map((label, i) => (
              <motion.li key={label} {...enter(reduced, 0.8 + i * 0.6)} className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-[11px] text-text-secondary">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-light text-green-800"><Check className="h-2.5 w-2.5" /></span>
                {label}
              </motion.li>
            ))}
          </ul>
        </div>
        <motion.div {...enter(reduced, 3.4)} className="rounded-xl border border-green-200 bg-green-light p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800"><Check /> Built-in accuracy check</p>
          <ul className="mt-3 space-y-2">
            {checks.map((label, i) => (
              <motion.li key={label} {...enter(reduced, 3.7 + i * 0.5)} className="flex items-center gap-2 text-[11px] text-text-secondary">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-700 text-white"><Check className="h-2.5 w-2.5" /></span>
                {label}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export const SCENES: Record<SceneKey, React.FC<SceneProps>> = {
  choose: ChooseScene,
  prepare: PrepareScene,
  pay: PayScene,
  review: ReviewScene,
  connect: ConnectScene,
  migrate: MigrateScene,
};
