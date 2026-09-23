import Link from "next/link";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="bg-brand-charcoal text-brand-ivory pt-24 pb-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6">
              <Logo />
            </div>
            <p className="text-brand-ivory/70 text-sm leading-relaxed mb-6">
              Premium grains. Precisely refined. Setting the standard for quality and consistency in modern grain milling.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-brand-ivory/70 hover:text-brand-gold transition-colors">
                <FaInstagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-brand-ivory/70 hover:text-brand-gold transition-colors">
                <FaLinkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-brand-ivory/70 hover:text-brand-gold transition-colors">
                <FaFacebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-brand-ivory/70 hover:text-brand-gold transition-colors">
                <FaYoutube className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-serif text-lg mb-6 uppercase tracking-wider text-brand-gold">Company</h4>
            <ul className="space-y-4 text-sm text-brand-ivory/70">
              <li><Link href="/about" className="hover:text-brand-ivory transition-colors">Our Story</Link></li>
              <li><Link href="/manufacturing" className="hover:text-brand-ivory transition-colors">Manufacturing</Link></li>
              <li><Link href="/quality" className="hover:text-brand-ivory transition-colors">Quality & Certifications</Link></li>
              <li><Link href="/contact" className="hover:text-brand-ivory transition-colors">Contact</Link></li>
              <li><Link href="/products" className="hover:text-brand-ivory transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-6 uppercase tracking-wider text-brand-gold">Contact Us</h4>
            <ul className="space-y-4 text-sm text-brand-ivory/70">
              <li className="leading-relaxed">
                AVANTIKA GRAIN MILLS PRIVATE LIMITED<br />
                Gram Navda Dhar Road, Navdapanth, Kalaria,<br />
                Depalpur, Indore, Madhya Pradesh, 453001
              </li>
              <li>IEC: ABFCA7783D | PAN: ABFCA7783D</li>
              <li>
                <a href="mailto:avantikagrain@gmail.com" className="hover:text-brand-gold transition-colors">
                  avantikagrain@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-brand-ivory/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-ivory/50">
          <p>&copy; {new Date().getFullYear()} Avantika Grain Mills Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-end">
            <Link href="/privacy-policy" className="hover:text-brand-ivory transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-brand-ivory transition-colors">Terms & Conditions</Link>
            <Link href="/shipping-policy" className="hover:text-brand-ivory transition-colors">Shipping Policy</Link>
            <Link href="/return-refund-policy" className="hover:text-brand-ivory transition-colors">Return & Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
