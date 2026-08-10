import { type Transaction, type Category, type MonthlyExpenseAnalysis } from "@/lib/expense";

export function exportTransactionsToCSV(transactions: Transaction[], categories: Category[]): void {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ["Date", "Category", "Description", "Amount", "Recurring", "Interval", "Tags"];
  const rows = transactions.map((tx) => [
    tx.transaction_date,
    categoryMap.get(tx.category_id) || "Unknown",
    `"${(tx.description || "").replace(/"/g, '""')}"`,
    tx.amount.toString(),
    tx.is_recurring ? "Yes" : "No",
    tx.recurring_interval || "",
    tx.tags ? `"${tx.tags.join(", ")}"` : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, `expenses-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
}

export function exportAnalysisReport(analysis: MonthlyExpenseAnalysis): void {
  const monthStr = analysis.month;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>T2 Report — ${monthStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
    .header { margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { color: #666; margin-top: 4px; font-size: 14px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #FFD700; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .metric { background: #f5f5f5; border-radius: 8px; padding: 12px; }
    .metric .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
    .metric .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .metric .sublabel { font-size: 12px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #1a1a1a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 6px; border-bottom: 1px solid #ddd; }
    .advice { list-style: none; }
    .advice li { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .advice li::before { content: "•"; color: #FFD700; font-weight: bold; margin-right: 8px; }
    .progress-bar { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .progress-fill { height: 100%; background: #FFD700; border-radius: 4px; }
    .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>T2 Financial Report</h1>
    <p>${monthStr} · Generated on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="section">
    <h2>Financial Health Score: ${analysis.healthScore}%</h2>
    <div class="metrics">
      <div class="metric">
        <div class="label">Total Income</div>
        <div class="value">₹${Math.round(analysis.total_income).toLocaleString("en-IN")}</div>
      </div>
      <div class="metric">
        <div class="label">Total Expenses</div>
        <div class="value">₹${Math.round(analysis.total_expenses).toLocaleString("en-IN")}</div>
      </div>
      <div class="metric">
        <div class="label">Savings</div>
        <div class="value">₹${Math.round(analysis.savings).toLocaleString("en-IN")}</div>
        <div class="sublabel">${analysis.savingsRate.toFixed(1)}% of income</div>
      </div>
      <div class="metric">
        <div class="label">Budget Status</div>
        <div class="value">${analysis.total_expenses > analysis.total_budget ? "Over Budget" : "Under Budget"}</div>
        <div class="sublabel">Budget: ₹${Math.round(analysis.total_budget).toLocaleString("en-IN")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Category Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Spent</th>
          <th>Budget</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${analysis.categoryBreakdown.map((b) => `
        <tr>
          <td><strong>${b.category.name}</strong> ${b.category.is_essential ? "(Essential)" : ""}</td>
          <td>₹${Math.round(b.spent).toLocaleString("en-IN")}</td>
          <td>${b.budget > 0 ? "₹" + Math.round(b.budget).toLocaleString("en-IN") : "—"}</td>
          <td>${b.percentOfBudget.toFixed(0)}%</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  ${analysis.advice.length > 0 ? `
  <div class="section">
    <h2>Financial Advice</h2>
    <ul class="advice">
      ${analysis.advice.map((a) => `<li>${a}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <div class="footer">
    <p>T2 — Think Twice. Spend Right. · Generated from your financial data</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.document.title = `T2 Report — ${monthStr}`;
  }
  // Cleanup after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}