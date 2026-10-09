export type Category = "Agriculture" | "Processing" | "Storage";
export type Project = {
  id: string;
  name: string;
  location: string;
  category: Category;
  description: string;
  target: number;
  funded: number;
  contractedMonthlyRevenue?: number;
  infrastructureBudget?: number;
  status: string;
};
export const projects: Project[] = [
  {
    id: "bavaria",
    name: "Bavaria Cultivation Facility",
    location: "Bavaria, Germany",
    category: "Agriculture",
    description:
      "Purpose-built infrastructure for a modern, controlled-environment cultivation facility in the heart of Bavaria.",
    target: 250000,
    funded: 75000,
    contractedMonthlyRevenue: 33000,
    infrastructureBudget: 220000,
    status: "Funding open",
  },
  {
    id: "spain",
    name: "Valencia Greenhouse Expansion",
    location: "Valencia, Spain",
    category: "Agriculture",
    description:
      "Expanding greenhouse capacity with efficient irrigation and climate-controlled growing environments.",
    target: 180000,
    funded: 99000,
    status: "Demo project",
  },
  {
    id: "netherlands",
    name: "Dutch Indoor Cultivation Hub",
    location: "North Brabant, Netherlands",
    category: "Agriculture",
    description:
      "An energy-efficient indoor facility designed around precision cultivation and consistent production.",
    target: 320000,
    funded: 128000,
    status: "Demo project",
  },
];
export const bavaria = projects[0];
export type UseOfFunds = {
  label: string;
  amount: number;
  category: "Infrastructure" | "Other";
};
export const useOfFunds: UseOfFunds[] = [
  {
    label: "Facility fit-out & construction",
    amount: 75000,
    category: "Infrastructure",
  },
  { label: "Lighting systems", amount: 55000, category: "Infrastructure" },
  {
    label: "Climate control & ventilation",
    amount: 45000,
    category: "Infrastructure",
  },
  {
    label: "Irrigation & water treatment",
    amount: 25000,
    category: "Infrastructure",
  },
  { label: "Security & monitoring", amount: 20000, category: "Infrastructure" },
  {
    label: "Licensing & professional services",
    amount: 15000,
    category: "Other",
  },
  { label: "Working capital & contingency", amount: 15000, category: "Other" },
];
export type VerificationRecord = {
  id: string;
  title: string;
  description: string;
  status: "Integrity record pending";
};
export const verifications: VerificationRecord[] = [
  {
    id: "license",
    title: "Cultivation Licence",
    description: "Cultivation authorisation supporting the project case",
    status: "Integrity record pending",
  },
  {
    id: "rental",
    title: "Customer Rental Agreement",
    description: "Agreement supporting contracted monthly revenue",
    status: "Integrity record pending",
  },
  {
    id: "budget",
    title: "Infrastructure Budget",
    description: "Budget supporting the infrastructure financing requirement",
    status: "Integrity record pending",
  },
];
export const platformStats = [
  { value: "€1.2M", label: "Infrastructure financed" },
  { value: "6", label: "Projects on the platform" },
  { value: "100%", label: "Records transparent" },
];
export const portfolio = {
  totalCommitted: 10000,
  repayments: 0,
  activeProjects: 1,
  network: "Devnet",
  transaction: { date: "2026-10-01", amount: 10000, projectId: bavaria.id },
};
export const phase2 = {
  listing:
    "Project submissions will be available in Phase 2. This demo does not collect or save project information.",
};
export const eur = (amount: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
