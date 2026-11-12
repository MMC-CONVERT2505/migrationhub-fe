import { describe, expect, it } from 'vitest';
import { FLOWS, FLOW_ORDER, STEPPER_LABELS, nextStep, otherFlow, stepperFor, type SceneKey } from '../flows';

const scenes = (f: 'paid' | 'free') => FLOWS[f].steps.map((s) => s.scene);

describe('walkthrough flows mirror the real platform', () => {
  it('offers exactly a paid and a free journey', () => {
    expect([...FLOW_ORDER]).toEqual(['paid', 'free']);
    expect(otherFlow('paid')).toBe('free');
    expect(otherFlow('free')).toBe('paid');
  });

  it('a paid migration goes choose -> prepare -> PAY -> connect -> migrate', () => {
    expect(scenes('paid')).toEqual(['choose', 'prepare', 'pay', 'connect', 'migrate']);
  });

  it('a free migration has no payment step: choose -> prepare -> review/start -> connect -> migrate', () => {
    expect(scenes('free')).toEqual(['choose', 'prepare', 'review', 'connect', 'migrate']);
    expect(scenes('free')).not.toContain('pay');
  });

  it('both journeys start with choosing a pair and end by migrating and verifying', () => {
    for (const f of FLOW_ORDER) {
      expect(FLOWS[f].steps[0].title).toBe('Choose your migration');
      expect(FLOWS[f].steps.at(-1)?.title).toBe('Migrate and verify');
    }
  });

  it('shows a paid pair as paid and a free pair as free', () => {
    expect(FLOWS.paid.pair).toEqual(['QuickBooks Online', 'Xero']);
    expect(FLOWS.free.pair).toEqual(['MYOB', 'QuickBooks Online']);
  });

  it('every step has a title, real caption text and an icon, and titles are unique within a journey', () => {
    for (const f of FLOW_ORDER) {
      const titles = FLOWS[f].steps.map((s) => s.title);
      expect(new Set(titles).size).toBe(titles.length);
      for (const s of FLOWS[f].steps) {
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.body.endsWith('.')).toBe(true);
        expect(s.icon.length).toBeGreaterThan(5);
      }
    }
  });

  it('says only what is true about payment', () => {
    const pay = FLOWS.paid.steps.find((s) => s.scene === 'pay')!;
    expect(pay.body).toContain('Razorpay');
    expect(pay.body).toContain('price is shown before you pay');
    expect(FLOWS.free.steps.find((s) => s.scene === 'prepare')!.body).toContain('nothing to pay');
    expect(FLOWS.free.steps.find((s) => s.scene === 'review')!.body).toContain('no payment');
  });

  it('keeps the accuracy-check wording the business asked for on the last step', () => {
    expect(FLOWS.paid.steps.at(-1)!.body).toContain('built-in accuracy check compares every record and balance with your source');
  });

  it('explains that some migrations are free only in certain countries', () => {
    expect(FLOWS.paid.steps[0].body).toContain('free in selected countries');
  });
});

describe('the checkout stepper', () => {
  it('has four stages when paying and three when free (no "Pay")', () => {
    expect(STEPPER_LABELS.paid).toEqual(['Prepare', 'Pay', 'Connect', 'Migrate']);
    expect(STEPPER_LABELS.free).toEqual(['Prepare', 'Connect', 'Migrate']);
  });

  it('has none on the home page (choosing a pair)', () => {
    expect(stepperFor('paid', 'choose')).toBeNull();
    expect(stepperFor('free', 'choose')).toBeNull();
  });

  it('points at the right stage for every scene of each journey', () => {
    const at = (f: 'paid' | 'free', s: SceneKey) => stepperFor(f, s)?.current;
    expect(['prepare', 'pay', 'connect', 'migrate'].map((s) => at('paid', s as SceneKey))).toEqual([0, 1, 2, 3]);
    expect(['prepare', 'review', 'connect', 'migrate'].map((s) => at('free', s as SceneKey))).toEqual([0, 1, 1, 2]);
  });

  it('never points past the last stage, and every scene of a journey has a stage', () => {
    for (const f of FLOW_ORDER) {
      for (const s of FLOWS[f].steps) {
        if (s.scene === 'choose') continue;
        const st = stepperFor(f, s.scene);
        expect(st).not.toBeNull();
        expect(st!.current).toBeGreaterThanOrEqual(0);
        expect(st!.current).toBeLessThan(st!.labels.length);
      }
    }
  });

  it('a scene belonging to the other journey has no stage (no "Pay" stage on a free migration)', () => {
    expect(stepperFor('free', 'pay')).toBeNull();
    expect(stepperFor('paid', 'review')).toBeNull();
  });
});

describe('looping', () => {
  it('advances one step at a time and wraps to the start of the same journey', () => {
    expect(nextStep('paid', 0)).toEqual({ flow: 'paid', index: 1, wrapped: false });
    expect(nextStep('paid', 3)).toEqual({ flow: 'paid', index: 4, wrapped: false });
    expect(nextStep('paid', 4)).toEqual({ flow: 'paid', index: 0, wrapped: true });
    expect(nextStep('free', 4)).toEqual({ flow: 'free', index: 0, wrapped: true });
  });

  it('visits every step of both journeys exactly once per lap', () => {
    for (const f of FLOW_ORDER) {
      const seen: number[] = [0];
      let cur = nextStep(f, 0);
      while (!cur.wrapped) { seen.push(cur.index); cur = nextStep(f, cur.index); }
      expect(seen).toEqual(FLOWS[f].steps.map((_, i) => i));
    }
  });
});
