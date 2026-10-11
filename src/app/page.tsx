import Link from "next/link";
import { ArrowUpRight, Building2, FileCheck2, Activity, Wallet } from "lucide-react";
import { BusinessMetrics, CapitalStructure, CapitalFlow, FacilityCaption } from "@/components/ui";
import { InvestmentModal } from "@/components/financing";
import { bavaria, foundingLabel } from "@/data/projects";

export default function Home() {
  return <div className="container focused-overview">
    <section className="overview-hero">
      <div className="overview-copy">
        <span className="eyebrow">JOINT VENTURE</span>
        <h1>Finance real infrastructure.<br /><span>Verify what your capital is building.</span></h1>
        <p>Real-world infrastructure. Onchain financing, verifiable records and asset-level transparency.</p>
      </div>
      <BusinessMetrics />
      <div className="hero-actions"><Link className="btn btn-primary" href="/projects/bavaria">Explore the Bavaria Project <ArrowUpRight size={16} /></Link><Link className="btn btn-outline" href="#how-it-works">See How It Works</Link></div>
      <div className="overview-facility">
        <div className="overview-project-label"><span className="eyebrow">{foundingLabel}</span><h2>{bavaria.name}</h2><span>Bavaria, Germany · Pre-operational</span></div>
        <FacilityCaption />
      </div>
    </section>
    <CapitalStructure showDemo={false} />
    <div className="overview-readiness"><span>Licence <strong>Obtained</strong></span><span>Agreement <strong>Executed</strong></span><span>Project stage <strong>Pre-operational</strong></span></div>
    <section className="origin-strip">
      <h2>Built from a real financing problem</h2>
      <p>€100k has already been invested in licensing, legal, regulatory and facility/project preparation. The €250k raise funds €220k of infrastructure & equipment and €30k of initial working capital.</p>
    </section>
    <section id="how-it-works" className="demo-path" aria-labelledby="demo-path-title"><div><span className="eyebrow">FROM CAPITAL TO VISIBILITY</span><h2 id="demo-path-title">One project. Verifiable progress.</h2></div><ol><li>Explore the project</li><li>Finance on Devnet</li><li>Verify your record</li><li>Inspect the facility</li></ol><InvestmentModal triggerLabel="Finance on Devnet" /></section>
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
