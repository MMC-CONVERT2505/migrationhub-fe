/**
 * The two journeys the home-page walkthrough shows, mirroring the real platform:
 *  - paid: Prepare -> Pay -> Connect -> Migrate          (the checkout stepper has four stages)
 *  - free: Prepare -> Connect -> Migrate                 (a free migration has no payment stage)
 * Each is preceded by choosing a pair on the home page. Kept free of React so it can be tested on its own.
 */
export type FlowKey = 'paid' | 'free';
export type SceneKey = 'choose' | 'prepare' | 'pay' | 'review' | 'connect' | 'migrate';

export interface FlowStep {
  scene: SceneKey;
  title: string;
  body: string;
  /** 24x24 stroke path for the tab icon. */
  icon: string;
}

const ICON = {
  choose: 'M4 6h16M4 12h16M4 18h10',
  prepare: 'M9 5h6M9 3h6a2 2 0 012 2v0h2a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h2v0a2 2 0 012-2zM8 12h8M8 16h5',
  pay: 'M3 7h18v11H3zM3 11h18',
  review: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5 4.5-5',
  connect: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
  migrate: 'M9 12l2 2 4-4M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
};

const choose: FlowStep = {
  scene: 'choose',
  title: 'Choose your migration',
  body: 'Pick the platform you are moving from and the one you are moving to. Each migration is marked Free, Paid, or free in selected countries.',
  icon: ICON.choose,
};
const connect: FlowStep = {
  scene: 'connect',
  title: 'Connect both accounts',
  body: 'Sign in with each platform to authorise access to your source and destination accounts.',
  icon: ICON.connect,
};
const migrate: FlowStep = {
  scene: 'migrate',
  title: 'Migrate and verify',
  body: 'Follow the progress live. When it finishes, our built-in accuracy check compares every record and balance with your source.',
  icon: ICON.migrate,
};

export const FLOWS: Record<FlowKey, { label: string; pair: readonly [string, string]; steps: readonly FlowStep[] }> = {
  paid: {
    label: 'Paid migration',
    pair: ['QuickBooks Online', 'Xero'],
    steps: [
      choose,
      {
        scene: 'prepare',
        title: 'Prepare your order',
        body: 'Choose your country to see plans and prices in your currency, then tell us about the entity you are migrating.',
        icon: ICON.prepare,
      },
      {
        scene: 'pay',
        title: 'Pay securely',
        body: 'Review your order and pay securely through Razorpay. The price is shown before you pay.',
        icon: ICON.pay,
      },
      connect,
      migrate,
    ],
  },
  free: {
    label: 'Free migration',
    pair: ['MYOB', 'QuickBooks Online'],
    steps: [
      choose,
      {
        scene: 'prepare',
        title: 'Prepare your migration',
        body: 'Choose your country and plan, then tell us about the entity you are migrating. There is nothing to pay.',
        icon: ICON.prepare,
      },
      {
        scene: 'review',
        title: 'Review and start',
        body: 'Check your details. A free migration needs no payment, so it starts on its own.',
        icon: ICON.review,
      },
      connect,
      migrate,
    ],
  },
};

export const FLOW_ORDER: readonly FlowKey[] = ['paid', 'free'];
export const otherFlow = (f: FlowKey): FlowKey => (f === 'paid' ? 'free' : 'paid');

/** The checkout stepper as the platform shows it (a free migration has no "Pay"). */
export const STEPPER_LABELS: Record<FlowKey, readonly string[]> = {
  paid: ['Prepare', 'Pay', 'Connect', 'Migrate'],
  free: ['Prepare', 'Connect', 'Migrate'],
};

/** Which stepper stage a scene sits at; null on the home page, which has no stepper. `current` is 0-based. */
export function stepperFor(flow: FlowKey, scene: SceneKey): { labels: readonly string[]; current: number } | null {
  const labels = STEPPER_LABELS[flow];
  const at: Partial<Record<SceneKey, number>> =
    flow === 'paid' ? { prepare: 0, pay: 1, connect: 2, migrate: 3 } : { prepare: 0, review: 1, connect: 1, migrate: 2 };
  const current = at[scene];
  return current === undefined ? null : { labels, current };
}

/** The step to show after `index`, and whether the loop wrapped past the end of this flow. */
export function nextStep(flow: FlowKey, index: number): { flow: FlowKey; index: number; wrapped: boolean } {
  const last = FLOWS[flow].steps.length - 1;
  return index < last ? { flow, index: index + 1, wrapped: false } : { flow, index: 0, wrapped: true };
}
