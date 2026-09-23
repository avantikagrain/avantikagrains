import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div data-header-theme="light" className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-brand-ivory text-brand-charcoal">
      <h1 className="font-serif text-8xl md:text-9xl font-bold tracking-widest text-brand-gold mb-6">
        404
      </h1>
      <h2 className="font-serif text-3xl md:text-4xl mb-6">
        Looks like this grain didn&apos;t make it through the mill.
      </h2>
      <p className="text-brand-charcoal/70 max-w-md mb-12">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <Link 
        href="/"
        className="flex items-center gap-2 px-8 py-4 border border-brand-charcoal text-brand-charcoal font-medium uppercase tracking-wider hover:bg-brand-charcoal hover:text-brand-ivory transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Avantika
      </Link>
    </div>
  );
}
