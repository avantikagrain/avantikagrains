import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Terms & Conditions | Avantika Grain Mills",
  description: "Terms & Conditions for Avantika Grain Mills Pvt. Ltd.",
};

export default function TermsAndConditionsPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-16 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Legal</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="TERMS & CONDITIONS" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Avantika Grain Mills website, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Avantika Grain Mills' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">3. Product Information and Pricing</h2>
            <p>
              We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the site. However, we do not guarantee that the product descriptions or other content are accurate, complete, reliable, current, or error-free. Prices are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">4. Limitations</h2>
            <p>
              In no event shall Avantika Grain Mills or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Avantika Grain Mills' website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">5. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
