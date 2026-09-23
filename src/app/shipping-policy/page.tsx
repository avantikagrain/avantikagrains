import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Shipping Policy | Avantika Grain Mills",
  description: "Shipping Policy for Avantika Grain Mills Pvt. Ltd.",
};

export default function ShippingPolicyPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-16 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Store Policies</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="SHIPPING POLICY" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">1. Order Processing Time</h2>
            <p>
              All orders are processed within 1-2 business days. Orders are not shipped or delivered on Sundays or local public holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">2. Shipping Rates & Delivery Estimates</h2>
            <p>
              Shipping charges for your order will be calculated and displayed at checkout. Standard domestic delivery typically takes 3-7 business days depending on your location. Expedited shipping options may be available at an additional cost.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">3. Shipment Confirmation & Order Tracking</h2>
            <p>
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">4. Damages and Issues</h2>
            <p>
              Avantika Grain Mills is not liable for any products damaged or lost during shipping. However, if you received your order damaged, please contact us immediately with photographic evidence, and we will work with the carrier to resolve the issue.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
