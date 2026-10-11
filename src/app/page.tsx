import Link from "next/link";
import { ArrowUpRight, Building2, FileCheck2, Activity, Wallet } from "lucide-react";
import { BusinessMetrics, CapitalFlow, FacilityCaption } from "@/components/ui";
import { InvestmentModal } from "@/components/financing";
import { bavaria, foundingLabel } from "@/data/projects";

export default function Home() {
  return <div className="container focused-overview">
    <section className="overview-hero">
      <div className="overview-copy">
        <span className="eyebrow">JOINT VENTURE</span>
        <h1>Fund real agricultural infrastructure.<br /><span>Track what it becomes.</span></h1>
        <p>Joint Venture combines onchain financing with real-world project visibility.</p>
        <div className="hero-actions">
          <Link className="btn btn-outline" href="/projects/bavaria">Explore Project <ArrowUpRight size={16} /></Link>
          <InvestmentModal triggerLabel="Finance on Devnet" />
        </div>
      </div>
      <div className="overview-facility">
        <div className="overview-project-label"><span className="eyebrow">{foundingLabel}</span><h2>{bavaria.name}</h2><span>Bavaria, Germany · Pre-operational</span></div>
        <FacilityCaption />
      </div>
    </section>
    <BusinessMetrics />
    <section className="origin-strip">
      <h2>Built from a real financing problem</h2>
      <p>Joint Venture was created while developing this regulated cultivation infrastructure project in Bavaria. The licence, facility and commercial agreement are in place; approximately €250,000 is still required for full deployment.</p>
    </section>
    <CapitalFlow />
    <div className="dashboard-shortcuts">
      {[
        { href: "/projects/bavaria", title: "Project", label: "Financing & allocation", icon: Building2 },
        { href: "/facility", title: "Facility", label: "Simulated telemetry & growth", icon: Activity },
        { href: "/documents", title: "Documents", label: "Offchain files · onchain integrity", icon: FileCheck2 },
        { href: "/portfolio", title: "Portfolio", label: "Your recorded Devnet position", icon: Wallet },
      ].map(item => <Link className="shortcut-card" href={item.href} key={item.title}><item.icon size={23} /><h2>{item.title}</h2><span>{item.label}</span><ArrowUpRight size={18} /></Link>)}
    </div>
  </div>;
}
