/**
 * What the customer sees in the Country list: the name alone. The stored/sent value keeps its
 * currency suffix ("Australia (AUD)") because the conversion tools and the FY-end lookup are
 * keyed on it — only the label changes.
 */
export const countryDisplayName = (label: string): string => label.replace(/\s*\([A-Z]{3}\)\s*$/, '');
