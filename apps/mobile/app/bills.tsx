import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchTransactions } from "@/lib/data";
import { computeNextOccurrences, getRelativeDueLabel, getIntervalLabel, getDueUrgencyColor, fmt } from "@t2/shared";
import { useRouter } from "expo-router";
import { ChevronLeft, Calendar, Clock, AlertTriangle } from "lucide-react-native";
import type { Transaction } from "@t2/shared";

export default function BillsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const txs = await fetchTransactions(session.user.id, { limit: 100 });
      setRecurring(txs.filter((t) => t.is_recurring));
    } catch { /* ignore */ }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

  // Build projections for the next 30 days
  const now = new Date();
  const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = recurring
    .flatMap((tx) => {
      const dates = computeNextOccurrences(tx.transaction_date, tx.recurring_interval, 12);
      return dates.filter((d) => d >= now && d <= cutoff).map((d) => ({ tx, date: d }));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bills & Recurring</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Upcoming (next 30 days) */}
          <Text style={styles.sectionTitle}>
            <Clock size={14} color="#FFD700" /> Due in next 30 days
          </Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyBox}>
              <Calendar size={32} color="#555" />
              <Text style={styles.emptyTitle}>No upcoming bills</Text>
              <Text style={styles.emptyBody}>Mark expenses as recurring to see them here.</Text>
            </View>
          ) : (
            upcoming.map(({ tx, date }, i) => {
              const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <View key={`${tx.id}_${i}`} style={styles.billRow}>
                  <View style={[styles.urgencyDot, { backgroundColor: diffDays <= 0 ? "#EF4444" : diffDays <= 3 ? "#F59E0B" : "#10B981" }]}>
                    {diffDays <= 0 ? <AlertTriangle size={14} color="#fff" /> : <Text style={styles.urgencyText}>{diffDays}</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.billName}>{tx.description || "Unnamed bill"}</Text>
                    <Text style={styles.billMeta}>{getRelativeDueLabel(date)} · {getIntervalLabel(tx.recurring_interval)}</Text>
                  </View>
                  <Text style={styles.billAmount}>{fmt(tx.amount)}</Text>
                </View>
              );
            })
          )}

          {/* All recurring */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            <Calendar size={14} color="#FFD700" /> All recurring transactions
          </Text>
          {recurring.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No recurring transactions</Text>
            </View>
          ) : (
            recurring.map((tx) => (
              <View key={tx.id} style={styles.recurRow}>
                <Text style={styles.recurName}>{tx.description || "Unnamed"}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{getIntervalLabel(tx.recurring_interval)}</Text></View>
                  <Text style={styles.recurDate}>Next: {new Date(tx.transaction_date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.recurAmount}>{fmt(tx.amount)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#aaa", marginBottom: 12, marginTop: 4 },
  emptyBox: { alignItems: "center", padding: 32, backgroundColor: "#1a1a2e", borderRadius: 16, borderWidth: 1, borderColor: "#2a2a4a" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 8 },
  emptyBody: { fontSize: 13, color: "#666", marginTop: 4, textAlign: "center" },

  billRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a4a", padding: 14, marginBottom: 8 },
  urgencyDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  urgencyText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  billName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  billMeta: { fontSize: 11, color: "#666", marginTop: 2 },
  billAmount: { fontSize: 15, fontWeight: "700", color: "#FFD700" },

  recurRow: { backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a4a", padding: 14, marginBottom: 8 },
  recurName: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  badge: { backgroundColor: "#2a2a4a", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 10, color: "#888", fontWeight: "600", textTransform: "uppercase" },
  recurDate: { fontSize: 11, color: "#666" },
  recurAmount: { fontSize: 15, fontWeight: "700", color: "#FFD700" },
});