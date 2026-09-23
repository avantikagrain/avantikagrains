import { AnimatedText } from "@/components/shared/AnimatedText";

export const metadata = {
  title: "About Us | Avantika Grain Mills",
  description: "Discover our journey, heritage, and vision for the future of grain milling.",
};

export default function AboutPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <header className="mb-24 mt-12 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="OUR STORY." />
          </h1>
        </header>

        <article className="prose prose-lg md:prose-xl prose-stone mx-auto text-brand-charcoal/80">
          <p className="font-serif text-2xl leading-relaxed text-brand-charcoal mb-12">
            [COMPANY STORY PLACEHOLDER] At Avantika Grain Mills, our heritage is rooted in the rich agricultural landscapes where the finest grains are grown. We believe that true quality starts at the source.
          </p>
          
          <p>
            [CMS CONTENT PLACEHOLDER] Our journey began with a simple mission: to bridge the gap between traditional agricultural wisdom and modern manufacturing precision. Over the years, we have invested heavily in state-of-the-art European milling technology to ensure that every grain we process meets the highest global standards.
          </p>
          
          <h2 className="font-serif text-3xl text-brand-charcoal mt-16 mb-6 uppercase tracking-wider">Vision & Values</h2>
          <p>
            We don&apos;t just mill grains; we refine what goes into every product. Our commitment to consistency, purity, and reliability has made us a trusted partner for retail brands, bakeries, and food manufacturers across the globe.
          </p>
        </article>
      </div>
    </div>
  );
}
