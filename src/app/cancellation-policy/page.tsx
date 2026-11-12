import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Cancellation Policy | Avantika Grain Mills",
  description: "Cancellation Policy for Avantika Grain Mills Private Limited.",
};

export default function CancellationPolicyPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-16 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Store Policies</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="CANCELLATION POLICY" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">1. Order Cancellation Window</h2>
            <p>
              We process orders promptly to ensure that our freshly milled grains, pulses, and flours reach you in the shortest possible time. You may request an order cancellation at any time before the product has been dispatched or handed over to our logistics partner (typically within 12 to 24 hours of placing the order).
            </p>
            <p>
              Once your order has been dispatched from our Indore milling facility, it enters the logistics transit network and cannot be cancelled.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">2. How to Request a Cancellation</h2>
            <p>
              To request an order cancellation, please contact our support team as early as possible with your Order Reference ID (e.g., AVT-YYYY-XXXXX):
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Email:</strong> Send an email to <a href="mailto:avantikagrain@gmail.com" className="text-brand-gold hover:underline">avantikagrain@gmail.com</a> with the subject line &quot;Order Cancellation - [Your Order ID]&quot;.
              </li>
              <li>
                <strong>Details Required:</strong> Please provide your registered name, phone number, and reason for cancellation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">3. Refunds for Cancelled Orders</h2>
            <p>
              For prepaid orders (paid via UPI, Paytm, Debit/Credit Card, or Net Banking) that are cancelled successfully prior to dispatch:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>A 100% refund of the transaction amount will be credited back to your original source of payment.</li>
              <li>Refund requests are initiated by our accounts team within 24–48 business hours of cancellation approval.</li>
              <li>Depending on your issuing bank or payment gateway processing cycle, the refunded amount typically reflects in your bank account or card statement within 5–7 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">4. Cash on Delivery (COD) Cancellations</h2>
            <p>
              If you placed an order using Cash on Delivery (COD), you may cancel the order prior to dispatch by emailing our customer support team or confirming during our dispatch verification call/SMS. Once a COD consignment has been dispatched and is out for delivery, repeated cancellations or refusal to accept shipments may result in COD payment options being disabled for your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">5. Cancellation by Avantika Grain Mills</h2>
            <p>
              We reserve the right to cancel or refuse an order under certain unavoidable circumstances, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Unavailability of grain stock or seasonal crop batch quality standards.</li>
              <li>Unserviceable PIN codes or delivery restrictions beyond our carrier partner&apos;s reach.</li>
              <li>Inaccurate, incomplete, or unverified contact or shipping address details.</li>
              <li>Suspected fraudulent activity or unauthorized payment transactions.</li>
              <li>Inadvertent pricing or typographical errors on the website.</li>
            </ul>
            <p className="mt-3">
              If an order is cancelled by Avantika Grain Mills, you will be notified promptly via email or SMS, and any payment received will be refunded in full to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">6. Contact Information</h2>
            <p>
              If you have any questions or require assistance regarding order cancellations, please reach out to us:
            </p>
            <div className="mt-4 p-6 bg-brand-cream/40 rounded-xl border border-brand-charcoal/10 space-y-2">
              <p><strong>Company:</strong> Avantika Grain Mills Private Limited</p>
              <p><strong>Address:</strong> Gram Navda Dhar Road, Navdapanth, Kalaria, Depalpur, Indore, Madhya Pradesh – 453001, India</p>
              <p><strong>Email:</strong> <a href="mailto:avantikagrain@gmail.com" className="text-brand-gold hover:underline">avantikagrain@gmail.com</a></p>
              <p><strong>Website:</strong> <a href="https://avantikagrains.com/" className="text-brand-gold hover:underline">https://avantikagrains.com/</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

