import { ArrowUpRight, Clock3, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import { eur, type Project } from "@/data/projects";
import { NoticeButton } from "./interactive";
export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="status-badge">
      <span />
      {children}
    </span>
  );
}
export function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function FundingProgress({ project }: { project: Project }) {
  const percent = Math.round((project.funded / project.target) * 100);
  return (
    <div className="funding-progress">
      <div className="funding-label">
        <strong>
          {eur(project.funded)} <span>committed</span>
        </strong>
        <span>{percent}% funded</span>
      </div>
      <progress
        className="progress progress-primary"
        value={project.funded}
        max={project.target}
        aria-label={`${project.name} funding`}
      />
      <div className="funding-label muted">
        <span>Target {eur(project.target)}</span>
        <span>{eur(project.target - project.funded)} to go</span>
      </div>
    </div>
  );
}
export function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <article className="project-card card">
      <div className={`project-art art-${index}`}>
        <div className="art-grid" />
        <div className="greenhouse">
          <span />
          <span />
          <span />
          <span />
        </div>
        <span className="category-tag">
          <Sprout size={13} />
          {project.category}
        </span>
        <span className="art-label">JV / 0{index + 1}</span>
      </div>
      <div className="project-body">
        <div className="project-location">
          <MapPin size={13} />
          {project.location}
        </div>
        <h3>{project.name}</h3>
        <p className="project-description">{project.description}</p>
        <div className="project-numbers">
          <div>
            <small>
              {project.contractedMonthlyRevenue !== undefined
                ? "Contracted monthly revenue"
                : "Financing target"}
            </small>
            <strong>
              {project.contractedMonthlyRevenue !== undefined
                ? `~${eur(project.contractedMonthlyRevenue)}`
                : eur(project.target)}
            </strong>
          </div>
          <div>
            <small>
              {project.infrastructureBudget !== undefined
                ? "Infrastructure budget"
                : "Capital committed"}
            </small>
            <strong>
              {eur(project.infrastructureBudget ?? project.funded)}
            </strong>
          </div>
        </div>
        <FundingProgress project={project} />
        <div className="project-bottom">
          <span className="verification-status">
            <Clock3 size={13} />
            Demo verification
          </span>
          {project.id === "bavaria" ? (
            <Link href="/projects/bavaria" className="text-link">
              View project <ArrowUpRight size={16} />
            </Link>
          ) : (
            <NoticeButton
              title={project.name}
              message={`${project.description} Demo target: ${eur(project.target)}. Demo capital committed: ${eur(project.funded)}. Full project details will be available in Phase 2.`}
              className="text-link"
            >
              View project <ArrowUpRight size={16} />
            </NoticeButton>
          )}
        </div>
      </div>
    </article>
  );
}
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
export function DemoBanner({
  children = "Demo environment. All projects, financial figures, and verification records are mocked.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="demo-banner">
      <span className="demo-dot" />
      <span>{children}</span>
      <span className="demo-label">DEMO DATA</span>
    </div>
  );
}
