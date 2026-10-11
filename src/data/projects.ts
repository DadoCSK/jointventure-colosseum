export const bavaria = {
  id: "bavaria",
  name: "Bavaria Controlled Cultivation Infrastructure",
  location: "Bavaria, Germany",
  category: "Agriculture",
  target: 250000, // Current raise / unchanged onchain business target.
  totalProjectCapital: 350000,
  alreadyInvested: 100000,
  workingCapital: 30000,
  contractedMonthlyRevenue: 33000,
  infrastructureBudget: 220000,
  status: "Open",
};
export const projects = [bavaria];
export const foundingLabel = "FOUNDING PROJECT · REAL BUSINESS";
export const useOfFunds = [
  { label: "Facility / security / electrical / water", amount: 90000 },
  { label: "Large vegetation infrastructure", amount: 70000 },
  { label: "Vegetation + climate", amount: 25000 },
  { label: "Drying + climate", amount: 15000 },
  { label: "Processing", amount: 10000 },
  { label: "Other equipment", amount: 10000 },
  { label: "Working capital", amount: 30000 },
];
export const readiness = [
  { label: "Licence", value: "Obtained" },
  { label: "Agreement", value: "Executed" },
  { label: "Facility", value: "Secured under lease" },
  { label: "Operator", value: "GmbH infrastructure company" },
  { label: "Cultivation", value: "Association members" },
  { label: "Project stage", value: "Pre-operational" },
];
export type VerificationRecord = {
  id: string;
  title: string;
  status: "Integrity record pending";
};
export const verifications: VerificationRecord[] = [
  { id: "license", title: "Cultivation Licence", status: "Integrity record pending" },
  { id: "rental", title: "Customer Rental Agreement", status: "Integrity record pending" },
  { id: "budget", title: "Infrastructure Budget", status: "Integrity record pending" },
];
export const eur = (amount: number) => new Intl.NumberFormat("en-IE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
}).format(amount);
