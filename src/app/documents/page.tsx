import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { verifications } from "@/data/projects";
import { DocumentIntegrityCard, IntegrityTestFixture } from "@/components/document-integrity";
export const metadata: Metadata = { title: "Project Data Room" };
export default function Documents() {
  return <div className="container page-content documents-page">
    <PageHeader eyebrow="BAVARIA · DUE DILIGENCE" title="Project Data Room" subtitle="Project records and their onchain integrity status, in one place." />
    <section className="data-room" aria-labelledby="project-records-title"><div className="data-room-heading"><h2 id="project-records-title">Project records</h2><span>3 records · Private files</span></div><div className="verification-grid">{verifications.map(record => <DocumentIntegrityCard key={record.id} record={record} />)}</div><small className="data-room-note">Private files are not available for download in this MVP.</small></section>
    <section className="integrity-demo" aria-labelledby="integrity-demo-title"><span className="eyebrow">ONCHAIN INTEGRITY DEMO</span><h2 id="integrity-demo-title">Verify a fingerprint. Keep the document private.</h2><p>Verify that a local document matches the fingerprint anchored on Solana.</p><ol className="integrity-flow" aria-label="Document integrity process">{['Private document','SHA-256 fingerprint','Solana record','Verify'].map((label,index)=><li key={label}><span>{label}</span>{index<3&&<ArrowRight size={15} aria-hidden="true"/>}</li>)}</ol><small>Document contents remain private. Only the integrity fingerprint is recorded onchain.</small><IntegrityTestFixture /><details className="technical-details"><summary>What integrity verifies</summary><p>Matching bytes, not issuer authenticity, legal validity or truthfulness. Fingerprints and category metadata are public.</p></details></section>
  </div>;
}
