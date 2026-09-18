/**
 * Where to send the customer after a successful payment.
 *
 * The gateway redirects to a fixed `/order-success` URL with no product context, so the
 * destination is stashed just before handing off and read back on return. Without this the
 * success page could only offer a generic "view payments" link, and a course buyer was never
 * taken into the course they had just paid for.
 *
 * sessionStorage (not localStorage): the hand-off and the return are the same tab and the same
 * session, and a stale destination should not outlive the tab.
 */
const KEY = 'b3:post-payment-destination';

export interface PostPaymentDestination {
  href: string;
  labelAr: string;
  labelEn: string;
}

export function setPostPaymentDestination(destination: PostPaymentDestination) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(destination));
  } catch {
    // Private-mode or storage-disabled browsers just fall back to the generic success page.
  }
}

export function takePostPaymentDestination(): PostPaymentDestination | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    // Read-once: a refresh of the success page should not keep re-offering the same course.
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PostPaymentDestination;
    return typeof parsed?.href === 'string' && parsed.href.startsWith('/') ? parsed : null;
  } catch {
    return null;
  }
}
