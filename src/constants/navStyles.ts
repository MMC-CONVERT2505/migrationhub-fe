/**
 * Navigation text everywhere (header, menus, Back, footer, admin sidebar): dark by default, the area's accent on
 * hover and keyboard focus. `blue-*` is that accent — orange on the public site, blue in the admin panel — so
 * one rule stays consistent in both. The active/current item keeps its own highlighted style.
 */
export const NAV_TEXT = 'text-text-primary hover:text-blue-700 focus-visible:text-blue-700 transition-colors';

/** Same behaviour, a step softer, for secondary navigation such as footer links. */
export const NAV_TEXT_MUTED = 'text-text-secondary hover:text-blue-700 focus-visible:text-blue-700 transition-colors';
