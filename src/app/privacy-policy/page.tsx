import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Privacy Policy | Avantika Grain Mills",
  description: "Privacy Policy for Avantika Grain Mills Private Limited",
};

export default function PrivacyPolicyPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-16 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Legal</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="PRIVACY POLICY" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8 leading-relaxed">
          {/* 1. Introduction */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">1. Introduction</h2>
            <p>
              Avantika Grain Mills Private Limited is committed to protecting the personal information of visitors and customers using{" "}
              <a href="https://avantikagrains.com/" className="text-brand-gold hover:underline" target="_blank" rel="noopener noreferrer">
                https://avantikagrains.com/
              </a>
              . This policy explains how we collect, use, store, and protect your information.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">2. Information We Collect</h2>
            <p>
              We may collect your name, email address, phone number, billing and shipping addresses, account details, order history, transaction records, IP address, device information, and cookies.
            </p>
          </section>

          {/* 3. Use of Information */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">3. Use of Information</h2>
            <p>
              We use your information to process orders and payments, arrange deliveries, provide customer support, improve our website, prevent fraud, and comply with legal requirements.
            </p>
          </section>

          {/* 4. Payment Information */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">4. Payment Information</h2>
            <p>
              Payments are processed through third-party payment service providers. We do not intend to store complete card details, UPI PINs, or other sensitive payment authentication information.
            </p>
          </section>

          {/* 5. Cookies */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">5. Cookies</h2>
            <p>
              Our website may use cookies to manage sessions, remember preferences, support shopping cart functionality, and improve website performance. You can manage cookies through your browser settings.
            </p>
          </section>

          {/* 6. Information Sharing */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">6. Information Sharing</h2>
            <p>
              We do not sell or rent personal information for third-party marketing. Information may be shared with payment providers, delivery partners, technology providers, professional advisers, or authorities when legally required.
            </p>
          </section>

          {/* 7. Data Security and Retention */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">7. Data Security and Retention</h2>
            <p>
              We use reasonable security measures to protect personal information and retain it only as necessary for business operations, customer support, and legal compliance.
            </p>
          </section>

          {/* 8. Your Privacy Rights */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">8. Your Privacy Rights</h2>
            <p>
              Subject to applicable law, you may request access to, correction of, or deletion of your personal information, withdraw consent where applicable, or raise privacy concerns by contacting us.
            </p>
          </section>

          {/* 9. Third-Party Websites and Children's Privacy */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">9. Third-Party Websites and Children&apos;s Privacy</h2>
            <p>
              We are not responsible for third-party website privacy practices. We do not knowingly collect children&apos;s personal information in violation of applicable law.
            </p>
          </section>

          {/* 10. Policy Updates */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">10. Policy Updates</h2>
            <p>
              We may update this policy periodically. Changes will be published on this page.
            </p>
          </section>

          {/* 11. Contact Us */}
          <section className="bg-brand-cream/40 p-6 md:p-8 rounded-xl border border-brand-charcoal/10">
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">11. Contact Us</h2>
            <p className="font-semibold text-brand-charcoal mb-2">Avantika Grain Mills Private Limited</p>
            <div className="space-y-1.5 text-sm md:text-base">
              <p>
                <strong>Address:</strong> Gram Navda, Dhar Road, Navdapanth, Kalaria, Depalpur, Indore, Madhya Pradesh – 453001, India
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:avantikagrain@gmail.com" className="text-brand-gold hover:underline">
                  avantikagrain@gmail.com
                </a>
              </p>
              <p>
                <strong>Website:</strong>{" "}
                <a href="https://avantikagrains.com/" className="text-brand-gold hover:underline" target="_blank" rel="noopener noreferrer">
                  https://avantikagrains.com/
                </a>
              </p>
            </div>
          </section>

          {/* Final Acknowledgment */}
          <div className="pt-6 border-t border-brand-charcoal/10 text-sm md:text-base italic text-brand-charcoal/70">
            By using our website, you acknowledge that you have read this Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
