import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Return & Refund Policy | Avantika Grain Mills",
  description: "Return & Refund Policy for Avantika Grain Mills Pvt. Ltd.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-16 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Store Policies</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="RETURN & REFUND" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">1. Eligibility for Returns</h2>
            <p>
              Because our products are premium agricultural commodities and food items, we generally do not accept returns due to health and safety regulations. However, if you receive a product that is incorrect, defective, or significantly damaged, you have <strong>7 days</strong> from the date of delivery to request a return or refund.
            </p>
            <p>
              To be eligible for a return, your item must be unused, sealed, and in the same condition that you received it. It must also be in the original packaging.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">2. Processing a Refund</h2>
            <p>
              Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
            </p>
            <p>
              If you are approved, your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">3. Exchanges</h2>
            <p>
              We only replace items if they are defective, damaged, or expired upon arrival. If you need to exchange it for the same item, send us an email at avantikagrain@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">4. Shipping Returns</h2>
            <p>
              You will be responsible for paying for your own shipping costs for returning your item unless the return is due to our error (e.g., incorrect item shipped). Shipping costs are non-refundable.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
