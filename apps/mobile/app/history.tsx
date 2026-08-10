import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchDecisions, type Decision } from "@/lib/data-decisions";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock, ShieldCheck, AlertTriangle, Zap, fmt as fmtFn } from "lucide-react-native";

const verdictIcon = (v: string) => {
  switch (v) {
    case "go": return { icon: ShieldCheck, color: "#10B981", label: "Go" };
    case "caution": return { icon: AlertTriangle, color: "#F59E0B", label: "Caution" };
    case "stop": return { icon: Zap, color: "#EF4444", label: "Stop" };
    default: return { icon: Clock, color: "#888", label: "?" };
  }
};

export default function HistoryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try { setDecisions(await fetchDecisions(session.user.id)); }
    catch { /* */ }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Decision History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : decisions.length === 0 ? (
        <View style={styles.center}>
          <Clock size={40} color="#555" />
          <Text style={styles.emptyTitle}>No decisions yet</Text>
          <Text style={styles.emptyBody}>Use the Purchase Analyzer and save decisions to see them here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {decisions.map((d) => {
            const v = verdictIcon(d.verdict);
            return (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.verdictDot, { backgroundColor: v.color }]}>
                    <v.icon size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemName}>{d.item_name}</Text>
                    <Text style={styles.date}>{new Date(d.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.verdictText, { color: v.color }]}>{v.label}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>Price: ₹{Math.round(d.price).toLocaleString("en-IN")}</Text>
                  <Text style={styles.meta}>Funding: {d.funding_mode}</Text>
                  <Text style={styles.meta}>EMI: {d.emi_ratio_after.toFixed(0)}%</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  emptyBody: { fontSize: 13, color: "#666", marginTop: 4, textAlign: "center", lineHeight: 20 },

  card: { backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a4a", padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  verdictDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  date: { fontSize: 11, color: "#666", marginTop: 1 },
  verdictText: { fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  metaRow: { flexDirection: "row", marginTop: 10, gap: 12 },
  meta: { fontSize: 12, color: "#888" },
});