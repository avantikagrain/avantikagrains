import { Hero } from "@/components/hero/Hero";
import { GrainJourney } from "@/components/home/GrainJourney";
import { RefinementSection } from "@/components/home/RefinementSection";
import { ProductsShowcase } from "@/components/home/ProductsShowcase";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-ivory">
      <Hero />
      <GrainJourney />
      <RefinementSection />
      <ProductsShowcase />
    </div>
  );
}
