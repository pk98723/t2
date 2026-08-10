import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Zap, AlertTriangle, ShieldCheck } from "lucide-react-native";
import { analyze, fmt, type Verdict } from "@t2/shared";

export default function AnalyzerScreen() {
  const router = useRouter();

  const [salary, setSalary] = useState("");
  const [expenses, setExpenses] = useState("");
  const [savings, setSavings] = useState("");
  const [emi, setEmi] = useState("");
  const [price, setPrice] = useState("");
  const [fundingMode, setFundingMode] = useState<"savings" | "emi">("savings");
  const [result, setResult] = useState<ReturnType<typeof analyze> | null>(null);

  const handleAnalyze = () => {
    const s = parseFloat(salary);
    const e = parseFloat(expenses);
    const sv = parseFloat(savings);
    const em = parseFloat(emi) || 0;
    const p = parseFloat(price);

    if (isNaN(s) || isNaN(e) || isNaN(sv) || isNaN(p)) {
      Alert.alert("Missing fields", "Enter salary, expenses, savings, and item price.");
      return;
    }

    const r = analyze({ salary: s, expenses: e, savings: sv, emi: em, price: p, fundingMode });
    setResult(r);
  };

  const verdictConfig: Record<Verdict, { color: string; bg: string; icon: any; label: string }> = {
    go: { color: "#10B981", bg: "#10B98120", icon: ShieldCheck, label: "Go Ahead" },
    caution: { color: "#F59E0B", bg: "#F59E0B20", icon: AlertTriangle, label: "Think Twice" },
    stop: { color: "#EF4444", bg: "#EF444420", icon: Zap, label: "Don't Buy" },
  };

  const reset = () => {
    setResult(null);
    setSalary(""); setExpenses(""); setSavings(""); setEmi(""); setPrice("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Analyzer</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {result ? (
            /* Result view */
            <View>
              <View style={[styles.resultCard, { backgroundColor: verdictConfig[result.verdict].bg, borderColor: verdictConfig[result.verdict].color }]}>
                <View style={[styles.verdictBadge, { backgroundColor: verdictConfig[result.verdict].color }]}>
                  <Text style={styles.verdictLabel}>{verdictConfig[result.verdict].label}</Text>
                </View>
                <Text style={[styles.headline, { color: verdictConfig[result.verdict].color }]}>{result.headline}</Text>

                <View style={styles.metricsGrid}>
                  <View style={styles.metric}><Text style={styles.metricLbl}>EMI Ratio (Before)</Text><Text style={styles.metricVal}>{result.emiRatioBefore.toFixed(1)}%</Text></View>
                  <View style={styles.metric}><Text style={styles.metricLbl}>EMI Ratio (After)</Text><Text style={styles.metricVal}>{result.emiRatioAfter.toFixed(1)}%</Text></View>
                  <View style={styles.metric}><Text style={styles.metricLbl}>Emergency (Before)</Text><Text style={styles.metricVal}>{result.emergencyMonthsBefore.toFixed(1)}mo</Text></View>
                  <View style={styles.metric}><Text style={styles.metricLbl}>Emergency (After)</Text><Text style={styles.metricVal}>{result.emergencyMonthsAfter.toFixed(1)}mo</Text></View>
                  <View style={styles.metric}><Text style={styles.metricLbl}>Recovery</Text><Text style={styles.metricVal}>{isFinite(result.monthsToRecover) ? `${Math.ceil(result.monthsToRecover)}mo` : "∞"}</Text></View>
                </View>
              </View>

              {/* Coach notes */}
              {result.coachNotes.map((note, i) => (
                <View key={i} style={styles.noteRow}>
                  <Text style={styles.noteBullet}>•</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
                <Text style={styles.primaryText}>Analyze Another</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form view */
            <View>
              <Text style={styles.sectionTitle}>Your Finances</Text>
              <Input label="Monthly Salary (₹)" value={salary} onChange={setSalary} />
              <Input label="Monthly Expenses (₹)" value={expenses} onChange={setExpenses} />
              <Input label="Current Savings (₹)" value={savings} onChange={setSavings} />
              <Input label="Existing EMI (₹) — optional" value={emi} onChange={setEmi} />

              <Text style={styles.sectionTitle}>Purchase</Text>
              <Input label="Item Price (₹)" value={price} onChange={setPrice} />

              <Text style={styles.label}>Funding Mode</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, fundingMode === "savings" && styles.toggleActive]} onPress={() => setFundingMode("savings")}>
                  <Text style={[styles.toggleText, fundingMode === "savings" && styles.toggleActiveText]}>From Savings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, fundingMode === "emi" && styles.toggleActive]} onPress={() => setFundingMode("emi")}>
                  <Text style={[styles.toggleText, fundingMode === "emi" && styles.toggleActiveText]}>EMI</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAnalyze} disabled={!salary || !expenses || !savings || !price}>
                <Text style={styles.primaryText}>Analyze</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholderTextColor="#666" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#aaa", textTransform: "uppercase", marginBottom: 12, marginTop: 8 },
  label: { fontSize: 12, fontWeight: "600", color: "#888", marginBottom: 6 },
  input: { backgroundColor: "#2a2a4a", borderRadius: 12, borderWidth: 1, borderColor: "#3a3a5a", padding: 14, fontSize: 16, color: "#fff" },

  toggleRow: { flexDirection: "row", marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#2a2a4a", marginHorizontal: 4, borderWidth: 1, borderColor: "#3a3a5a" },
  toggleActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#888" },
  toggleActiveText: { color: "#0f0f1a" },

  primaryBtn: { backgroundColor: "#FFD700", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#0f0f1a" },

  // Result
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16, alignItems: "center" },
  verdictBadge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  verdictLabel: { fontSize: 14, fontWeight: "800", color: "#fff", textTransform: "uppercase" },
  headline: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 16 },
  metricsGrid: { width: "100%" },
  metric: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  metricLbl: { fontSize: 13, color: "#888" },
  metricVal: { fontSize: 13, fontWeight: "700", color: "#fff" },

  noteRow: { flexDirection: "row", marginBottom: 10, paddingHorizontal: 4 },
  noteBullet: { color: "#FFD700", marginRight: 8, fontSize: 14 },
  noteText: { flex: 1, fontSize: 13, color: "#aaa", lineHeight: 18 },
});