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

    if (typeof window.Cashfree === "function") {
      return resolve(window.Cashfree);
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
    );

    if (existingScript) {
      if (typeof window.Cashfree === "function") {
        return resolve(window.Cashfree);
      }
      existingScript.addEventListener("load", () => {
        if (typeof window.Cashfree === "function") {
          resolve(window.Cashfree);
        } else {
          reject(new Error("Cashfree SDK loaded but constructor is not available."));
        }
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Cashfree payments SDK."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.Cashfree === "function") {
        resolve(window.Cashfree);
      } else {
        reject(new Error("Cashfree SDK loaded but constructor is not available."));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Cashfree payments SDK. Please check your network connection."));
    };
    document.head.appendChild(script);
  });
}

