import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
import CSwal from "./swal";

export const FREE_SCAN_LIMIT = 8;
export const FREE_AI_LIMIT = 5;
export const PREMIUM_PRICE = "$2.99";

export type ClarivanaPlan = "free" | "premium";

export async function getCurrentPlan(): Promise<ClarivanaPlan> {
  const fb = getFirebase();
  const user = fb?.auth.currentUser;
  if (!fb || !user) return "free";
  const snapshot = await getDoc(doc(fb.db, "users", user.uid));
  return snapshot.data()?.["plan"] === "premium" ? "premium" : "free"; // index-signature access
}

export async function openMockPremiumCheckout(): Promise<boolean> {
  const fb = getFirebase();
  const user = fb?.auth.currentUser;
  if (!fb || !user) {
    await CSwal.fire({ icon: "info", title: "Log in first", text: "Please log in before upgrading your plan." });
    return false;
  }

  const result = await CSwal.fire({
    title: "Start Clarivana Premium",
    html: `
      <div class="cv-checkout">
        <div class="cv-checkout-plan">
          <div>
            <p class="cv-results-title">Premium monthly</p>
            <p class="cv-checkout-price">${PREMIUM_PRICE}<span>/month</span></p>
          </div>
          <span class="cv-premium-mark">PRO</span>
        </div>
        <div class="cv-checkout-benefits">
          <span>✓ Unlimited food-label scans</span>
          <span>✓ Unlimited AI ingredient analysis</span>
          <span>✓ Deeper health insights and alternatives</span>
        </div>
        <div class="cv-demo-payment">
          <span class="cv-demo-card">•••• 4242</span>
          <span>Competition demo card</span>
        </div>
        <p class="cv-demo-notice"><b>Demo only.</b> No real payment is processed and no card details are collected.</p>
      </div>`,
    width: 520,
    showCancelButton: true,
    confirmButtonText: `Start Premium — ${PREMIUM_PRICE}`,
    cancelButtonText: "Not now",
    buttonsStyling: false,
    customClass: {
      popup: "clarivana-modal",
      confirmButton: "cv-swal-btn cv-swal-primary",
      cancelButton: "cv-swal-btn cv-swal-outline",
    },
    focusConfirm: false,
  });
  if (!result.isConfirmed) return false;

  CSwal.fire({
    title: "Activating Premium…",
    text: "Setting up your competition demo subscription.",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => CSwal.showLoading(),
  });

  const startedAt = new Date();
  const renewsAt = new Date(startedAt);
  renewsAt.setMonth(renewsAt.getMonth() + 1);
  await setDoc(
    doc(fb.db, "users", user.uid),
    {
      plan: "premium",
      premiumSince: startedAt.toISOString(),
      billing: {
        demo: true,
        interval: "month",
        price: 2.99,
        currency: "USD",
        renewsAt: renewsAt.toISOString(),
      },
    },
    { merge: true },
  );

  await CSwal.fire({
    icon: "success",
    title: "Welcome to Premium",
    text: "Unlimited scans and AI analysis are now active for this demo.",
    confirmButtonText: "Continue",
    buttonsStyling: false,
    customClass: { confirmButton: "cv-swal-btn cv-swal-primary" },
  });
  return true;
}

export async function cancelMockPremium(): Promise<boolean> {
  const fb = getFirebase();
  const user = fb?.auth.currentUser;
  if (!fb || !user) return false;
  const result = await CSwal.fire({
    icon: "warning",
    title: "End demo subscription?",
    text: "Your account will return to the Free plan and daily limits will apply.",
    showCancelButton: true,
    confirmButtonText: "Return to Free",
    cancelButtonText: "Keep Premium",
    buttonsStyling: false,
    customClass: {
      confirmButton: "cv-swal-btn cv-swal-outline",
      cancelButton: "cv-swal-btn cv-swal-primary",
    },
  });
  if (!result.isConfirmed) return false;
  await setDoc(
    doc(fb.db, "users", user.uid),
    { plan: "free", premiumEndedAt: new Date().toISOString(), billing: { demo: true, status: "cancelled" } },
    { merge: true },
  );
  return true;
}