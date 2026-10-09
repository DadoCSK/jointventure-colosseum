import type { Metadata } from "next";
import { PageHeader, DemoBanner } from "@/components/ui";
import { Marketplace } from "@/components/interactive";
export const metadata: Metadata = { title: "Marketplace" };
export default function Projects() {
  return (
    <div className="container page-content">
      <PageHeader
        eyebrow="THE MARKETPLACE"
        title="Infrastructure worth building."
        subtitle="Explore agricultural infrastructure financing. Controlled-environment cultivation is our first use case."
      />
      <DemoBanner>
        Mock marketplace. Bavaria is real-world-inspired; the Spain and
        Netherlands projects are fictional demos.
      </DemoBanner>
      <Marketplace />
      <div className="marketplace-note">
        Financial figures are illustrative projections, not guaranteed returns.
      </div>
    </div>
  );
}
