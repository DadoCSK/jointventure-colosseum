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
        Bavaria is our real founding project, currently seeking financing. The Netherlands and Spain listings are fictional demo projects, not real customers.
      </DemoBanner>
      <Marketplace />
      <div className="marketplace-note">
        Bavaria business facts are supplied by the project developer. Demo listing figures are illustrative; financial projections are not guaranteed returns.
      </div>
    </div>
  );
}
