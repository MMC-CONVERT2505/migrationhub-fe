import React from 'react';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { TERMS_DATES, TERMS_SECTIONS, TERMS_EMAIL } from '@/content/termsOfUse';
import { EXTERNAL_LINKS } from '@/constants/links';

/** Only shown if the terms text is ever emptied, so the page never renders blank. */
const Fallback: React.FC = () => (
  <div className="rounded-xl border border-border bg-white p-6 text-[15px] leading-relaxed text-text-secondary">
    The Terms of Use are temporarily unavailable. The current terms are at{' '}
    <a href={EXTERNAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mmcconvert.com/termsofuse</a>
    , or email <a href={`mailto:${TERMS_EMAIL}`} className="text-blue-600 hover:underline">{TERMS_EMAIL}</a>.
  </div>
);

const TermsPage: React.FC = () => (
  <LegalDocument
    heading="Migration Hub Terms of Use"
    documentTitle="Terms of Use"
    dates={TERMS_DATES}
    sections={TERMS_SECTIONS}
    emptyNotice={<Fallback />}
  />
);

export default TermsPage;
