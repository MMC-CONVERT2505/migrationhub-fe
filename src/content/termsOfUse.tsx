import React from 'react';
import type { Block, PolicySection } from './privacyPolicy';

/** Migration Hub Terms of Use, as data: the page renders the sections, the table of contents and deep links from this. */

export const TERMS_EMAIL = 'migrations@mmcconvert.com';
export const TERMS_DATES = 'Effective date: 1st Jan 2026 · Last updated: 22nd October 2026';

const Mail: React.FC = () => (
  <a href={`mailto:${TERMS_EMAIL}`} className="text-blue-600 hover:underline break-all">{TERMS_EMAIL}</a>
);
const PrivacyLink: React.FC = () => <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>;

/** One numbered clause; `lead` is its bold run-in heading ("Care and skill."). */
const c = (num: string, content: React.ReactNode, lead?: string): Block => ({ type: 'p', num, content, lead });
const bullets = (...items: React.ReactNode[]): Block => ({ type: 'list', items });

export const TERMS_SECTIONS: PolicySection[] = [
  {
    id: 'about',
    title: '1. About these Terms',
    blocks: [
      c('1.1', 'These Terms of Service ("Terms") govern your use of Migration Hub at migrationhub.mmcconvert.com and every migration you order through it (the "Service").'),
      c('1.2', 'Migration Hub is provided by M/s MMC Convert, GSTIN [23BCAPM8108A1Z9], 163, RNT Marg, Indore, Madhya Pradesh, 452001, India ("MMC Convert", "we", "us", "our"). "You" means the person or business that creates an account or orders a migration.'),
      c('1.3', 'You accept these Terms when you tick the acceptance box at sign up or place an order. If you accept on behalf of a business, you confirm you are authorised to bind it.'),
      c('1.4', <>These Terms, the plan details shown at checkout, our <PrivacyLink /> and our Refund &amp; Cancellation Policy form the whole agreement between us. If they conflict, these Terms apply, except that the Privacy Policy governs how we handle personal data.</>),
    ],
  },
  {
    id: 'accounts',
    title: '2. Accounts and eligibility',
    blocks: [
      c('2.1', 'Migration Hub is for business use. You must be at least 18 and able to enter a binding contract.'),
      c('2.2', 'You must give accurate details at sign up, verify your email by one time passcode (OTP), and keep your details up to date.'),
      c('2.3', <>You are responsible for keeping your password secret and for all activity under your account. Tell us immediately at <Mail /> if you suspect unauthorised use.</>),
      c('2.4', 'One account may be used by one person. Accountants and bookkeepers may run migrations for their clients from their own account, provided they have each client\'s authority.'),
    ],
  },
  {
    id: 'service',
    title: '3. The Service',
    blocks: [
      c('3.1', 'We transfer accounting data from a source platform to a destination platform for the migration pair and plan you select (for example MYOB to QuickBooks Online). The data categories, history period, number of revisions and support level for each plan are shown at checkout.', 'What we do.'),
      c('3.2', 'We perform the Service with reasonable care and skill, using software and trained migration specialists who review data mappings.', 'Care and skill.'),
      c('3.3', 'Most migrations complete within [the time shown for your pair]. Times are estimates. They depend on data volume, platform limits and how quickly you respond, and we are not liable for delays outside our reasonable control.', 'Timing.'),
      c('3.4', 'After completion you have a support window of 7 days, or the post migration support period of your plan if longer, to review the result and request revisions. Requests after the window may be charged.', 'Support window.'),
      c('3.5', 'A revision is a correction of data we migrated incorrectly against your source. It does not include new data, a different date range, or changes made in either platform after migration.', 'Revisions.'),
      c('3.6', 'Unless your plan says otherwise, the Service does not include: data the destination platform cannot accept; custom reports, templates and user settings; reconciling or correcting errors already in your source data; bookkeeping, tax or accounting advice; and integrations with other apps. Our What we convert list shows supported data by pair.', 'Out of scope.'),
      c('3.7', 'We may offer some pairs free of charge. We may change, limit or withdraw free offers at any time, but not for a migration already started.', 'Free migrations.'),
    ],
  },
  {
    id: 'your-responsibilities',
    title: '4. Your responsibilities',
    blocks: [
      c('4.1', 'You must hold active, paid (not trial or expired) subscriptions for both the source and destination platforms, and valid licences for any software involved, for the whole migration and support window.', 'Subscriptions and licences.'),
      c('4.2', 'You confirm you own the accounting data or are authorised by its owner to have it migrated, and that the data includes no information you are not allowed to share with us.', 'Authority.'),
      c('4.3', 'You will authorise our connection to each platform (or upload the required files) and keep that access in place until the migration is complete. You can revoke access at any time, but we cannot complete the migration without it.', 'Access.'),
      c('4.4', 'Before we start, take your own backup of the source data. We back up data we read before migration, but you remain responsible for your own records.', 'Backups.'),
      c('4.5', 'Unless we agree otherwise, use a new or empty destination file. Data already in the destination may be overwritten or duplicated, and we are not responsible for it.', 'Destination file.'),
      c('4.6', 'You must review the migrated data and the reconciliation report within the support window and tell us of any issues. If you do not report issues within that window, the migration is treated as accepted.', 'Review and sign off.'),
      c('4.7', 'You will give us accurate information (entity name, financial year end, country, add ons) and respond to our questions promptly.', 'Information.'),
    ],
  },
  {
    id: 'fees',
    title: '5. Fees and payment',
    blocks: [
      c('5.1', 'The price is the one shown at checkout for your pair, plan and country, in the currency shown. Add ons (if any) are quoted separately and added to your order before payment.', 'Prices.'),
      c('5.2', '[Prices exclude GST and other taxes, which are added at checkout where applicable.] If you are outside India, you are responsible for any local taxes or duties in your country.', 'Taxes.'),
      c('5.3', 'Payment is due in full before the migration starts. We take payment through our payment provider, Razorpay, by the methods shown at checkout. We do not receive or store your full card or bank details. Payment counts as made when cleared funds reach us.', 'Payment.'),
      c('5.4', 'You confirm that you are authorised to use the payment method and that the details you give are correct. Any charges your card issuer or bank applies (such as currency conversion fees) are yours.', 'Your payment details.'),
      c('5.5', <>You can request a copy of tax invoice for every paid order by emailing us the order details on <Mail />.</>, 'Invoices.'),
      c('5.6', 'If a platform vendor or partner pays for your migration, clauses 5.1 to 5.4 do not apply to you.', 'Paid by a platform vendor.'),
      c('5.7', 'Cancellations and refunds are governed by our Refund & Cancellation Policy. In summary, you cannot cancel for a full or partial refund, once you have submitted the order form. You can claim a full refund if we are not able to complete your migration. The approved refunds are processed within 5 to 7 working days to the original payment method.', 'Cancellation and refunds.'),
    ],
  },
  {
    id: 'your-data',
    title: '6. Your data, privacy and confidentiality',
    blocks: [
      c('6.1', 'Your accounting data stays yours. You give us a limited, non exclusive licence to access, copy, store and transform it only as needed to perform, check and support your migration. We will not sell it, use it for advertising, or use it to train artificial intelligence models.', 'You own your data.'),
      c('6.2', <>We handle personal data as described in our <PrivacyLink />. Where your accounting records contain personal data about others (such as your customers or employees), we process it only on your instructions to deliver the Service.</>, 'Personal data.'),
      c('6.3', 'We delete migrated accounting data and uploaded files from our live systems at the end of the support window, and revoke our platform connections. Raise any questions about the migration within that window.', 'Deletion.'),
      c('6.4', 'Each of us will keep the other\'s confidential information secret and use it only for this agreement. We may share yours with our staff and service providers who need it for the Service and are bound by confidentiality. Either of us may disclose information that is already public or that a law, court or regulator requires.', 'Confidentiality.'),
      c('6.5', 'We will send you emails needed to deliver the Service, such as OTPs, receipts and migration updates. We send marketing only if you agree, and you can unsubscribe at any time.', 'Service emails.'),
    ],
  },
  {
    id: 'ip-and-use',
    title: '7. Intellectual property and acceptable use',
    blocks: [
      c('7.1', 'Migration Hub, its software, mapping logic, templates, reports and branding belong to MMC Convert, as does any improvement we develop while providing the Service. We give you a non transferable right to use Migration Hub and the reports we deliver for your own business during and after your migration.', 'Our IP.'),
      c('7.2', 'Nothing in these Terms transfers ownership of your data or your pre existing intellectual property to us.', 'Your IP.'),
      c('7.3', 'You must not:', 'Acceptable use.'),
      bullets(
        'use the Service for unlawful purposes, or to migrate data you have no right to use;',
        'try to access other customers\' data, our admin areas or systems you are not authorised to use;',
        'probe, scan or test our security without our written permission, or disrupt the Service;',
        'copy, reverse engineer or resell the Service, or use it to build a competing product;',
        'use bots or automated scripts against the site, other than our published integrations.',
      ),
      c('7.4', 'Accounting platforms are run by their own providers under their own terms. We are not responsible for their availability, API limits, changes or errors, although we will work with you to resolve issues they cause.', 'Third party platforms.'),
    ],
  },
  {
    id: 'liability',
    title: '8. Warranties, liability and indemnity',
    blocks: [
      c('8.1', 'We will perform the Service with reasonable care and skill and correct migration errors we caused, within the revisions in your plan, at no extra cost.', 'What we promise.'),
      c('8.2', 'Except as stated in these Terms, the Service is provided "as is". We do not guarantee that the migrated data will be error free where the source data is incomplete, inaccurate or corrupted, or where the destination platform cannot hold it. Migration Hub is not accounting, tax or legal advice; you should check migrated balances with your accountant.', 'What we do not promise.'),
      c('8.3', 'We are not liable for:', 'Exclusions.'),
      bullets(
        'errors caused by the quality of your source data or by information you gave us;',
        'outages, changes or errors in third party platforms;',
        'indirect or consequential loss, or loss of profit, revenue, business, goodwill or anticipated savings;',
        'loss of data you could have recovered from your own backup.',
      ),
      c('8.4', 'Our total liability for each migration, whether in contract, negligence or otherwise, is limited to the fees you paid for that migration.', 'Liability cap.'),
      c('8.5', 'Nothing in these Terms limits liability for fraud, death or personal injury caused by negligence, or anything else that cannot be limited by law. If you are a consumer, for example under the Australian Consumer Law or the UK Consumer Rights Act 2015, you keep any rights those laws give you that cannot be excluded.', 'Rights you cannot lose.'),
      c('8.6', 'You will compensate us for third party claims, losses and reasonable legal costs arising from data you had no right to give us, or from your breach of clauses 4.2 or 7.3.', 'Your indemnity.'),
    ],
  },
  {
    id: 'termination-general',
    title: '9. Suspension, termination and general terms',
    blocks: [
      c('9.1', 'We may suspend your account or a migration if you breach clause 7.3, if a payment is reversed or disputed, or if we reasonably suspect fraud or a security risk. We will tell you why and restore access once the issue is fixed.', 'Suspension.'),
      c('9.2', <>You can close your account at any time by emailing <Mail />. Either of us may end an order immediately by written notice if the other materially breaches these Terms and does not fix the breach within 15 days, or becomes insolvent.</>, 'Termination.'),
      c('9.3', 'We will stop work, revoke our platform connections and delete your accounting data as described in clause 6.3. Clauses 6, 7, 8 and 9 continue to apply.', 'After termination.'),
      c('9.4', 'Neither of us is liable for delay or failure caused by events outside reasonable control, such as platform outages, internet failures, natural disasters or government action.', 'Events beyond our control.'),
      c('9.5', 'We may update these Terms by posting a new version on this page. We will give at least [14] days\' notice by email of changes that materially affect you. Changes do not apply to orders already placed.', 'Changes to these Terms.'),
      c('9.6', 'If a dispute arises, email us first and we will try in good faith to resolve it within 30 days. If it is not resolved, [either party may refer it to arbitration in Indore under the Arbitration and Conciliation Act, 1996, before a sole arbitrator, in English].', 'Disputes.'),
      c('9.7', 'These Terms are governed by the laws of India. Subject to clause 9.6, the courts at Indore, Madhya Pradesh, have exclusive jurisdiction. This does not remove any right a consumer has to bring a claim in their home country.', 'Governing law.'),
      c('9.8', 'You may not transfer your rights under these Terms without our consent, which we will not unreasonably withhold. We may use subcontractors but remain responsible for their work. If any clause is found invalid, the rest remain in force. Not enforcing a right is not a waiver of it. Nothing in these Terms creates a partnership, agency or employment relationship.', 'Other terms.'),
    ],
  },
  {
    id: 'contact',
    title: '10. Contact us',
    blocks: [
      { type: 'p', content: <>For any question about these Terms, an order or a complaint, contact us on <Mail />.</> },
      { type: 'p', content: 'M/s MMC Convert, 163, RNT Marg, Indore, Madhya Pradesh, 452001, India' },
    ],
  },
];
