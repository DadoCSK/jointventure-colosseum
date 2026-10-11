import type { Metadata } from "next";
import { PageHeader, CapitalFlow } from "@/components/ui";
import { FacilityDashboard } from "@/components/facility";
export const metadata: Metadata = { title: "Facility Digital Twin" };
export default function Facility() {
  return <div className="container page-content facility-page">
    <PageHeader eyebrow="BAVARIA · PRE-OPERATIONAL" title="Facility Digital Twin" subtitle="Simulated preview of the planned Bavaria cultivation environment." />
    <FacilityDashboard />
    <CapitalFlow />
  </div>;
}
