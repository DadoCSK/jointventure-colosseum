import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock3,
  FileCheck2,
  Layers3,
  Leaf,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import {
  DemoBanner,
  FundingProgress,
  ProjectCard,
  StatusBadge,
  FacilityCaption,
} from "@/components/ui";
import { NoticeButton } from "@/components/interactive";
import { bavaria, eur, phase2, platformStats, projects, foundingLabel } from "@/data/projects";
export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="small-line" /> GROWTH, GROUNDED IN REAL ASSETS
            </span>
            <h1>
              Real infrastructure.
              <br />
              <span>Shared opportunity.</span>
            </h1>
            <p>
              An onchain financing platform for agricultural infrastructure. Finance the infrastructure
              behind tomorrow’s agricultural businesses, with transparent
              project records every step of the way.
            </p>
            <div className="hero-actions">
              <Link href="/projects" className="btn btn-primary">
                Explore Projects <ArrowUpRight size={18} />
              </Link>
              <NoticeButton
                title="List a Project"
                message={phase2.listing}
                className="btn btn-outline"
              >
                List a Project <ArrowRight size={17} />
              </NoticeButton>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} />
              Transparent records
              <span />
              Infrastructure-first financing
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-kicker">
              <span /> A NEW WAY TO BUILD
            </div>
            <div className="dashboard-card">
              <div className="dashboard-top">
                <span className="dashboard-icon">
                  <Building2 size={23} />
                </span>
                <StatusBadge>Funding open</StatusBadge>
              </div>
              <small className="eyebrow">{foundingLabel}</small>
              <h2>
                Bavaria Controlled Cultivation Infrastructure
              </h2>
              <p>
                Bavaria, Germany <span>·</span> Agriculture
              </p>
              <FundingProgress project={bavaria} />
              <div className="dashboard-stats">
                <div>
                  <small>Contracted monthly revenue</small>
                  <strong>~{eur(bavaria.contractedMonthlyRevenue!)}</strong>
                </div>
                <div>
                  <small>Infrastructure budget</small>
                  <strong>{eur(bavaria.infrastructureBudget!)}</strong>
                </div>
              </div>
              <Link className="dashboard-link" href="/projects/bavaria">
                Explore the project <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="floating-record">
              <span>
                <FileCheck2 size={20} />
              </span>
              <div>
                <strong>Built on transparency</strong>
                <small>Project document integrity pending</small>
              </div>
              <Clock3 size={16} />
            </div>
            <div className="visual-sprout">
              <Sprout size={47} />
            </div>
          </div>
        </div>
        <div className="container"><FacilityCaption /></div>
      </section>
      <div className="container">
        <div className="platform-stats">
          {platformStats.map((s) => (
            <div key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
              <small>MVP scope</small>
            </div>
          ))}
          <div className="stats-note">
            <Leaf size={22} />
            <p>
              Capital with a purpose.
              <br />
              <strong>Growth you can see.</strong>
            </p>
          </div>
        </div>
        <DemoBanner />
      </div>
      <section className="section container founding-story">
        <span className="eyebrow">{foundingLabel}</span>
        <h2>Built from a real financing problem</h2>
        <p>Joint Venture began while developing a regulated controlled-environment agricultural infrastructure project in Bavaria. After obtaining the cultivation association’s licence, securing the facility under lease and executing the commercial rental agreement, infrastructure financing remained the final major barrier to launch.</p>
        <p>We built Joint Venture to solve that problem — and then asked whether the same model could finance agricultural infrastructure more broadly. The business is pre-operational and the full €250,000 has not been raised.</p>
        <div className="origin-metrics">
          {[["€250,000", "Full financing requirement"], ["€220,000", "Infrastructure & equipment"], ["€30,000", "Initial working capital"], ["~€33,000/month", "Contracted rental revenue"], ["Obtained", "Licence"], ["Executed", "Commercial agreement"]].map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <p className="fine-print">Business facts supplied by the project developer; documents have not been independently authenticated. Contracted revenue is not current operating revenue or a guaranteed investor return.</p>
        <Link className="btn btn-primary" href="/projects/bavaria">View Founding Project <ArrowUpRight size={18}/></Link>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE MARKETPLACE</span>
            <h2>Built for what comes next.</h2>
            <p>
              Our real founding project, alongside two fictional examples of future agricultural infrastructure expansion.
            </p>
          </div>
          <Link href="/projects" className="text-link">
            View all projects <ArrowRight size={18} />
          </Link>
        </div>
        <div className="project-grid">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HOW IT WORKS</span>
              <h2>A clear path from capital to growth.</h2>
              <p>
                Understand the project. Finance the infrastructure. Follow the
                records.
              </p>
            </div>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Layers3,
                title: "Review the project",
                text: "Explore the business, financing needs, use of funds, and projected economics before making a decision.",
              },
              {
                icon: Building2,
                title: "Finance real infrastructure",
                text: "Explore agricultural infrastructure financing. This MVP demonstrates contributions using Devnet-only tokens with no monetary value.",
              },
              {
                icon: ShieldCheck,
                title: "Follow transparent records",
                text: "Compare local files with SHA-256 fingerprints anchored on Solana. Integrity does not establish legal authenticity; actual project records remain pending.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <div className="step-top">
                  <s.icon size={27} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
