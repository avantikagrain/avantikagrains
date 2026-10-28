import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "Terms & Conditions | Avantika Grain Mills",
  description: "Terms & Conditions for Avantika Grain Mills Private Limited",
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
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </header>

        <div className="prose prose-lg prose-brand max-w-none text-brand-charcoal/80 space-y-8 leading-relaxed">
          <div className="space-y-4 text-base md:text-lg">
            <p>
              Welcome to Avantika Grain Mills Private Limited. These Terms &amp; Conditions govern your access to and use of avantikagrains.com and the purchase of products offered through our website.
            </p>
            <p>
              By accessing our website, placing an order, or purchasing our products, you agree to these Terms &amp; Conditions. If you do not agree, please discontinue using the website.
            </p>
          </div>

          {/* 1. About Our Business */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">1. About Our Business</h2>
            <p>
              Avantika Grain Mills Private Limited is engaged in grain milling and the supply of grain products. We aim to provide quality products with accurate product information and reliable service.
            </p>
          </section>

          {/* 2. Eligibility and Website Use */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">2. Eligibility and Website Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be legally capable of entering into a binding agreement to place an order.</li>
              <li>You agree to provide accurate and complete information when registering or placing an order.</li>
              <li>You must not use the website for fraudulent, unlawful, or unauthorized purposes.</li>
              <li>You must not interfere with the website&apos;s functionality, security, or operation.</li>
            </ul>
          </section>

          {/* 3. Product Information and Quality */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">3. Product Information and Quality</h2>
            <div className="space-y-3">
              <p>
                We make reasonable efforts to ensure that product descriptions, specifications, prices, and other details are accurate and up to date.
              </p>
              <p>
                As grains are agricultural products, certain natural variations in colour, size, texture, moisture content, and appearance may occur depending on the variety, season, and processing method.
              </p>
              <p>
                Product specifications, packaging, quantity, and quality details will be provided wherever applicable. Customers should review the product information carefully before placing an order.
              </p>
            </div>
          </section>

          {/* 4. Pricing and Availability */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">4. Pricing and Availability</h2>
            <div className="space-y-3">
              <p>
                All product prices are displayed in Indian Rupees (INR), unless otherwise stated. Applicable taxes, shipping charges, and other fees will be communicated during checkout or before order confirmation, as applicable.
              </p>
              <p>
                Prices and product availability may change without prior notice. Any price change will not affect an order already confirmed, except where correction of an obvious pricing error or applicable law permits otherwise.
              </p>
              <p>
                We reserve the right to limit quantities or discontinue products based on availability.
              </p>
            </div>
          </section>

          {/* 5. Orders and Order Confirmation */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">5. Orders and Order Confirmation</h2>
            <div className="space-y-3">
              <p>
                Placing an order constitutes an offer to purchase the selected products. Orders are subject to acceptance, stock availability, payment verification, and delivery feasibility.
              </p>
              <p>
                We reserve the right to reject or cancel an order in cases involving incorrect pricing, inaccurate information, suspected fraudulent activity, stock shortages, or other legitimate operational reasons.
              </p>
              <p>
                If payment has already been received for a cancelled order, the applicable refund will be processed in accordance with our Return &amp; Refund Policy.
              </p>
            </div>
          </section>

          {/* 6. Payment Terms */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">6. Payment Terms</h2>
            <div className="space-y-3">
              <p>
                Customers must pay the applicable amount through the payment methods made available on the website.
              </p>
              <p>
                Orders may be processed after successful payment confirmation, unless alternative payment terms have been expressly agreed upon.
              </p>
              <p>
                Customers are responsible for providing accurate billing and payment information. We do not store or have access to sensitive payment credentials beyond the information made available through our authorized payment service providers.
              </p>
            </div>
          </section>

          {/* 7. Shipping and Delivery */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">7. Shipping and Delivery</h2>
            <div className="space-y-3">
              <p>
                We aim to dispatch and deliver orders within the estimated timelines communicated at the time of purchase or order confirmation.
              </p>
              <p>
                Delivery timelines may vary depending on the delivery location, product availability, transportation conditions, weather, and other circumstances beyond our reasonable control.
              </p>
              <p>
                Customers must provide a complete and accurate delivery address and contact information. Additional delivery charges may apply where communicated before order confirmation.
              </p>
              <p>
                For further details, please refer to our Shipping Policy.
              </p>
            </div>
          </section>

          {/* 8. Returns, Cancellations, and Refunds */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">8. Returns, Cancellations, and Refunds</h2>
            <div className="space-y-3">
              <p>
                Requests for order cancellations, returns, replacements, or refunds will be handled in accordance with our Return &amp; Refund Policy.
              </p>
              <p>
                Customers should inspect delivered products and report any shortage, damage, incorrect item, or quality-related concern within the timeframe specified in the applicable policy.
              </p>
              <p>
                Returns or refunds may be subject to verification of the claim and the condition of the product. Nothing in these Terms limits any consumer rights available under applicable law.
              </p>
            </div>
          </section>

          {/* 9. Customer Responsibilities */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">9. Customer Responsibilities</h2>
            <p className="mb-2">Customers agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate order, billing, and delivery details.</li>
              <li>Use purchased products in accordance with their intended purpose and applicable requirements.</li>
              <li>Notify us promptly of any order-related issue.</li>
              <li>Avoid fraudulent transactions, false claims, or misuse of the website.</li>
              <li>Comply with all applicable laws and regulations when purchasing or using our products.</li>
            </ul>
          </section>

          {/* 10. Intellectual Property */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">10. Intellectual Property</h2>
            <div className="space-y-3">
              <p>
                All website content, including text, product descriptions, photographs, logos, graphics, designs, and branding, belongs to Avantika Grain Mills Private Limited or its respective rights holders.
              </p>
              <p>
                You may not reproduce, distribute, modify, publish, or commercially use website content without prior written permission, except as permitted by applicable law.
              </p>
            </div>
          </section>

          {/* 11. Third-Party Services and Links */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">11. Third-Party Services and Links</h2>
            <div className="space-y-3">
              <p>
                Our website may contain links to third-party websites or use external services for payments, logistics, or other business operations.
              </p>
              <p>
                We do not control independent third-party websites and are not responsible for their content, policies, or services. Your use of such services may be subject to their respective terms and conditions.
              </p>
            </div>
          </section>

          {/* 12. Limitation of Liability */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">12. Limitation of Liability</h2>
            <div className="space-y-3">
              <p>
                To the extent permitted by applicable law, Avantika Grain Mills Private Limited shall not be liable for indirect or consequential losses arising from the use of the website, temporary service interruptions, or delays caused by circumstances beyond our reasonable control.
              </p>
              <p>
                We do not exclude or limit liability where such exclusion or limitation is prohibited by law, including applicable consumer protection rights.
              </p>
            </div>
          </section>

          {/* 13. Privacy and Data Protection */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">13. Privacy and Data Protection</h2>
            <div className="space-y-3">
              <p>
                We may collect and process personal information necessary to manage customer accounts, process orders, arrange deliveries, provide customer support, and meet legal obligations.
              </p>
              <p>
                Personal information will be handled in accordance with our Privacy Policy and applicable data protection laws.
              </p>
            </div>
          </section>

          {/* 14. Changes to These Terms */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">14. Changes to These Terms</h2>
            <div className="space-y-3">
              <p>
                We reserve the right to update or modify these Terms &amp; Conditions when necessary. Revised terms will be published on this page with an updated revision date.
              </p>
              <p>
                Your continued use of the website after the revised terms are published constitutes acceptance of the updated terms, to the extent permitted by applicable law.
              </p>
            </div>
          </section>

          {/* 15. Governing Law and Jurisdiction */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-3">15. Governing Law and Jurisdiction</h2>
            <p>
              These Terms &amp; Conditions shall be governed by the laws of India. Any disputes arising from the use of the website or the purchase of products shall be subject to the jurisdiction of the competent courts in accordance with applicable law.
            </p>
          </section>

          {/* 16. Contact Us */}
          <section className="bg-brand-cream/40 p-6 md:p-8 rounded-xl border border-brand-charcoal/10">
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">16. Contact Us</h2>
            <p className="mb-4">
              For questions, concerns, or assistance regarding these Terms &amp; Conditions, please contact us:
            </p>
            <div className="space-y-1.5 text-sm md:text-base">
              <p><strong>Company Name:</strong> Avantika Grain Mills Private Limited</p>
              <p><strong>Address:</strong> Gram Navda Dhar Road, Navdapanth, Kalaria, Depalpur, Indore, Madhya Pradesh – 453001, India</p>
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
            By using our website or placing an order, you acknowledge that you have read and agreed to these Terms &amp; Conditions.
          </div>
        </div>
      </div>
    </div>
  );
}
