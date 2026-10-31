/** Computed at render, so no footer can show a stale year. */
export const currentYear = (): number => new Date().getFullYear();

export const copyrightNotice = (): string => `© ${currentYear()} MMC Convert. All rights reserved.`;
