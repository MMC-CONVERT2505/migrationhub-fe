import React, { useEffect, useState } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { LogoMark } from '@/components/layout/Navbar';
import { stepperFor, type FlowKey, type SceneKey } from './flows';
import {
  CHOSEN_PLAN,
  DEMO,
  FAQ,
  JOURNEY_PAIR,
  REGION_FREE_COUNTRIES,
  WALK_PAIRS,
  WALK_PLANS,
  logoCandidates,
  logoFor,
  money,
  planDates,
  planRange,
  platformName,
  toolName,
  type WalkPair,
  type WalkPlan,
} from './walkthroughData';

// ── Motion helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
// Everything is quick (the walkthrough is a demonstration, not a tutorial) and becomes instant when the visitor
// prefers reduced motion. Delays are in seconds, from the moment the screen appears.

type Anim = Pick<MotionProps, 'initial' | 'animate' | 'transition'>;

const enter = (reduced: boolean, delay: number): Anim =>
  reduced ? { initial: false } : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.22 } };

const appear = (reduced: boolean, delay: number): Anim =>
  reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.18 } };

/** The "selected" ring: a brand-coloured overlay that fades in, so the colour always comes from the theme tokens. */
const Highlight: React.FC<{ reduced: boolean; delay: number }> = ({ reduced, delay }) => (
  <motion.span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-blue-600 bg-blue-light"
    {...appear(reduced, delay)}
  />
);

export interface SceneProps {
  flow: FlowKey;
  reduced: boolean;
  /** The home page's pairs when the live listing has loaded; the built-in copy of them otherwise. */
  pairs?: readonly WalkPair[];
}

/**
 * Plays a scene's screens one after another: screen `i` replaces the one before it `at[i]` ms after the scene starts.
 * With reduced motion it shows the single most telling screen (`still`) and never changes.
 */
const Screens: React.FC<{ at: readonly number[]; reduced: boolean; still?: number; fill?: boolean; children: React.ReactNode[] }> = ({ at, reduced, still = 0, fill, children }) => {
  const [i, setI] = useState(reduced ? still : 0);
  // Keyed on the timing values, not the array: a parent re-render (a hover, the pairs finishing loading) hands over a
  // new array with the same numbers and must not restart the scene.
  const timing = at.join(',');
  useEffect(() => {
    if (reduced) {
      setI(still);
      return;
    }
    setI(0);
    const timers = timing.split(',').slice(1).map((ms, k) => setTimeout(() => setI(k + 1), Number(ms)));
    return () => timers.forEach(clearTimeout);
  }, [timing, reduced, still]);
  return (
    <motion.div key={i} className={fill ? 'flex flex-1 flex-col' : undefined} {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } })}>
      {children[i]}
    </motion.div>
  );
};

const TYPE_MS = 26;

/** Types `text` into a field `start` ms after it appears (instantly with reduced motion). */
const Typed: React.FC<{ text: string; start: number; reduced: boolean; placeholder?: string }> = ({ text, start, reduced, placeholder }) => {
  const [n, setN] = useState(reduced ? text.length : -1);
  useEffect(() => {
    if (reduced) {
      setN(text.length);
      return;
    }
    setN(-1);
    let i = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      setN(0);
      iv = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && iv) clearInterval(iv);
      }, TYPE_MS);
    }, start);
    return () => {
      clearTimeout(t);
      if (iv) clearInterval(iv);
    };
  }, [text, start, reduced]);
  if (n < 0) return placeholder ? <span className="text-text-tertiary">{placeholder}</span> : null;
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="ml-px inline-block h-3 w-px animate-pulse bg-text-primary align-middle" />}
    </>
  );
};

/** Swaps `before` for `after` at `at` seconds (a value the customer changes, e.g. choosing a country). */
const Swap: React.FC<{ before: React.ReactNode; after: React.ReactNode; at: number; reduced: boolean; className?: string }> = ({ before, after, at, reduced, className = '' }) => {
  const [done, setDone] = useState(reduced);
  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }
    setDone(false);
    const t = setTimeout(() => setDone(true), at * 1000);
    return () => clearTimeout(t);
  }, [at, reduced]);
  return <span className={className}>{done ? after : before}</span>;
};

// ── Pieces that mirror the real platform's chrome ──────────────────────────────────────────────────────────────────

const Check: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/** A platform's real logo (the same bundled files the home page's pair cards use), or its name if there is none. */
const Logo: React.FC<{ k: string; className?: string; src?: string | null }> = ({ k, className = 'max-h-6', src: override }) => {
  // The live logo first, then the bundled mark; a logo that fails to load (a bad upload, an offline CDN) moves on to the
  // next candidate, and the platform's name is the last resort.
  const [fails, setFails] = useState(0);
  useEffect(() => setFails(0), [override, k]);
  const src = logoCandidates(override, logoFor(k))[fails] ?? null;
  return src ? (
    <img src={src} alt={platformName(k)} draggable={false} onError={() => setFails((n) => n + 1)} className={`${className} max-w-full object-contain`} />
  ) : (
    <span className="text-xs font-bold text-text-secondary">{platformName(k)}</span>
  );
};

const LogoBox: React.FC<{ k: string; src?: string | null; size?: string }> = ({ k, src, size = 'h-12' }) => (
  <span className={`flex min-w-0 flex-1 items-center justify-center rounded-lg border border-border bg-white px-2 ${size}`}>
    <Logo k={k} src={src} className="max-h-7" />
  </span>
);

/** The website's top bar, as on every page of the flow. */
const HubChrome: React.FC<{ back?: boolean; children: React.ReactNode }> = ({ back, children }) => (
  <div className="flex flex-1 flex-col">
    <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
      <span className="flex items-center gap-3">
        {back && (
          <span className="flex items-center gap-1 border-r border-border pr-3 text-xs font-medium text-text-primary">
            <span aria-hidden="true">‹</span> Back
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="origin-left scale-75"><LogoMark /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-blue-700">Migration Hub</span>
            <span className="text-[9px] text-text-primary">Powered by MMC Convert</span>
          </span>
        </span>
      </span>
      <span className="hidden gap-5 text-[11px] font-semibold text-text-primary sm:flex"><span>Platforms</span><span>Reviews</span><span>Contact Us</span></span>
    </div>
    <div className="flex-1 bg-bg px-4 py-4 sm:px-6">{children}</div>
  </div>
);

/** The checkout stepper (Prepare / Pay / Connect / Migrate), exactly the stages the platform shows for this flow. */
const Stepper: React.FC<{ flow: FlowKey; scene: SceneKey }> = ({ flow, scene }) => {
  const s = stepperFor(flow, scene);
  if (!s) return null;
  return (
    <ol className="mx-auto mb-3 flex max-w-sm items-start">
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

const FREE_BADGE = '🔥 Free';
const PAID_BADGE = '🏷️ Paid';
const COUNTRY_BADGE = '🌍 Priced by country';

const BadgePill: React.FC<{ free: boolean; children: React.ReactNode }> = ({ free, children }) => (
  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${free ? 'bg-green-light text-green-800' : 'border border-border bg-white text-text-secondary'}`}>{children}</span>
);

const Banner: React.FC<{ flow: FlowKey; badge: React.ReactNode }> = ({ flow, badge }) => {
  const { src, dst } = JOURNEY_PAIR[flow];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-light px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-800">Selected migration</p>
        <p className="truncate text-xs font-bold text-text-primary">{platformName(src)} → {platformName(dst)}</p>
      </div>
      {badge}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-border bg-white p-4 shadow-card ${className}`}>{children}</div>
);

// ── 1. Choose: the home page's migration pairs ─────────────────────────────────────────────────────────────────────

const Pill: React.FC<{ tone: 'free' | 'paid' | 'region' | 'elsewhere'; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      tone === 'free' ? 'bg-green-light text-green-800' : tone === 'region' ? 'bg-blue-light text-blue-800' : 'border border-border bg-bg-light text-text-secondary'
    }`}
  >
    {children}
  </span>
);

const cta = (p: WalkPair) =>
  p.status === 'region'
    ? { label: 'Check your region →', cls: 'text-blue-700' }
    : p.status === 'free'
      ? { label: 'Start free →', cls: 'text-green-800' }
      : { label: 'See pricing →', cls: 'text-blue-800' };

export const ChooseScene: React.FC<SceneProps> = ({ flow, reduced, pairs = WALK_PAIRS }) => {
  const chosen = JOURNEY_PAIR[flow];
  return (
    <HubChrome>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-blue-800">Migration pairs</p>
      <p className="mb-3 text-center text-base font-bold text-text-primary">Select your migration path</p>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {pairs.map((p, i) => {
          const on = p.src === chosen.src && p.dst === chosen.dst;
          const action = cta(p);
          return (
            <motion.li
              key={p.src + p.dst}
              {...enter(reduced, 0.03 + i * 0.045)}
              className={`relative flex min-w-0 flex-col rounded-xl border border-border bg-white p-3 ${i >= 6 ? 'max-lg:hidden' : ''}`}
            >
              {on && <Highlight reduced={reduced} delay={0.9} />}
              <div className="flex items-center gap-1.5">
                <LogoBox k={p.src} src={p.srcLogo} />
                <span aria-hidden="true" className="text-xs text-text-tertiary">→</span>
                <LogoBox k={p.dst} src={p.dstLogo} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {p.status === 'region' ? (
                  <>
                    <Pill tone="region">{`Free in ${(p.freeCountries?.length ? p.freeCountries : REGION_FREE_COUNTRIES).join(', ')}`}</Pill>
                    <Pill tone="elsewhere">Paid elsewhere</Pill>
                  </>
                ) : p.status === 'free' ? (
                  <Pill tone="free">{FREE_BADGE}</Pill>
                ) : (
                  <Pill tone="paid">{PAID_BADGE}</Pill>
                )}
              </div>
              <p className={`mt-auto border-t border-border pt-1.5 text-right text-[11px] font-semibold ${action.cls}`}>{action.label}</p>
            </motion.li>
          );
        })}
      </ul>
    </HubChrome>
  );
};

// ── 2. Prepare: plan, then details ─────────────────────────────────────────────────────────────────────────────────

const PlanRow: React.FC<{ plan: WalkPlan; free: boolean; chosen: boolean; reduced: boolean; delay: number }> = ({ plan, free, chosen, reduced, delay }) => (
  <motion.li {...enter(reduced, delay)} className="relative rounded-xl border border-border bg-white px-3.5 py-2.5">
    {chosen && <Highlight reduced={reduced} delay={delay + 0.7} />}
    <div className="relative flex items-start gap-2.5">
      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${chosen ? 'border-blue-600' : 'border-border-medium'}`}>
        {chosen && <motion.span {...(reduced ? { initial: false } : { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: delay + 0.8, duration: 0.15 } })} className="h-2 w-2 rounded-full bg-blue-600" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-xs font-bold text-text-primary">
          {plan.name}
          {plan.popular && !free && <span className="rounded bg-blue-700 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">Most popular</span>}
        </p>
        <p className="text-[10px] text-text-secondary">{plan.history}</p>
        <p className="mt-1 text-[10px] text-text-secondary md:hidden">{plan.support}</p>
        <div className="mt-1.5 hidden gap-1 overflow-hidden md:flex" title={plan.support}>
          {plan.chips.slice(0, 3).map((c) => (
            <span key={c} className="flex-shrink-0 rounded-md bg-bg-lighter px-1.5 py-0.5 text-[9px] text-text-secondary">{c}</span>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {free ? <span className="font-mono text-sm font-bold text-green-800">Free</span> : <><span className="text-sm font-bold text-text-primary">{money(plan.price)}</span><span className="block text-[9px] text-text-tertiary">one-time</span></>}
      </div>
    </div>
  </motion.li>
);

const PlanScreen: React.FC<SceneProps> = ({ flow, reduced }) => {
  const free = flow === 'free';
  const plans = free ? [WALK_PLANS[0]] : WALK_PLANS;
  return (
    <>
      <Stepper flow={flow} scene="prepare" />
      <Card className="mx-auto max-w-xl">
        <Banner
          flow={flow}
          badge={
            free ? (
              <Swap before={<BadgePill free={false}>{COUNTRY_BADGE}</BadgePill>} after={<BadgePill free>{FREE_BADGE}</BadgePill>} at={0.5} reduced={reduced} />
            ) : (
              <BadgePill free={false}>{COUNTRY_BADGE}</BadgePill>
            )
          }
        />
        <p className="mt-3 text-base font-bold text-text-primary">Choose your migration plan</p>
        <p className="text-[11px] text-text-secondary">{free ? 'This migration is free — choose the plan that fits your data.' : 'Pick the plan that matches how much history you need to bring across.'}</p>
        <p className="mt-3 text-[11px] font-semibold text-text-primary">Country your business is registered in</p>
        <p className="text-[9px] text-text-secondary">This sets your currency and prices, and you’ll confirm it with your details next. Not listed? <span className="font-semibold text-blue-800">Contact us.</span></p>
        <div className="mt-1 flex h-8 items-center rounded-lg border border-border bg-white px-2.5 text-xs text-text-primary">
          <Swap before={<span className="text-text-secondary">Select your country…</span>} after={DEMO.country} at={0.4} reduced={reduced} />
        </div>
        <div className="relative mt-2.5">
          {!reduced && (
            <motion.p
              aria-hidden="true"
              className="absolute inset-x-0 top-0 rounded-xl bg-bg-lighter px-3.5 py-3 text-[11px] text-text-secondary"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.15 }}
            >
              Select your country to see the plans and prices available to you.
            </motion.p>
          )}
          <ul className="space-y-2">
            {plans.map((p, i) => (
              <PlanRow key={p.name} plan={p} free={free} chosen={p.name === CHOSEN_PLAN[flow].name} reduced={reduced} delay={0.5 + i * 0.1} />
            ))}
          </ul>
        </div>
        <motion.div
          {...(reduced ? { initial: false } : { initial: { opacity: 0.45 }, animate: { opacity: 1 }, transition: { delay: 1.7, duration: 0.2 } })}
          className="mt-3 flex h-9 items-center justify-center rounded-lg bg-blue-700 text-xs font-semibold text-white"
        >
          Continue
        </motion.div>
      </Card>
    </>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="text-[10px] font-semibold text-text-primary">{label} <span className="text-red">*</span></p>
    <div className="mt-0.5 flex h-8 items-center rounded-lg border border-border bg-white px-2.5 text-xs text-text-primary">{children}</div>
  </div>
);

const FaqPanel: React.FC<{ flow: FlowKey }> = ({ flow }) => (
  <div className="hidden md:block">
    <p className="text-base font-bold text-text-primary">{FAQ.title}</p>
    <p className="mt-0.5 text-[11px] text-text-secondary">{FAQ.intro[flow]}</p>
    <ul className="mt-2.5 space-y-1.5">
      {FAQ.questions.map((q, i) => (
        <li key={q} className="rounded-xl border border-border bg-white px-3 py-2">
          <p className="flex items-center justify-between gap-2 text-[11px] font-semibold text-text-primary">
            {q}
            <span aria-hidden="true" className="text-text-tertiary">{i === 0 ? '⌃' : '⌄'}</span>
          </p>
          {i === 0 && <p className="mt-1.5 text-[10px] leading-relaxed text-text-secondary">{FAQ.firstAnswer[flow]}</p>}
        </li>
      ))}
    </ul>
  </div>
);

const DetailsScreen: React.FC<SceneProps> = ({ flow, reduced }) => {
  const free = flow === 'free';
  return (
    <>
      <Stepper flow={flow} scene="prepare" />
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card>
          <Banner flow={flow} badge={<BadgePill free={free}>{free ? FREE_BADGE : PAID_BADGE}</BadgePill>} />
          <p className="mt-3 text-base font-bold text-text-primary">Migration Information</p>
          <p className="text-[11px] text-text-secondary">Tell us about the entity you want to migrate — this helps us scope and price your migration.</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <Field label="Name"><Typed text={DEMO.name} start={80} reduced={reduced} placeholder="John Doe" /></Field>
            <Field label="Email"><Typed text={DEMO.email} start={420} reduced={reduced} placeholder="john.doe@example.com" /></Field>
            <Field label="Phone Number">
              <span className="mr-2 border-r border-border pr-2">{DEMO.dial}</span>
              <Typed text={DEMO.phone} start={900} reduced={reduced} placeholder="412 345 678" />
            </Field>
            <div>
              <p className="text-[10px] font-semibold text-text-primary">Country</p>
              <div className="mt-0.5 flex h-8 items-center justify-between rounded-lg border border-border bg-white px-2.5 text-xs text-text-primary">
                <span>{DEMO.country} <span className="text-text-secondary">· prices in {DEMO.currency}</span></span>
                <span className="text-[10px] font-semibold text-blue-800">Change</span>
              </div>
              <p className="mt-0.5 text-[8px] text-text-secondary">Chosen on the plan step. Changing it updates your prices.</p>
            </div>
            <Field label="Name of Entity to be Migrated"><Typed text={DEMO.entity} start={1350} reduced={reduced} placeholder="Acme Pty Ltd" /></Field>
            <Field label="Financial Year End Date">{DEMO.fyEnd}</Field>
          </div>
          <motion.div
            {...(reduced ? { initial: false } : { initial: { opacity: 0.5 }, animate: { opacity: 1 }, transition: { delay: 1.9, duration: 0.2 } })}
            className="mt-3 flex h-9 items-center justify-center rounded-lg bg-blue-700 text-xs font-semibold text-white"
          >
            {free ? 'Continue' : 'Continue to Payment'}
          </motion.div>
          <p className="mt-1.5 text-center text-[10px] text-text-primary">Change plan</p>
        </Card>
        <FaqPanel flow={flow} />
      </div>
    </>
  );
};

export const PrepareScene: React.FC<SceneProps> = (p) => (
  <HubChrome back>
    <Screens at={[0, 2500]} reduced={p.reduced} still={1}>
      {[<PlanScreen key="plan" {...p} />, <DetailsScreen key="details" {...p} />]}
    </Screens>
  </HubChrome>
);

// ── 3a. Pay (paid migrations): Review & pay, then the Razorpay page ────────────────────────────────────────────────

const ReviewPayScreen: React.FC<SceneProps> = ({ flow, reduced }) => {
  const { src, dst } = JOURNEY_PAIR[flow];
  const plan = CHOSEN_PLAN[flow];
  const rows: ReadonlyArray<readonly [string, string]> = [
    ['Migration pair', `${platformName(src)} → ${platformName(dst)}`],
    ['Plan', plan.name],
    ['Historical data', plan.history.replace(' history', '')],
    ['Country', DEMO.country],
    ['Date range', planRange(flow)],
    ['Financial year end', DEMO.fyEnd],
  ];
  return (
    <>
      <Stepper flow={flow} scene="pay" />
      <div className="mx-auto max-w-xl">
        <p className="text-base font-bold text-text-primary">Review &amp; pay</p>
        <p className="mb-2 text-[11px] text-text-secondary">Check your order, then complete payment to begin your migration.</p>
        <Banner flow={flow} badge={<BadgePill free={false}>{PAID_BADGE}</BadgePill>} />
        <div className="mt-2.5 overflow-hidden rounded-xl border border-border bg-white">
          <p className="flex items-center justify-between border-b border-border bg-bg-light px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            Order summary
            <span className="flex gap-3 normal-case tracking-normal text-blue-800"><span>Change plan</span><span>Edit details</span></span>
          </p>
          {rows.map(([k, v], i) => (
            <motion.div key={k} {...enter(reduced, 0.05 + i * 0.07)} className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 text-[11px]">
              <span className="text-text-secondary">{k}</span>
              <span className="min-w-0 break-words text-right font-semibold text-text-primary">{v}</span>
            </motion.div>
          ))}
          <div className="flex items-center justify-between bg-bg-light px-3 py-2 text-xs">
            <span className="font-bold text-text-primary">Total due today</span>
            <span className="text-sm font-bold text-blue-800">{money(plan.price)}</span>
          </div>
        </div>
        <div className="relative mt-2.5 flex h-10 items-center justify-center rounded-lg bg-blue-700 text-xs font-semibold text-white">
          <motion.span aria-hidden="true" className="absolute inset-0 rounded-lg ring-4 ring-blue-300/60" {...appear(reduced, 1.5)} />
          Pay {money(plan.price)} – Complete Payment
        </div>
        <p className="mt-1.5 text-center text-[10px] text-text-secondary">256-bit SSL · Powered by Razorpay · No card details stored here</p>
      </div>
    </>
  );
};

/**
 * The hosted Razorpay payment-link page, screen by screen as a customer sees it: contact details, payment options,
 * the card and its CVV, the bank's page, then "Confirming Payment".
 */
type RzpStep = 'contact' | 'options' | 'card' | 'bank' | 'confirming';

const RZP_RECEIPT = '7a3a3534-0fd2-45ef-96bc-c8216ae5e7a7';
const expiry = () => {
  const d = new Date(Date.now() + 30 * 60_000);
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} (${time})`;
};

const RzpInput: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-9 items-center rounded-lg border border-border bg-white px-2.5 text-[11px] text-text-primary">{children}</div>
);

const BlackButton: React.FC<{ reduced: boolean; at: number; children: React.ReactNode }> = ({ reduced, at, children }) => (
  <motion.div
    {...(reduced ? { initial: false } : { initial: { opacity: 0.6 }, animate: { opacity: 1 }, transition: { delay: at, duration: 0.15 } })}
    className="flex h-9 items-center justify-center rounded-lg bg-text-primary text-[11px] font-semibold text-white"
  >
    {children}
  </motion.div>
);

const CardBrandDots: React.FC = () => (
  <span aria-hidden="true" className="flex gap-1">
    <span className="h-3 w-5 rounded-sm bg-[#2563eb]" />
    <span className="h-3 w-5 rounded-sm bg-red/70" />
    <span className="h-3 w-5 rounded-sm bg-[#60a5fa]" />
    <span className="h-3 w-5 rounded-sm bg-[#1e3a8a]" />
  </span>
);

const RazorpayScreen: React.FC<SceneProps & { step: RzpStep }> = ({ flow, reduced, step }) => {
  const plan = CHOSEN_PLAN[flow];
  const testBanner = step !== 'contact';
  const dim = step === 'card' || step === 'bank' || step === 'confirming';
  return (
    <div className="mx-auto min-h-[600px] max-w-3xl">
      <div className="relative flex items-start justify-center pt-1 sm:pl-0">
        {/* Left: what is being paid for */}
        <div className="w-full max-w-[22rem] overflow-hidden rounded-xl border border-border bg-white sm:mr-[-2.5rem] sm:pr-10">
          {testBanner && (
            <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[9px] leading-snug text-amber-900">
              This payment link is created in <span className="font-bold">Test Mode</span>. Only test payments can be made for this.
            </p>
          )}
          <div className="p-4">
            <p className="text-sm font-bold text-text-primary">Payment Request from MMC Convert</p>
            <p className="mt-3 text-[8px] uppercase tracking-wider text-text-tertiary">Payment for</p>
            <p className="text-[11px] text-text-primary">{plan.name} Migration Plan</p>
            <p className="mt-2.5 text-[8px] uppercase tracking-wider text-text-tertiary">Receipt</p>
            <p className="break-all text-[11px] text-text-primary">{RZP_RECEIPT}</p>
            <p className="mt-2.5 text-[8px] uppercase tracking-wider text-text-tertiary">Expire by</p>
            <p className="text-[11px] text-text-primary">{expiry()}</p>
            <p className="mt-2.5 text-[8px] uppercase tracking-wider text-text-tertiary">Amount payable</p>
            <p className="text-base font-bold text-text-primary">{DEMO.currency} {plan.price}.00</p>
            <span className="mt-1 block h-0.5 w-5 bg-green-500" />
          </div>
        </div>

        {/* Right: the checkout */}
        <div className="relative z-10 w-[14.5rem] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-card-hover">
          {step === 'contact' ? (
            <>
              <div className="bg-[#2563eb] px-4 pb-4 pt-5 text-center text-white">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">M</span>
                <p className="mt-1.5 text-xs font-semibold">MMC Convert</p>
                <p className="mt-3 text-[10px] opacity-80">Total Amount</p>
                <p className="text-xl font-bold">{money(plan.price)}</p>
              </div>
              <div className="space-y-2 px-3 py-3">
                <p className="text-sm font-bold text-text-primary">Contact details</p>
                <p className="text-[9px] text-text-secondary">Enter mobile &amp; email to continue</p>
                <RzpInput><span className="mr-2 border-r border-border pr-2">🇦🇺 +61</span><Typed text="412 345 678" start={150} reduced={reduced} placeholder="Mobile number" /></RzpInput>
                <RzpInput><Typed text={DEMO.email} start={550} reduced={reduced} placeholder="Email address" /></RzpInput>
                <BlackButton reduced={reduced} at={0.85}>Continue</BlackButton>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between bg-[#2563eb] px-3 py-2.5 text-white">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-[11px] font-bold">M</span>
                  <span className="text-xs font-semibold">MMC Convert</span>
                </span>
                <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[10px]">●</span>
              </div>
              <div className={`relative ${dim ? 'opacity-100' : ''}`}>
                <div className={`px-3 pb-2 pt-3 ${step === 'confirming' ? 'opacity-30' : ''}`}>
                  <p className="text-sm font-bold text-text-primary">Payment Options</p>
                  <p className="mt-2 text-[9px] text-text-secondary">Recommended</p>
                  <div className="relative mt-1 flex items-center justify-between rounded-lg border border-border px-2.5 py-2 text-[10px] text-text-primary">
                    {step === 'options' && <Highlight reduced={reduced} delay={0.3} />}
                    <span className="relative">MasterCard Credit Card • 4444</span>
                    <span aria-hidden="true" className="relative">›</span>
                  </div>
                  <p className="mt-2.5 text-[9px] text-text-secondary">All Payment Options</p>
                  <div className="mt-1 rounded-lg border border-border px-2.5 py-2 text-[10px] text-text-primary">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-2">Cards <CardBrandDots /></span><span aria-hidden="true">{step === 'bank' ? '⌃' : '⌄'}</span></div>
                    {step === 'bank' && (
                      <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                        <p className="flex justify-between">MasterCard Credit card • 4444 <span aria-hidden="true">›</span></p>
                        <p className="flex justify-between text-[#1e40af]">+ Add a new card <span aria-hidden="true">›</span></p>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 ${step === 'confirming' ? 'opacity-30' : ''}`}>
                  <span><span className="block text-xs font-bold text-text-primary">{money(plan.price)}</span><span className="text-[8px] text-text-secondary">View Details ⌃</span></span>
                  <span className="rounded-lg bg-text-primary px-5 py-2 text-[11px] font-semibold text-white">Continue</span>
                </div>

                {step === 'card' && (
                  <motion.div {...(reduced ? { initial: false } : { initial: { y: 30, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.2 } })} className="absolute inset-0 flex flex-col justify-end bg-text-primary/55">
                    <div className="bg-white px-3 pb-3 pt-3">
                      <div className="relative mx-auto h-24 w-full rounded-xl bg-gradient-to-br from-[#0b2a5b] to-[#1d5fd6] p-3 text-white">
                        <span className="block h-5 w-7 rounded bg-white/70" />
                        <span className="absolute bottom-3 left-3 text-[11px] font-semibold tracking-widest">XXXX4444</span>
                        <span aria-hidden="true" className="absolute right-3 top-3 flex"><span className="h-4 w-4 rounded-full bg-red/90" /><span className="-ml-1.5 h-4 w-4 rounded-full bg-amber-400/90" /></span>
                      </div>
                      <div className="mt-2.5 flex h-9 items-center rounded-lg border-2 border-text-primary px-2.5 text-sm tracking-widest">
                        <Typed text="•••" start={300} reduced={reduced} placeholder="CVV" />
                      </div>
                      <div className="mt-2"><BlackButton reduced={reduced} at={0.8}>Continue</BlackButton></div>
                    </div>
                  </motion.div>
                )}

                {step === 'confirming' && (
                  <motion.div {...(reduced ? { initial: false } : { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.18 } })} className="absolute inset-x-0 bottom-0 top-6 bg-white px-4 pt-5 text-center shadow-card">
                    <p className="text-sm font-bold text-text-primary">Confirming Payment</p>
                    <p className="mt-1 text-[10px] text-text-secondary">This will only take a few seconds.</p>
                    <motion.span
                      aria-hidden="true"
                      className="mx-auto mt-5 block h-9 w-6 rounded-full bg-amber-400 ring-2 ring-amber-300"
                      {...(reduced ? { initial: false } : { animate: { scaleX: [1, 0.2, 1] }, transition: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } })}
                    />
                    <p className="mt-6 text-[9px] text-text-secondary">Secured by <span className="font-bold italic text-[#1e40af]">Razorpay</span></p>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>

        {/* The bank's page, in its own small window */}
        {step === 'bank' && (
          <motion.div
            {...(reduced ? { initial: false } : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } })}
            className="absolute left-0 top-2 z-20 w-[min(100%,21rem)] overflow-hidden rounded-lg border border-border-medium bg-white shadow-card-hover"
          >
            <div className="flex items-center justify-between border-b border-border bg-bg-lighter px-2.5 py-1.5 text-[9px] text-text-primary">
              <span className="font-semibold">Razorpay Bank - Google Chrome</span>
              <span aria-hidden="true" className="tracking-widest">– ▢ ✕</span>
            </div>
            <p className="border-b border-border px-2.5 py-1 text-[8px] text-text-secondary">api.razorpay.com/v1/gateway/mocksharp/payment?key_id=rzp_test_…</p>
            <div className="px-4 py-5 text-center">
              <span className="text-3xl font-black italic text-[#2563eb]">1</span>
              <p className="mt-2 text-xs font-bold text-text-primary">Welcome to Razorpay Software Private Ltd Bank</p>
              <p className="mt-2 text-[9px] text-text-secondary">This is just a demo bank page.<br />You can choose whether to make this payment successful or not:</p>
              <div className="mt-3 flex justify-center gap-2.5">
                <span className="relative rounded bg-green-600 px-5 py-2 text-[10px] font-semibold text-white">
                  <motion.span aria-hidden="true" className="absolute inset-0 rounded ring-4 ring-green-300/70" {...appear(reduced, 0.5)} />
                  Success
                </span>
                <span className="rounded bg-red/80 px-5 py-2 text-[10px] font-semibold text-white">Failure</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Razorpay's footer */}
      <div className="mx-auto mt-4 max-w-md rounded-xl border border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black italic text-[#1e40af]">Razorpay</span>
          <span className="flex gap-2 text-[9px] font-bold italic text-text-secondary"><span>UPI</span><span>VISA</span><span>●●</span><span>RuPay</span></span>
        </div>
        <p className="mt-2 text-[8px] leading-snug text-text-secondary">Want to create payment links for your business? Visit <span className="text-[#2563eb]">razorpay.com/payment-links</span> and get started instantly.</p>
        {step === 'contact' && <p className="text-[8px] text-text-secondary">Please report this Payment Link if you find it to be suspicious <span className="text-[#2563eb]">⚑ Report Payment Link</span></p>}
      </div>
    </div>
  );
};

/** Review & pay, then Razorpay's five screens. */
export const PayScene: React.FC<SceneProps> = (p) => (
  <HubChrome back>
    <Screens at={[0, 1600, 2500, 3400, 4300, 5300]} reduced={p.reduced} still={0}>
      {[
        <ReviewPayScreen key="review" {...p} />,
        <RazorpayScreen key="contact" {...p} step="contact" />,
        <RazorpayScreen key="options" {...p} step="options" />,
        <RazorpayScreen key="card" {...p} step="card" />,
        <RazorpayScreen key="bank" {...p} step="bank" />,
        <RazorpayScreen key="confirming" {...p} step="confirming" />,
      ]}
    </Screens>
  </HubChrome>
);

// ── 3b. Review and start (free migrations) ─────────────────────────────────────────────────────────────────────────

const Countdown: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (reduced) return;
    setN(3);
    const timers = [setTimeout(() => setN(2), 800), setTimeout(() => setN(1), 1600)];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  return <>{n} {n === 1 ? 'second' : 'seconds'}</>;
};

export const ReviewScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const plan = CHOSEN_PLAN[flow];
  const rows: ReadonlyArray<readonly [string, React.ReactNode]> = [
    ['Name', DEMO.name],
    ['Name of entity to be migrated', DEMO.entity],
    ['Country', DEMO.country],
    ['Historical period', plan.history.replace(' history', '')],
    ['FY end', DEMO.fyEnd],
    ['Date range', planRange(flow)],
    ['Total', <span key="t" className="font-mono text-sm font-bold text-green-800">Free</span>],
  ];
  return (
    <HubChrome back>
      <Stepper flow={flow} scene="review" />
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          <motion.span {...(reduced ? { initial: false } : { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.1, type: 'spring', stiffness: 420, damping: 18 } })} className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-green-800">
            <Check className="h-5 w-5" />
          </motion.span>
          <p className="mt-1.5 text-base font-bold text-text-primary">Migration Ready</p>
          <p className="text-[11px] text-text-secondary">Review your migration details below</p>
        </div>
        <div className="mt-2.5"><Banner flow={flow} badge={<BadgePill free>{FREE_BADGE}</BadgePill>} /></div>
        <div className="mt-2.5 overflow-hidden rounded-xl border border-border bg-white">
          {rows.map(([k, v], i) => (
            <motion.div key={k} {...enter(reduced, 0.15 + i * 0.06)} className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 text-[11px] last:border-b-0">
              <span className="text-text-secondary">{k}</span>
              <span className="min-w-0 break-words text-right font-semibold text-text-primary">{v}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-2.5 rounded-xl border border-border bg-white px-3 py-2.5">
          <p className="text-center text-[11px] text-text-secondary">Your migration will start in <span className="font-bold text-green-800"><Countdown reduced={reduced} /></span>…</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-lighter">
            <motion.div {...(reduced ? { initial: false, style: { width: '40%' } } : { initial: { width: '0%' }, animate: { width: '100%' }, transition: { delay: 0.3, duration: 2.7, ease: 'linear' } })} className="h-full rounded-full bg-green-500" />
          </div>
        </div>
      </div>
    </HubChrome>
  );
};

// ── The migration tool's own shell (the connect and migrate steps are served by the migration tool) ───────────────

const TOOL_STEPS = ['Prepare', 'Pay', 'Connect', 'Migrate'] as const;

const ToolShell: React.FC<{ flow: FlowKey; active: 2 | 3; children: React.ReactNode; overlay?: React.ReactNode }> = ({ flow, active, children, overlay }) => {
  const { src, dst } = JOURNEY_PAIR[flow];
  return (
    <div className="relative flex-1 bg-bg-light">
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2">
        <span className="text-[11px] text-text-primary"><span aria-hidden="true">‹</span> All migration pairs</span>
        <span className="text-sm font-extrabold tracking-tight text-text-primary">MMC<span className="ml-0.5 text-[9px] font-medium text-blue-700">Convert</span></span>
        <span className="rounded-md border border-border px-2.5 py-1 text-[10px] font-medium text-text-primary">Save &amp; exit</span>
      </div>
      <div className="border-b border-border bg-white">
        <ol className="mx-auto flex max-w-md items-start justify-between px-4 pt-2">
          {TOOL_STEPS.map((label, i) => {
            const done = i < active;
            const on = i === active;
            return (
              <li key={label} className="flex w-16 flex-col items-center gap-0.5 pb-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${done ? 'bg-blue-600 text-white' : on ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-bg-lighter text-text-secondary'}`}>
                  {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span className={`text-[9px] font-semibold ${on || done ? 'text-blue-800' : 'text-text-tertiary'}`}>{label}</span>
              </li>
            );
          })}
        </ol>
        <div className="mx-auto h-0.5 max-w-md bg-blue-600" aria-hidden="true" />
      </div>
      <div className="px-4 py-3 sm:px-6">
        <p className="text-[9px] text-text-secondary">MMC Convert / Migration Pairs / {toolName(src)} to {toolName(dst)}</p>
        <div className="mt-1.5 rounded-xl border border-border bg-white px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white"><Logo k={src} className="max-h-4" /></span>
            <span aria-hidden="true" className="text-xs text-text-tertiary">→</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white"><Logo k={dst} className="max-h-4" /></span>
            <div>
              <p className="text-sm font-bold text-text-primary">{toolName(src)} → {toolName(dst)} Migration</p>
              <p className="text-[9px] text-text-secondary">Enterprise accounting data migration · Powered by MMC Convert</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Read-only source', 'SSL encrypted', 'Payment verified', 'Full history included'].map((c) => (
              <span key={c} className="rounded-full border border-border bg-bg-light px-2 py-0.5 text-[9px] text-text-secondary">{c}</span>
            ))}
          </div>
        </div>
        {children}
      </div>
      {overlay}
    </div>
  );
};

// ── 4. Connect: the migration summary, then connecting both accounts ───────────────────────────────────────────────

const ConnectButton: React.FC<{ label: string; connectedAt: number | null; pressAt?: number; reduced: boolean; locked?: boolean }> = ({ label, connectedAt, pressAt, reduced, locked }) => (
  <div className="relative mt-3 h-8 w-full">
    <span className={`absolute inset-0 flex items-center justify-center rounded-lg text-xs font-semibold ${locked ? 'bg-bg-lighter text-text-tertiary' : 'bg-blue-700 text-white'}`}>{label}</span>
    {pressAt !== undefined && !reduced && (
      <motion.span aria-hidden="true" className="absolute inset-0 rounded-lg ring-4 ring-blue-300/60" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: pressAt, duration: 0.3 }} />
    )}
    {connectedAt !== null && (
      <motion.span
        className="absolute inset-0 rounded-lg bg-white"
        {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: connectedAt, duration: 0.18 } })}
      >
        <span className="flex h-full items-center justify-center gap-1 rounded-lg bg-green-light text-xs font-semibold text-green-800">
          <Check className="h-3 w-3" /> Connected
        </span>
      </motion.span>
    )}
  </div>
);

const ConnectPage: React.FC<SceneProps & { live?: boolean }> = ({ flow, reduced, live }) => {
  const { src, dst } = JOURNEY_PAIR[flow];
  const dstOn = live ? 1.1 : null;
  const tile = (k: string, role: string, locked: boolean, label: string, press: number | undefined, done: number | null) => (
    <div className={`flex flex-1 flex-col items-center rounded-xl border border-border px-4 py-4 text-center ${locked ? 'bg-bg-light' : 'bg-white'}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white"><Logo k={k} className="max-h-6" /></span>
      <p className="mt-2 text-sm font-bold text-text-primary">{toolName(k)}</p>
      <p className="text-[10px] text-text-secondary">{role}</p>
      <ConnectButton label={label} connectedAt={done} pressAt={press} reduced={reduced} locked={locked} />
    </div>
  );
  const srcDone = live ? 0.7 : null;
  return (
    <div className="mx-auto mt-3 max-w-xl">
      <p className="text-sm font-bold text-text-primary">Connect Your Accounts</p>
      <p className="text-[10px] text-text-secondary">Link both platforms to enable secure data migration</p>
      <ol className="mt-2 flex items-center rounded-xl border border-border bg-white px-4 py-2.5 text-[9px] text-text-secondary">
        {[`Connect ${toolName(src)}`, `Connect ${toolName(dst)}`, 'Start Migration'].map((l, i) => (
          <React.Fragment key={l}>
            {i > 0 && <li aria-hidden="true" className="mx-2 h-px flex-1 bg-border-medium" />}
            <li className="flex flex-col items-center gap-0.5">
              <span className={`h-3.5 w-3.5 rounded-full border ${live && (i === 0 || i === 1) ? 'border-green-500 bg-green-light' : 'border-border-medium bg-white'}`} />
              {l}
            </li>
          </React.Fragment>
        ))}
      </ol>
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        {tile(src, 'Source accounting platform', false, `Connect ${toolName(src)}`, live ? 0.4 : undefined, srcDone)}
        {tile(dst, 'Destination accounting platform', !live, live ? `Connect ${toolName(dst)}` : `Connect ${toolName(src)} first`, live ? 0.85 : undefined, dstOn)}
      </div>
      <p className="mt-2 text-center text-[9px] text-text-tertiary">Step 2 of 3 — Connect Accounts</p>
    </div>
  );
};

const SummaryModal: React.FC<SceneProps> = ({ flow, reduced }) => {
  const plan = CHOSEN_PLAN[flow];
  const { start, end } = planDates(flow);
  const years = plan.years;
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-text-primary/45 p-3">
      <motion.div
        {...(reduced ? { initial: false } : { initial: { opacity: 0, y: 10, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.22 } })}
        className="w-[min(100%,25rem)] rounded-2xl border border-border bg-white shadow-card-hover"
      >
        <div className="border-b border-border px-4 py-2.5 text-center">
          <p className="text-sm font-bold text-text-primary">Migration Summary</p>
          <p className="text-[10px] text-text-secondary">Please review your migration details before proceeding</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-light px-2 py-0.5 text-[9px] font-semibold text-green-800">
            <Check className="h-2.5 w-2.5" /> Verified — ID: {DEMO.verifiedId}
          </span>
        </div>
        <div className="space-y-2 bg-bg-light p-3">
          <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Contact information</p>
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div><p className="text-[8px] uppercase text-text-tertiary">Full name</p><p className="font-bold text-text-primary">{DEMO.name}</p></div>
              <div><p className="text-[8px] uppercase text-text-tertiary">Email</p><p className="truncate font-bold text-text-primary">{DEMO.email}</p></div>
              <div><p className="text-[8px] uppercase text-text-tertiary">Phone</p><p className="font-bold text-text-primary">{DEMO.dial}{DEMO.phone.replace(/\s/g, '')}</p></div>
            </div>
          </div>
          <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Company details</p>
            <p className="mt-1 text-[8px] uppercase text-text-tertiary">Entity / company name</p>
            <p className="text-[10px] font-bold text-text-primary">{DEMO.entity}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-light px-3 py-2 text-center">
            <p className="text-left text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Migration period</p>
            <div className="mt-1 flex items-center justify-around text-[10px]">
              <div><p className="text-[8px] uppercase text-text-tertiary">Start date</p><p className="font-bold text-text-primary">{start}</p></div>
              <span aria-hidden="true" className="text-blue-700">→</span>
              <div><p className="text-[8px] uppercase text-text-tertiary">End date</p><p className="font-bold text-text-primary">{end}</p></div>
            </div>
            <p className="mt-1 text-[9px] text-blue-800">{years} financial years of data will be migrated</p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border px-3 py-2.5">
          <span className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border text-[11px] text-text-primary">Cancel</span>
          <span className="relative flex h-8 flex-[1.4] items-center justify-center rounded-lg bg-blue-700 text-[11px] font-semibold text-white">
            <motion.span aria-hidden="true" className="absolute inset-0 rounded-lg ring-4 ring-blue-300/60" {...appear(reduced, 1.4)} />
            Next — Connect Your Accounts →
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export const ConnectScene: React.FC<SceneProps> = (p) => (
  <Screens fill at={[0, 2000]} reduced={p.reduced} still={1}>
    {[
      <ToolShell key="summary" flow={p.flow} active={2} overlay={<SummaryModal {...p} />}>
        <ConnectPage {...p} />
      </ToolShell>,
      <ToolShell key="connect" flow={p.flow} active={2}>
        <ConnectPage {...p} live />
      </ToolShell>,
    ]}
  </Screens>
);

// ── 5. Migrate and verify: the Migration Tracker page ──────────────────────────────────────────────────────────────

const TRACKER_ROWS: ReadonlyArray<readonly [string, number]> = [
  ['Account', 102],
  ['Vendor', 3],
  ['Item', 2],
  ['Bill', 3],
  ['Purchase', 19],
  ['JournalEntry', 23],
  ['BillPayment', 3],
  ['Attachment', 3],
];

const TRACKER_BLUE = 'bg-[#2563a8]';

/** Counts up to `to` over `ms` (instantly with reduced motion). */
const CountUp: React.FC<{ to: number; ms: number; delay: number; reduced: boolean }> = ({ to, ms, delay, reduced }) => {
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) {
      setN(to);
      return;
    }
    setN(0);
    let iv: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      const start = Date.now();
      iv = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / ms);
        setN(Math.round(p * to));
        if (p >= 1 && iv) clearInterval(iv);
      }, 40);
    }, delay);
    return () => {
      clearTimeout(t);
      if (iv) clearInterval(iv);
    };
  }, [to, ms, delay, reduced]);
  return <>{n}</>;
};

const dashed = (d: string) => d.replace(/ /g, ' - ');

export const MigrateScene: React.FC<SceneProps> = ({ flow, reduced }) => {
  const { src, dst } = JOURNEY_PAIR[flow];
  const { start, end } = planDates(flow);
  const cols = 'grid grid-cols-[3.4rem_1fr_1.5fr_1.2fr_1.5fr_1.6fr_2.5rem] items-center gap-2';
  const rowStart = 0.25;
  const rowGap = 0.17;
  const barMs = 0.45;
  const doneAt = rowStart + rowGap * (TRACKER_ROWS.length - 1) + barMs;
  return (
    <div className="flex-1 bg-[#f8fafc] px-4 py-3">
      <p className="text-lg font-extrabold tracking-tight text-text-primary">Your Migration Tracker</p>
      <div className="mt-2 rounded-xl border border-border bg-white p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className={`rounded-lg ${TRACKER_BLUE} px-3 py-2 text-white`}><p className="text-[10px] font-bold">Company Name</p><p className="text-[11px]">{DEMO.entity}</p></div>
          <div className="rounded-lg bg-[#eef0f4] px-3 py-2"><p className="text-[10px] font-bold text-text-primary">Migration Path</p><p className="text-[11px] text-text-primary">{platformName(src)} → {platformName(dst)}</p></div>
          <div className="rounded-lg bg-[#eef0f4] px-3 py-2"><p className="text-[10px] font-bold text-text-primary">Start Date</p><p className="text-[11px] text-text-primary">{dashed(start)}</p></div>
          <div className="rounded-lg bg-[#eef0f4] px-3 py-2"><p className="text-[10px] font-bold text-text-primary">End Date</p><p className="text-[11px] text-text-primary">{dashed(end)}</p></div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-4 rounded-xl border border-border px-3.5 py-2.5">
          <motion.div {...appear(reduced, doneAt + 0.1)} className="min-w-0">
            <p className="text-sm font-extrabold text-[#2563a8]">Your data migration is complete</p>
            <p className="text-[10px] text-text-secondary">All of your data has been securely migrated to {platformName(dst)}. You don’t need to do anything else.</p>
            <div className="mt-2 flex gap-2">
              <span className={`rounded-md ${TRACKER_BLUE} px-3 py-1.5 text-[10px] font-semibold text-white`}>Get Comparative Report</span>
              <span className="rounded-md border border-border px-3 py-1.5 text-[10px] font-semibold text-text-primary">Request Help</span>
            </div>
          </motion.div>
          <div className={`w-44 flex-shrink-0 rounded-xl ${TRACKER_BLUE} px-3 py-2.5 text-white`}>
            <p className="text-[11px] font-bold">Overall Progress</p>
            <p className="text-[11px]"><CountUp to={100} ms={Math.round(doneAt * 1000 - 250)} delay={250} reduced={reduced} />%</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/30">
              <motion.div {...(reduced ? { initial: false, style: { width: '100%' } } : { initial: { width: '0%' }, animate: { width: '100%' }, transition: { delay: 0.25, duration: doneAt - 0.25, ease: 'linear' } })} className="h-full rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 overflow-hidden rounded-xl border border-border">
          <p className="px-3.5 py-2 text-xs font-bold text-text-primary">Migration Details</p>
          <div className={`${cols} bg-[#f8fafc] px-3.5 py-1.5 text-[9px] font-medium text-text-secondary`}>
            <span>Sequence</span><span>Type</span><span>Extracted from {platformName(src)}</span><span>Pushed to {platformName(dst)}</span><span>Detail</span><span>Progress</span><span>Review</span>
          </div>
          {TRACKER_ROWS.map(([type, count], i) => {
            const at = rowStart + rowGap * i;
            return (
              <motion.div key={type} {...enter(reduced, at - 0.1)} className={`${cols} border-t border-border px-3.5 py-1.5 text-[10px]`}>
                <span className="text-text-tertiary">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-medium text-text-primary">{type}</span>
                <span className="text-text-primary">{count}</span>
                <span className="text-text-primary">{count}</span>
                <motion.span {...appear(reduced, at + barMs)} className="block">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-light px-2 py-0.5 text-[9px] font-semibold text-[#16a34a]"><Check className="h-2 w-2" /> Completed</span>
                  <span className="block text-[8px] text-text-tertiary">Completed {count}/{count}</span>
                </motion.span>
                <span>
                  <motion.span {...appear(reduced, at + barMs)} className="flex justify-between text-[8px]"><span className="text-text-primary">Complete</span><span className="font-semibold text-[#16a34a]">100%</span></motion.span>
                  <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-bg-lighter">
                    <motion.span {...(reduced ? { initial: false, style: { width: '100%' } } : { initial: { width: '0%' }, animate: { width: '100%' }, transition: { delay: at, duration: barMs, ease: 'easeOut' } })} className="block h-full rounded-full bg-gradient-to-r from-[#4f5de8] to-[#0891b2]" />
                  </span>
                </span>
                <span className="text-text-tertiary">-</span>
              </motion.div>
            );
          })}
        </div>
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
