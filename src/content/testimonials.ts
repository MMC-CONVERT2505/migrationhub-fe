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

// Copied word for word from the 5-star reviews on https://www.trustpilot.com/review/mmcconvert.com (Oct 2026).
// `path` carries the review's own title (there is no migration pair to show) and `timeAgo` its date.
// `verified` stays false until the owner confirms the "Verified" label is accurate for Trustpilot.
export const TESTIMONIALS: Testimonial[] = [
  {
    initial: 'C',
    name: 'Cameron Day-Lewis',
    path: 'MMC made the whole process so easy',
    timeAgo: 'Oct 24, 2026',
    text: 'MMC made the whole process so easy, from the first chat to final migration.',
    supportedPair: true,
    verified: false,
  },
  {
    initial: 'G',
    name: 'George Kairinos',
    path: 'MMC Convert were fantastic!!!',
    timeAgo: 'Oct 23, 2026',
    text: 'Great, speedy and constant communication throughout the migration process',
    supportedPair: true,
    verified: false,
  },
  {
    initial: 'D',
    name: 'Donna King',
    path: 'MMC Convert always deliver on time',
    timeAgo: 'Oct 14, 2026',
    text: 'MMC Convert always deliver on time, they let me know each day where they were up to in the migration',
    supportedPair: true,
    verified: false,
  },
];

export const visibleTestimonials = (all: Testimonial[] = TESTIMONIALS): Testimonial[] => all.filter((t) => t.supportedPair);
