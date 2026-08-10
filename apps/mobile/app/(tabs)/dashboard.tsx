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
import { fetchDashboardData, type DashboardData } from "@/lib/data";
import { fmt } from "@t2/shared";

type ViewState = "loading" | "error" | "empty" | "data";

export default function DashboardScreen() {
  const { session } = useAuth();
  const [state, setState] = useState<ViewState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!session?.user.id) return;
    if (isRefresh) setRefreshing(true);
    else setState("loading");
    try {
      const d = await fetchDashboardData(session.user.id);
      setData(d);
      if (d.recentTransactions.length === 0 && !d.profile) {
        setState("empty");
      } else {
        setState("data");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
      setState("error");
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} refreshing={false} />}
      >
        <Text style={styles.emptyTitle}>Welcome to T2</Text>
        <Text style={styles.emptyBody}>
          Add your salary in Profile, then start tracking expenses to see your dashboard.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!data) return null;

  const { profile, healthScore, recentTransactions, upcomingBills } = data;
  const salary = profile?.monthly_salary || 0;
  const monthlyExpenses = recentTransactions.reduce((s, t) => s + t.amount, 0);
  const savings = salary - monthlyExpenses;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} refreshing={false} />}
    >
      {/* Health Score Ring */}
      <View style={styles.healthCard}>
        <View style={styles.ringOuter}>
          <View style={[styles.ringInner, { borderColor: healthScore >= 70 ? "#10B981" : healthScore >= 40 ? "#F59E0B" : "#EF4444" }]}>
            <Text style={styles.ringScore}>{healthScore}</Text>
            <Text style={styles.ringLabel}>Health</Text>
          </View>
        </View>
        {salary > 0 && (
          <View style={styles.healthMetrics}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Income</Text>
              <Text style={styles.metricValue}>{fmt(salary)}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={[styles.metricValue, { color: "#EF4444" }]}>{fmt(monthlyExpenses)}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Savings</Text>
              <Text style={[styles.metricValue, { color: savings >= 0 ? "#10B981" : "#EF4444" }]}>{fmt(savings)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions this month yet.</Text>
        ) : (
          recentTransactions.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle} numberOfLines={1}>{tx.description || "Transaction"}</Text>
                <Text style={styles.rowSub}>{tx.transaction_date}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: "#EF4444" }]}>{fmt(tx.amount)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Bills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recurring Bills</Text>
        {upcomingBills.length === 0 ? (
          <Text style={styles.emptyText}>No recurring bills set up.</Text>
        ) : (
          upcomingBills.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle} numberOfLines={1}>{tx.description || "Recurring"}</Text>
                <Text style={styles.rowSub}>{tx.recurring_interval || "Recurring"}</Text>
              </View>
              <Text style={styles.rowAmount}>{fmt(tx.amount)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0f0f1a", alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#EF4444", fontSize: 14, marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#FFD700", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#0f0f1a", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: "#FFD700", textAlign: "center", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyText: { color: "#666", fontSize: 13, textAlign: "center", padding: 16 },

  // Health card
  healthCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2a2a4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ringInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  ringScore: { fontSize: 32, fontWeight: "800", color: "#fff" },
  ringLabel: { fontSize: 11, color: "#888", marginTop: -2 },
  healthMetrics: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  metricCol: { alignItems: "center" },
  metricLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 2 },

  // Sections
  section: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#fff" },
  rowSub: { fontSize: 11, color: "#666", marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
});