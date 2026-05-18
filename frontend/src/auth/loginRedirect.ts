export function redirectToLogin(): void {
  const returnTo = window.location.href;
  const target = `/login?return_to=${encodeURIComponent(returnTo)}`;
  window.location.assign(target);
}
