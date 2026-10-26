export interface Testimonial {
  initial: string;
  name: string;
  path: string;
  timeAgo: string;
  text: string;
  /** Shown only when true: the pair is one the catalogue offers. */
  supportedPair: boolean;
  /** The "Verified" label is shown only when true. TODO(owner): confirm each review is real before setting it. */
  verified: boolean;
}

// TODO(owner): confirm every review below is genuine and the Verified label is accurate.
export const TESTIMONIALS: Testimonial[] = [
  {
    initial: 'S',
    name: 'Sarah M.',
    path: 'QuickBooks Desktop → QuickBooks Online',
    timeAgo: '2 weeks ago',
    text: 'Daily updates kept us informed at every step. The transition was smooth, stress-free, and every query got a fast, personal response.',
    supportedPair: false, // not an offered pair; TODO(owner)
    verified: false,
  },
  {
    initial: 'D',
    name: 'David T.',
    path: 'Sage → QuickBooks Online',
    timeAgo: '1 month ago',
    text: 'Handled our migration with real professionalism. Completed efficiently with no complications — we’d gladly use them again.',
    supportedPair: false, // not an offered pair; TODO(owner)
    verified: false,
  },
  {
    initial: 'B',
    name: 'Bill R.',
    path: 'Reckon Accounts → Reckon One',
    timeAgo: '3 weeks ago',
    text: 'Years of workbooks migrated accurately and quickly. Communication and progress reporting throughout were excellent.',
    supportedPair: false, // not an offered pair; TODO(owner)
    verified: false,
  },
];

export const visibleTestimonials = (all: Testimonial[] = TESTIMONIALS): Testimonial[] => all.filter((t) => t.supportedPair);
