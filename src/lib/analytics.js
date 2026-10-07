export function trackEvent(name, payload = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('neutralname:analytics', {
      detail: { name, payload },
    }),
  );
}
