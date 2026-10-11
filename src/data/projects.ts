export type Category = "Agriculture" | "Processing" | "Storage";
export type Project = {
  id: string;
  name: string;
  location: string;
  category: Category;
  description: string;
  target: number;
  funded?: number;
  founding?: boolean;
  workingCapital?: number;
  contractedMonthlyRevenue?: number;
  infrastructureBudget?: number;
  status: string;
};
export const projects: Project[] = [
  {
    id: "bavaria",
    name: "Bavaria Controlled Cultivation Infrastructure",
    location: "Bavaria, Germany",
    category: "Agriculture",
    description:
      "The real founding project behind Joint Venture. Licensed association, leased facility and executed commercial rental agreement; infrastructure financing is the remaining barrier to launch.",
    target: 250000,
    founding: true,
    workingCapital: 30000,
    contractedMonthlyRevenue: 33000,
    infrastructureBudget: 220000,
    status: "Funding open",
  },
  {
    id: "netherlands",
    name: "Netherlands Greenhouse Expansion",
    location: "North Brabant, Netherlands",
    category: "Agriculture",
    description: "Fictional demo of energy-efficient greenhouse expansion, showing how the platform could serve agriculture more broadly.",
    target: 320000,
    funded: 128000,
    status: "Demo project",
  },
  {
    id: "spain",
    name: "Spanish Indoor Produce Facility",
    location: "Valencia, Spain",
    category: "Agriculture",
    description: "Fictional demo of an indoor produce facility with efficient irrigation and climate control. Not a real customer or active project.",
    target: 180000,
    funded: 99000,
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
  {label: "Infrastructure & equipment", amount: 220000, category: "Infrastructure"},
  {label: "Initial working capital", amount: 30000, category: "Other"},
];
export const foundingLabel = "FOUNDING PROJECT · REAL-WORLD PILOT";
export const readiness = [
  {label: "Cultivation Licence", value: "Obtained"},
  {label: "Commercial Rental Agreement", value: "Executed"},
  {label: "Facility", value: "Secured under lease"},
  {label: "Infrastructure Plan", value: "€220,000"},
  {label: "Initial Working Capital", value: "€30,000"},
  {label: "Full Capital Requirement", value: "€250,000"},
  {label: "Project Stage", value: "Pre-operational"},
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
  { value: "1", label: "Real founding project" },
  { value: "2", label: "Fictional demo projects" },
  { value: "Devnet", label: "Technical financing demo" },
];
export const portfolio = {
  totalCommitted: 10000,
  repayments: 0,
  activeProjects: 1,
  network: "Devnet",
  transaction: { date: "2026-10-01", amount: 10000, projectId: "netherlands" },
};
export const phase2 = {
  listing:
    "Project submissions are not available in this MVP. This demo does not collect or save project information.",
};
export const eur = (amount: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
