import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { verifications } from "@/data/projects";
import { DocumentIntegrityCard, IntegrityTestFixture } from "@/components/document-integrity";
export const metadata: Metadata = { title: "Documents" };
export default function Documents() {
  return <div className="container page-content documents-page">
    <PageHeader eyebrow="BAVARIA · DOCUMENT INTEGRITY" title="Documents" subtitle="Private documents stay offchain. Only their SHA-256 fingerprints can be anchored on Solana." />
    <div className="verification-grid">{verifications.map(record => <DocumentIntegrityCard key={record.id} record={record} />)}</div>
    <IntegrityTestFixture />
  </div>;
}
