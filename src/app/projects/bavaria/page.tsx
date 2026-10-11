import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { bavaria, eur, useOfFunds, readiness, foundingLabel } from "@/data/projects";
import { CapitalStructure, MetricCard, StatusBadge } from "@/components/ui";
import { OnchainProject, InvestmentModal } from "@/components/financing";
export const metadata: Metadata = { title: "Bavaria Project" };
export default function Bavaria() {
  return <div className="container page-content focused-project">
    <header className="detail-header">
      <div><span className="eyebrow">{foundingLabel}</span><h1>{bavaria.name}</h1><div className="detail-metadata"><span>Bavaria, Germany</span><span>Pre-operational</span></div></div>
      <StatusBadge>{bavaria.status}</StatusBadge>
    </header>
    <div className="project-dashboard">
      <section className="panel funding-summary">
        <span className="eyebrow">BUSINESS PROJECT CAPITAL</span><CapitalStructure /><p className="capital-preparation">€100k has already been invested in licensing, legal, regulatory and facility/project preparation.</p><span>Current raise status · Open</span>
        <div className="summary-split"><MetricCard label="Infrastructure & equipment" value="€220,000" /><MetricCard label="Working capital" value="€30,000" /></div>
        <MetricCard label="Contracted rental revenue" value="~€33k/month" note="Contracted rent · not operating revenue or investor return" />
      </section>
      <section className="panel readiness-panel"><span className="eyebrow">REAL BUSINESS</span><h2>Project Readiness</h2><div className="readiness-grid">{readiness.map(item => <MetricCard key={item.label} {...item} />)}</div></section>
    </div>
    <div className="project-dashboard project-detail-grid">
      <section className="panel allocation-panel"><span className="eyebrow">CAPITAL TO INFRASTRUCTURE</span><h2>Use of Funds</h2><ol className="allocation-list">{useOfFunds.map(item => <li key={item.label}><div><span>{item.label}</span><strong>{eur(item.amount)}</strong></div><div className="allocation-track" aria-hidden="true"><span style={{ width: `${item.amount / bavaria.target * 100}%` }} /></div></li>)}</ol><div className="allocation-total"><span>Current raise</span><strong>€250,000</strong></div></section>
      <div className="project-live-column" id="financing"><OnchainProject /><InvestmentModal /></div>
    </div>
    <div className="project-resource-links"><Link href="/facility" className="text-link">Planned facility demo <ArrowUpRight size={16} /></Link><Link href="/documents" className="text-link">Document integrity records · pending <ArrowUpRight size={16} /></Link></div>
  </div>;
}
