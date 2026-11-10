/** Real destinations for links that used to be "#" placeholders. These live on the main MMC Convert site. */
export const EXTERNAL_LINKS = {
  terms: 'https://www.mmcconvert.com/termsofuse',
  trustpilot: 'https://www.trustpilot.com/review/mmcconvert.com',
} as const;

/** The one public contact address; the footer, Contact page and legal pages all use it. TODO(owner): confirm it, and whether info@ is also meant to be public. */
export const CONTACT_EMAIL = 'migrations@mmcconvert.com';
export const CONTACT_PHONE = '+919926477000';
