import { ArrowRight } from "lucide-react";

export function FacilityCaption() {
  return <p className="facility-caption">Illustrative facility imagery · Does not depict the Bavaria site.</p>;
}
export function StatusBadge({ children }: { children: React.ReactNode }) {
  return <span className="status-badge"><span />{children}</span>;
}
export function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="metric"><p>{label}</p><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <header className="page-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>;
}
export function BusinessMetrics() {
  return <div className="business-metrics">
    {[["€250,000", "Financing target"], ["€220,000", "Infrastructure"], ["€30,000", "Working capital"], ["~€33k/month", "Contracted revenue"], ["Obtained", "Licence"], ["Executed", "Agreement"], ["Pre-operational", "Project stage"]].map(([value, label]) => <MetricCard key={label} label={label} value={value} />)}
  </div>;
}
export function CapitalFlow() {
  return <section className="capital-flow" aria-label="Capital to infrastructure">
    <span className="eyebrow">SEE WHAT FUNDED INFRASTRUCTURE BECOMES</span>
    <ol>{["Capital", "Infrastructure", "Facility", "Production", "Revenue"].map((label, index) => <li key={label}><span>{label}</span>{index < 4 && <ArrowRight size={16} aria-hidden="true" />}</li>)}</ol>
  </section>;
}
