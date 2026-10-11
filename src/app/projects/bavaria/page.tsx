import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { bavaria, eur, useOfFunds, readiness, foundingLabel } from "@/data/projects";
import { BusinessMetrics, CapitalStructure, MetricCard, StatusBadge } from "@/components/ui";
import { OnchainProject, InvestmentModal } from "@/components/financing";
export const metadata: Metadata = { title: "Bavaria Project" };
export default function Bavaria() {
  return <div className="container page-content focused-project">
    <header className="detail-header">
      <div><span className="eyebrow">{foundingLabel}</span><h1>{bavaria.name}</h1><div className="detail-metadata"><span>Bavaria, Germany</span><span>Pre-operational</span></div></div>
      <StatusBadge>Current raise · {bavaria.status}</StatusBadge>
    </header>
    <BusinessMetrics />
    <CapitalStructure />
    <section className="capital-deployment" aria-label="Project capital allocation">
      <div><span className="eyebrow">€100K ALREADY INVESTED</span><p className="capital-preparation">Spent on licensing, legal, regulatory and facility/project preparation.</p><span className="preparation-status">Licence obtained · Agreement executed</span></div>
      <ArrowRight size={20} aria-hidden="true" />
      <div><span className="eyebrow">€250K CURRENT RAISE</span><div className="summary-split"><MetricCard label="Infrastructure & equipment" value="€220,000" /><MetricCard label="Initial working capital" value="€30,000" /></div></div>
    </section>
    <small className="revenue-note">Contracted rent · not operating revenue or investor return.</small>
    <div className="project-dashboard project-detail-grid">
      <div className="project-live-column" id="financing"><OnchainProject /><InvestmentModal /></div>
      <div className="project-support">
        <section className="panel readiness-panel"><span className="eyebrow">REAL BUSINESS</span><h2>Project Readiness</h2><div className="readiness-grid">{readiness.map(item => <MetricCard key={item.label} {...item} />)}</div></section>
        <section className="panel allocation-panel"><span className="eyebrow">CURRENT RAISE ALLOCATION</span><h2>Use of Funds</h2><ol className="allocation-list">{useOfFunds.map(item => <li key={item.label}><div><span>{item.label}</span><strong>{eur(item.amount)}</strong></div><div className="allocation-track" aria-hidden="true"><span style={{ width: `${item.amount / bavaria.target * 100}%` }} /></div></li>)}</ol><div className="allocation-total"><span>Current raise</span><strong>€250,000</strong></div></section>
      </div>
    </div>
    <div className="project-resource-links"><Link href="/documents" className="text-link">Project Data Room <ArrowUpRight size={16} /></Link><Link href="/facility" className="text-link">Inspect the Facility Digital Twin <ArrowUpRight size={16} /></Link></div>
  </div>;
}
