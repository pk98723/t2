export interface Profile {
  salary: number;
  expenses: number;
  emi: number;
  savings: number;
}

export interface AnalysisInput extends Profile {
  price: number;
  fundingMode: "savings" | "emi";
  newEmi?: number;
  emiMonths?: number;
  // optional detailed lists
  emis?: { name?: string; monthlyAmount: number }[];
  investments?: { type?: string; monthlySIP?: number; totalValue?: number }[];
}

export type Verdict = "go" | "caution" | "stop";

export interface Analysis {
  verdict: Verdict;
  headline: string;
  emiRatioBefore: number;
  emiRatioAfter: number;
  emergencyMonthsBefore: number;
  emergencyMonthsAfter: number;
  monthsToRecover: number;
  coachNotes: string[];
}

export function analyze(input: AnalysisInput): Analysis {
  const { salary, expenses, emi, savings, price, fundingMode } = input;

  // Sum detailed EMIs if provided, otherwise fall back to `emi` field
  const existingEmiTotal = input.emis && input.emis.length ? input.emis.reduce((s, e) => s + (e.monthlyAmount || 0), 0) : emi || 0;

  // Sum investment monthly SIPs and total values
  const totalMonthlySIP = input.investments && input.investments.length ? input.investments.reduce((s, it) => s + (it.monthlySIP || 0), 0) : 0;
  const totalInvestmentsValue = input.investments && input.investments.length ? input.investments.reduce((s, it) => s + (it.totalValue || 0), 0) : 0;

  // Monthly saving considers salary - expenses - existing EMIs - monthly SIPs
  const monthlySaving = Math.max(salary - expenses - existingEmiTotal - totalMonthlySIP, 0);

  const emiRatioBefore = salary > 0 ? (existingEmiTotal / salary) * 100 : 0;
  // Consider investments total as part of liquid savings for emergency cushion (best-effort)
  const emergencyMonthsBefore = expenses > 0 ? (savings + totalInvestmentsValue) / expenses : 0;

  let savingsAfter = savings + totalInvestmentsValue;
  let emiAfter = existingEmiTotal;

  if (fundingMode === "savings") {
    savingsAfter = savingsAfter - price;
  } else {
    const months = input.emiMonths ?? 12;
    const addEmi = input.newEmi ?? price / months;
    emiAfter = emiAfter + addEmi;
  }

  const emiRatioAfter = salary > 0 ? (emiAfter / salary) * 100 : 0;
  const emergencyMonthsAfter = expenses > 0 ? Math.max(savingsAfter, 0) / expenses : 0;
  const monthsToRecover = monthlySaving > 0 ? price / monthlySaving : Infinity;

  const notes: string[] = [];
  let verdict: Verdict = "go";

  if (emiRatioAfter > 35) {
    verdict = "stop";
    notes.push(`Your EMI load would hit ${emiRatioAfter.toFixed(0)}% of income — anything above 35% is risky territory.`);
  } else if (emiRatioAfter > 25) {
    verdict = (verdict as Verdict) === "stop" ? "stop" : "caution";
    notes.push(`EMI load climbs to ${emiRatioAfter.toFixed(0)}%. Manageable, but it eats future flexibility.`);
  }

  if (emergencyMonthsAfter < 3) {
    verdict = (verdict as Verdict) === "stop" ? "stop" : "caution";
    notes.push(`Emergency cushion drops to ${emergencyMonthsAfter.toFixed(1)} months. Aim for at least 3 before big spends.`);
  } else {
    notes.push(`You'll still have ${emergencyMonthsAfter.toFixed(1)} months of cushion — solid.`);
  }

  if (fundingMode === "savings" && savingsAfter < 0) {
    verdict = "stop";
    notes.push("This purchase exceeds your savings entirely. Don't go into the red.");
  }

  if (isFinite(monthsToRecover)) {
    notes.push(`At your current pace you'd rebuild this amount in ~${Math.ceil(monthsToRecover)} months.`);
  } else {
    notes.push("You're not saving anything monthly right now — fix that before spending.");
  }

  const headline =
    verdict === "go" ? "Go ahead — you've earned it."
    : verdict === "caution" ? "Think twice. There's a smarter way."
    : "Don't buy this. Not yet.";

  return {
    verdict,
    headline,
    emiRatioBefore,
    emiRatioAfter,
    emergencyMonthsBefore,
    emergencyMonthsAfter,
    monthsToRecover,
    coachNotes: notes,
  };
}

export const fmt = (n: number, currency = "₹") =>
  `${currency}${Math.round(n).toLocaleString("en-IN")}`;
