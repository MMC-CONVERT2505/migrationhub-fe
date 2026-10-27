import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { FlowStepper } from '@/components/migration/FlowStepper';
import type { FlowPage } from '@/constants/migrationFlow';
import { cn } from '@/utils/format';
import { useAppStore } from '@/store/appStore';

interface FlowLayoutProps {
  page: FlowPage;
  /** Tailwind max-width class for the content column. */
  widthClass?: string;
  children: React.ReactNode;
}

/** Shared chrome for every post-pair-selection page: website nav with the Hub logo and a
 *  Back button, the 4-step stepper, and the copyright footer. The Back button is left out
 *  inside the website direct-link flow, which has nowhere to go back to. */
export const FlowLayout: React.FC<FlowLayoutProps> = ({ page, widthClass = 'max-w-3xl', children }) => {
  const inDirectLinkFlow = useAppStore((s) => s.dedicatedFlow !== null);
  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-x-clip">
      <Navbar showBack={!inDirectLinkFlow} hideAuthCta />
      <main className={cn('flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8', widthClass)}>
        <FlowStepper page={page} className="max-w-xl mx-auto mb-8" />
        {children}
      </main>
      <CompactFooter />
    </div>
  );
};
