import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchTransactions,
  fetchCategories,
  fetchMonthlyBudget,
  fetchProfile,
} from "@/lib/data";
import { computeMonthlyExpenseAnalysis, getMonthYear, fmt } from "@t2/shared";
import type { MonthlyExpenseAnalysis } from "@t2/shared";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

type ViewState = "loading" | "error" | "empty" | "data";

export default function InsightsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [state, setState] = useState<ViewState>("loading");
  const [analysis, setAnalysis] = useState<MonthlyExpenseAnalysis | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true);
    else setState("loading");
    try {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

      const [transactions, categories, budget, profile] = await Promise.all([
        fetchTransactions(userId, { startDate, endDate }),
        fetchCategories(userId),
        fetchMonthlyBudget(userId, year, month),
        fetchProfile(userId),
      ]);

      const monthlyIncome = profile?.monthly_salary || 0;

      if (transactions.length === 0 && monthlyIncome === 0) {
        setState("empty");
      } else {
        const a = computeMonthlyExpenseAnalysis({
          year,
          month,
          transactions,
          categories,
          budget,
          monthlyIncome,
        });
        setAnalysis(a);
        setState("data");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load insights");
      setState("error");
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  if (state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === "empty") {
    return (
      <View style={styles.container}>
        <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} total={0} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyBody}>
            Add your salary and expenses for {getMonthYear(year, month)} to see insights.
          </Text>
        </View>
      </View>
    );
  }

  if (!analysis) return null;

  const { healthScore, total_income, total_expenses, total_budget, savings, savingsRate, categoryBreakdown, advice } = analysis;
  const isOverBudget = total_expenses > total_budget;

  return (
    <View style={styles.container}>
      <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} total={total_expenses} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} refreshing={false} />}
      >
        {/* Health score */}
        <View style={styles.healthCard}>
          <View style={styles.ringOuter}>
            <View style={[styles.ringInner, { borderColor: healthScore >= 70 ? "#10B981" : healthScore >= 40 ? "#F59E0B" : "#EF4444" }]}>
              <Text style={styles.ringScore}>{healthScore}</Text>
              <Text style={styles.ringLabel}>Health</Text>
            </View>
          </View>
          <View style={styles.healthRow}>
            <Metric label="Income" value={fmt(total_income)} color="#10B981" />
            <Metric label="Expenses" value={fmt(total_expenses)} color="#EF4444" />
            <Metric label="Savings" value={fmt(savings)} color={savings >= 0 ? "#FFD700" : "#EF4444"} />
          </View>
          {analysis && (
            <Text style={styles.savingsRate}>
              Savings rate: {savingsRate.toFixed(1)}%
            </Text>
          )}
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            {categoryBreakdown.map((b) => (
              <View key={b.category.id} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={[styles.catDot, { backgroundColor: b.category.color || "#FFD700" }]} />
                    <Text style={styles.catName} numberOfLines={1}>{b.category.name}</Text>
                    {b.category.is_essential && <Text style={styles.essentialBadge}>E</Text>}
                  </View>
                  <Text style={styles.catAmount}>{fmt(b.spent)}</Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(b.percentOfBudget, 100)}%`,
                        backgroundColor: b.isOverBudget ? "#EF4444" : b.category.color || "#FFD700",
                      },
                    ]}
                  />
                </View>
                {b.budget > 0 && (
                  <Text style={styles.barLabel}>
                    {b.percentOfBudget.toFixed(0)}% of {fmt(b.budget)} budget
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Advice */}
        {advice.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Financial Advice</Text>
            {advice.map((a, i) => (
              <View key={i} style={styles.adviceRow}>
                <Text style={styles.adviceBullet}>•</Text>
                <Text style={styles.adviceText}>{a}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MonthNav({ year, month, total, onPrev, onNext }: { year: number; month: number; total: number; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.monthNav}>
      <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
        <ChevronLeft size={20} color="#fff" />
      </TouchableOpacity>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.monthLabel}>{getMonthYear(year, month)}</Text>
        <Text style={styles.monthTotal}>{fmt(total)}</Text>
      </View>
      <TouchableOpacity onPress={onNext} style={styles.navBtn}>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, backgroundColor: "#0f0f1a", alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#EF4444", fontSize: 14, marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#FFD700", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#0f0f1a", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4, textAlign: "center" },
  emptyBody: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 20 },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  monthTotal: { fontSize: 12, color: "#888", marginTop: 2 },

  // Health
  healthCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  ringOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  ringInner: { width: 82, height: 82, borderRadius: 41, borderWidth: 5, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  ringScore: { fontSize: 28, fontWeight: "800", color: "#fff" },
  ringLabel: { fontSize: 10, color: "#888", marginTop: -2 },
  healthRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", marginBottom: 8 },
  metricLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 2 },
  savingsRate: { fontSize: 12, color: "#888" },

  // Cards
  card: { backgroundColor: "#1a1a2e", borderRadius: 16, borderWidth: 1, borderColor: "#2a2a4a", padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },

  // Category breakdown
  catRow: { marginBottom: 14 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  catName: { fontSize: 13, fontWeight: "600", color: "#fff", flex: 1 },
  essentialBadge: { fontSize: 9, color: "#888", backgroundColor: "#2a2a4a", paddingHorizontal: 4, borderRadius: 4, marginLeft: 4, overflow: "hidden" },
  catAmount: { fontSize: 13, fontWeight: "700", color: "#FFD700" },
  barBg: { height: 8, backgroundColor: "#2a2a4a", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10, color: "#666", marginTop: 2 },

  // Advice
  adviceRow: { flexDirection: "row", marginBottom: 8 },
  adviceBullet: { color: "#FFD700", marginRight: 8, fontSize: 14 },
  adviceText: { flex: 1, fontSize: 13, color: "#aaa", lineHeight: 18 },
});