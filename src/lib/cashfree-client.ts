/**
 * Cashfree Payments Browser Client Helper
 * Avantika Grain Mills
 */

declare global {
  interface Window {
    Cashfree?: (config: { mode: "production" | "sandbox" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top";
        returnUrl?: string;
      }) => Promise<void>;
    };
  }
}

export function loadCashfreeSDK(): Promise<NonNullable<Window["Cashfree"]>> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Cashfree SDK cannot be initialized on the server."));
    }

    // 1. If already available on window, resolve immediately
    if (typeof window.Cashfree === "function") {
      return resolve(window.Cashfree);
    }

    // 2. Poll for window.Cashfree every 50ms (up to 3 seconds) in case script is currently executing
    let attempts = 0;
    const maxAttempts = 60; // 3 seconds total

    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof window.Cashfree === "function") {
        clearInterval(checkInterval);
        return resolve(window.Cashfree);
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        // Attempt dynamic script injection if still not available
        injectSdkScript();
      }
    }, 50);

    function injectSdkScript() {
      const existing = document.getElementById("cashfree-js-sdk");
      if (existing) {
        existing.remove();
      }

      const script = document.createElement("script");
      script.id = "cashfree-js-sdk";
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;

      script.onload = () => {
        if (typeof window.Cashfree === "function") {
          resolve(window.Cashfree);
        } else {
          reject(new Error("Cashfree SDK script loaded but constructor is unavailable."));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load Cashfree payments SDK. Please check your network connection."));
      };

      document.head.appendChild(script);
    }
  });
}
