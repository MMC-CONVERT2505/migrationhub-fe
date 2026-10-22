import React from 'react';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { ALL_SECTIONS, PRIVACY_EFFECTIVE, PRIVACY_UPDATED } from '@/content/privacyPolicy';

const PrivacyPage: React.FC = () => (
  <LegalDocument
    heading="Migration Hub Privacy Policy"
    documentTitle="Privacy Policy"
    dates={`Effective date: ${PRIVACY_EFFECTIVE} · Last updated: ${PRIVACY_UPDATED}`}
    sections={ALL_SECTIONS}
  />
);

export default PrivacyPage;
