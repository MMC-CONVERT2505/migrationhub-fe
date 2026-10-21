/**
 * Scroll to a home-page section, going home first when called from another page.
 * Waits for the section to mount (it renders after the route change) instead of guessing a delay.
 */
export function goToSection(
  id: string,
  pathname: string,
  navigate: (to: string) => void,
): void {
  const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (pathname === '/') {
    scroll();
    return;
  }
  navigate('/');
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (document.getElementById(id) || tries > 20) {
      window.clearInterval(timer);
      scroll();
    }
  }, 100);
}
