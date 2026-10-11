import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, BriefcaseBusiness } from "lucide-react";
import { WalletPanel } from "@/components/wallet";
import {OnchainProject} from '@/components/financing';
import { projects, eur, portfolio } from "@/data/projects";
import {
  DemoBanner,
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
export const metadata: Metadata = { title: "My Portfolio" };
export default function Portfolio() {
  const demoProject = projects.find(project => project.id === "netherlands")!;
  return (
    <div className="container page-content portfolio-page">
      <PageHeader
        eyebrow="YOUR DASHBOARD"
        title="My Portfolio"
        subtitle="A clear view of your infrastructure financing positions."
      />
      <DemoBanner label="FICTIONAL EUR DATA">
        Portfolio positions and activity are demo data, independent of your
        wallet. Live Devnet test contributions are shown separately.
      </DemoBanner>
      <div className="portfolio-metrics">
        <MetricCard
          label="Active projects"
          value={String(portfolio.activeProjects)}
          note="Demo position"
        />
        <MetricCard
          label="Total committed"
          value={eur(portfolio.totalCommitted)}
          note="Demo commitment"
        />
        <MetricCard
          label="Repayments"
          value={eur(portfolio.repayments)}
          note="None in this demo"
        />
        <MetricCard
          label="Network"
          value={portfolio.network}
          note="Selected network · Solana Devnet"
        />
      </div>
      <WalletPanel />
      <OnchainProject portfolio/>
      <section className="portfolio-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FICTIONAL EUR PORTFOLIO EXAMPLE</span>
            <h2>Illustrative position.</h2>
          </div>
          <span className="muted">1 demo position</span>
        </div>
        <div className="position-card panel">
          <div className="position-title">
            <span className="position-icon">
              <BriefcaseBusiness size={25} />
            </span>
            <div>
              <h3>{demoProject.name}</h3>
              <p>{demoProject.location}</p>
            </div>
            <StatusBadge>Active · demo</StatusBadge>
          </div>
          <div className="position-data">
            <MetricCard
              label="Your commitment"
              value={eur(portfolio.totalCommitted)}
            />
            <MetricCard label="Repayments" value={eur(portfolio.repayments)} />
            <MetricCard
              label="Project funding"
              value={`${Math.round(((demoProject.funded ?? 0) / demoProject.target) * 100)}%`}
            />
            <Link href="/projects" className="btn btn-outline">
              View project <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="portfolio-section panel">
        <span className="eyebrow">ACTIVITY</span>
        <h2>Illustrative transaction history</h2>
        <div
          className="table-wrapper"
          tabIndex={0}
          role="region"
          aria-label="Illustrative transaction history table"
        >
          <table className="table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Project</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="transaction-type">
                    <ArrowDownLeft size={17} />
                    Demo commitment
                  </span>
                </td>
                <td>{demoProject.name}</td>
                <td>
                  <time dateTime={portfolio.transaction.date}>1 Oct 2026</time>
                </td>
                <td className="financial-value">
                  {eur(portfolio.transaction.amount)}
                </td>
                <td>
                  <span className="status-badge">Recorded · demo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
