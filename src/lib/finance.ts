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
  const monthlySaving = Math.max(salary - expenses - emi, 0);

  const emiRatioBefore = salary > 0 ? (emi / salary) * 100 : 0;
  const emergencyMonthsBefore = expenses > 0 ? savings / expenses : 0;

  let savingsAfter = savings;
  let emiAfter = emi;

  if (fundingMode === "savings") {
    savingsAfter = savings - price;
  } else {
    const months = input.emiMonths ?? 12;
    const addEmi = input.newEmi ?? price / months;
    emiAfter = emi + addEmi;
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
