"use client";

import { useState } from "react";
import { AnimatedText } from "@/components/shared/AnimatedText";

export default function ContactPage() {
  const [enquiryType, setEnquiryType] = useState("General Enquiry");

  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-6xl">
        <header className="mb-24 mt-12 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="LET'S BUILD SOMETHING BETTER." />
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            <div>
              <h3 className="font-serif text-2xl text-brand-charcoal mb-4 uppercase tracking-wide">Headquarters</h3>
              <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                Gram Navda Dhar Road, Navdapanth, Kalaria<br/>
                Depalpur, Indore<br/>
                Madhya Pradesh, 453001<br/>
                India
              </p>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-brand-charcoal mb-4 uppercase tracking-wide">Contact</h3>
              <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                <a href="mailto:avantikagrain@gmail.com" className="hover:text-brand-gold transition-colors">
                  avantikagrain@gmail.com
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-brand-charcoal mb-4 uppercase tracking-wide">Legal</h3>
              <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                Avantika Grain Mills Pvt. Ltd.<br/>
                IEC: ABFCA7783D<br/>
                Issued by DGFT, Govt. of India
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8 bg-brand-cream p-8 md:p-12 border border-brand-charcoal/10">
            <h2 className="font-serif text-3xl text-brand-charcoal mb-8 uppercase tracking-wide">Enquiry Form</h2>
            
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">I am a...</label>
                <select 
                  className="w-full bg-transparent border-b border-brand-charcoal/30 py-3 focus:outline-none focus:border-brand-gold transition-colors appearance-none"
                  value={enquiryType}
                  onChange={(e) => setEnquiryType(e.target.value)}
                >
                  <option>Distributor</option>
                  <option>Retailer</option>
                  <option>Bulk Buyer</option>
                  <option>Food Manufacturer</option>
                  <option>Export Buyer</option>
                  <option>Private Label</option>
                  <option>General Enquiry</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">Name</label>
                  <input type="text" className="w-full bg-transparent border-b border-brand-charcoal/30 py-2 focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">Company</label>
                  <input type="text" className="w-full bg-transparent border-b border-brand-charcoal/30 py-2 focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">Email</label>
                  <input type="email" className="w-full bg-transparent border-b border-brand-charcoal/30 py-2 focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">Phone</label>
                  <input type="tel" className="w-full bg-transparent border-b border-brand-charcoal/30 py-2 focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-2 uppercase tracking-wider">Message</label>
                <textarea rows={4} className="w-full bg-transparent border-b border-brand-charcoal/30 py-2 focus:outline-none focus:border-brand-gold transition-colors resize-none" />
              </div>

              <button className="px-8 py-4 bg-brand-charcoal text-brand-ivory font-medium uppercase tracking-wider hover:bg-brand-gold hover:text-brand-charcoal transition-colors">
                Submit Enquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
