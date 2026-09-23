import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Privacy Policy | Avantika Grain Mills",
  description: "Privacy Policy for Avantika Grain Mills Pvt. Ltd.",
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
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">1. Information We Collect</h2>
            <p>
              Avantika Grain Mills Pvt. Ltd. ("we," "our," or "us") is committed to protecting your privacy. We collect information you provide directly to us, such as when you create an account, make a purchase, or contact customer support. This may include your name, email address, shipping address, billing address, and payment information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to process transactions, fulfill your orders, communicate with you about your account, and improve our services. With your consent, we may also send you promotional emails about new products or offers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted third-party service providers (such as shipping partners and payment processors) strictly for the purpose of operating our business and delivering your orders.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">4. Cookies and Tracking</h2>
            <p>
              Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our audience comes from. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures designed to protect your personal data against accidental or unlawful destruction, loss, alteration, and unauthorized disclosure or access.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">6. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact us at:<br/><br/>
              <strong>Avantika Grain Mills Pvt. Ltd.</strong><br/>
              Email: avantikagrain@gmail.com<br/>
              Phone: +91 99999 99999<br/>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
