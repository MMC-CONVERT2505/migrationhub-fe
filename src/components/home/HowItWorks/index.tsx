import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FLOWS, FLOW_ORDER, nextStep, otherFlow, type FlowKey } from './flows';
import { SCENES } from './scenes';
import { WALK_PAIRS, walkPairsFrom, type WalkPair } from './walkthroughData';
import { getAvailablePairs } from '@/api/availablePairs';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import type { MigrationPairEntity } from '@/types/api';

/**
 * Home-page "How it Works?": a looping, animated walkthrough of what happens after a customer picks a migration,
 * built from the real platform screens, in the two journeys the platform has: a paid migration (Prepare, Pay,
 * Connect, Migrate) and a free one (Prepare, Connect, Migrate).
 *
 * Left alone it plays one journey, then the other. As soon as the visitor picks a journey or a step it stays on that
 * journey and loops it. Accessible by design: a real tablist (arrow keys), the step text is real text (the picture
 * itself is decorative), the loop pauses on mouse hover or keyboard focus, off-screen and in a background tab, has a
 * Pause button, and does not move at all for people who prefer reduced motion. Server-rendered as step 1 of the
 * paid journey, so the prerendered page reads without script.
 */
export const HowItWorks: React.FC = () => {
  const reduced = !!useReducedMotion();
  const [flow, setFlow] = useState<FlowKey>('paid');
  const [active, setActive] = useState(0);
  const [locked, setLocked] = useState(false); // the visitor chose a journey or step: stop alternating between journeys
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  // A mouse is over the walkthrough, or keyboard focus is inside it. Touch taps and the focus a mouse click leaves on a
  // button never count: they have no "leave" moment, so they would stop the loop for good.
  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const engaged = hovered || keyboardFocus;
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  const steps = FLOWS[flow].steps;

  // The first scene shows the home page's own pairs, logos and labels: the same shared (cached) listing the pairs
  // section loads. Until it arrives, or if it cannot be reached, the built-in copy of those pairs is shown.
  const [pairs, setPairs] = useState<readonly WalkPair[]>(WALK_PAIRS);
  useEffect(() => {
    let live = true;
    getAvailablePairs()
      .then((res) => {
        const list = walkPairsFrom(extractList<MigrationPairEntity>(res).map(apiPairToUiPair));
        if (live && list.length) setPairs(list);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const step = steps[active];
  const running = playing && inView && tabVisible && !engaged && !reduced;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      const n = nextStep(flow, active);
      if (n.wrapped && !locked) {
        setFlow(otherFlow(flow));
        setActive(0);
      } else {
        setActive(n.index);
      }
    }, step.ms);
    return () => clearTimeout(t);
  }, [running, flow, active, locked, step.ms]);

  const choose = (i: number, focus = false) => {
    setActive(i);
    setLocked(true);
    if (focus) tabs.current[i]?.focus();
  };
  const chooseFlow = (f: FlowKey) => {
    setFlow(f);
    setActive(0);
    setLocked(true);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = steps.length - 1;
    const next = { ArrowRight: (active + 1) % steps.length, ArrowLeft: (active + last) % steps.length, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    choose(next, true);
  };

  const Scene = SCENES[step.scene];

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-border" aria-labelledby="how-it-works-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Simple by design</p>
          <h2 id="how-it-works-title" className="mt-2 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">How it Works?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
            See what happens from the moment you choose a migration to the moment it is verified. Free and paid migrations differ only in the payment step.
          </p>
        </div>

        <div
          ref={root}
          className="mx-auto mt-10 max-w-5xl"
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
          onFocusCapture={(e) => setKeyboardFocus(e.target.matches(':focus-visible'))}
          onBlurCapture={() => setKeyboardFocus(false)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Migration type" className="inline-flex rounded-full border border-border bg-white p-1">
              {FLOW_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => chooseFlow(k)}
                  aria-pressed={flow === k}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${flow === k ? 'bg-blue-700 text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {FLOWS[k].label}
                </button>
              ))}
            </div>
            {!reduced && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex-shrink-0 rounded-full border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-medium hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {playing ? 'Pause animation' : 'Play animation'}
              </button>
            )}
          </div>

          <div role="tablist" aria-label={`${FLOWS[flow].label}: how it works`} onKeyDown={onKeyDown} className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.title}
                  ref={(el) => { tabs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`hiw-tab-${i}`}
                  aria-selected={on}
                  aria-controls="hiw-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(i)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-colors max-md:last:col-span-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${on ? 'border-blue-600 bg-blue-light text-blue-800' : 'border-border bg-white text-text-secondary hover:bg-bg-light'}`}
                >
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${on ? 'bg-blue-700 text-white' : 'bg-bg-lighter text-text-secondary'}`} aria-hidden="true">{i + 1}</span>
                  <svg aria-hidden="true" className="hidden h-4 w-4 flex-shrink-0 xl:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  <span className="leading-snug">{s.title}</span>
                </button>
              );
            })}
          </div>

          <div id="hiw-panel" role="tabpanel" aria-labelledby={`hiw-tab-${active}`} className="mt-4 overflow-hidden rounded-2xl border border-border bg-white shadow-card">
            {/* Decorative: the caption below carries the meaning. */}
            <div aria-hidden="true" data-hiw-window>
              {/* A fixed floor, so the page does not lurch as the steps change. */}
              <div className="flex min-h-[690px] flex-col bg-bg-light" key={`${flow}-${active}`}>
                <Scene flow={flow} reduced={reduced} pairs={pairs} />
              </div>
            </div>
            <div className="flex flex-col gap-1 border-t border-border bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="text-sm text-text-secondary"><span className="font-semibold text-text-primary">{step.title}. </span>{step.body}</p>
              <a href="#pairs" className="flex-shrink-0 rounded-sm text-sm font-semibold text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Pick your migration path →
              </a>
            </div>
            <div className="h-1 bg-bg-lighter" aria-hidden="true">
              {running && <motion.div key={`${flow}-${active}`} className="h-full bg-blue-700" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: step.ms / 1000, ease: 'linear' }} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
