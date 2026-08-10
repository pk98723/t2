import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchSavingsGoals, createSavingsGoal, deleteSavingsGoal, addToSavingsGoal } from "@/lib/data-savings";
import { calculateProgress, calculateProjectedCompletion, getCategoryColor, GOAL_CATEGORIES, fmt } from "@t2/shared";
import type { SavingsGoal } from "@t2/shared";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, Target } from "lucide-react-native";

export default function GoalsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCategory, setFormCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  // Add funds
  const [fundGoal, setFundGoal] = useState<SavingsGoal | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const data = await fetchSavingsGoals(session.user.id);
      setGoals(data);
    } catch { /* */ }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!session?.user.id || !formName || !formTarget) return;
    const target = parseFloat(formTarget);
    if (isNaN(target) || target <= 0) { Alert.alert("Invalid", "Enter a target amount > 0"); return; }
    setSaving(true);
    try {
      await createSavingsGoal(session.user.id, {
        name: formName, target_amount: target, current_amount: 0,
        target_date: null, category: formCategory,
        color: getCategoryColor(formCategory),
      });
      setFormName(""); setFormTarget(""); setFormCategory("other"); setShowModal(false);
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
    setSaving(false);
  };

  const handleAddFunds = async () => {
    if (!fundGoal || !fundAmount) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert("Invalid", "Enter a positive amount"); return; }
    try {
      await addToSavingsGoal(fundGoal.id, amt);
      setFundGoal(null); setFundAmount("");
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert("Delete Goal", `Remove "${goal.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteSavingsGoal(goal.id); load(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}><Plus size={22} color="#FFD700" /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {goals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Target size={40} color="#555" />
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyBody}>Tap + to create your first savings goal.</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + "30" }]}>
                      <Target size={18} color={goal.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalCat}>{GOAL_CATEGORIES.find(c => c.value === goal.category)?.label || goal.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(goal)}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: goal.color }]} />
                  </View>
                  <View style={styles.goalStats}>
                    <Text style={styles.goalStat}>{fmt(goal.current_amount)} raised</Text>
                    <Text style={styles.goalStat}>of {fmt(goal.target_amount)}</Text>
                    <Text style={[styles.goalStat, { color: "#FFD700" }]}>{progress}%</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.fundBtn, { borderColor: goal.color }]}
                    onPress={() => { setFundGoal(goal); setFundAmount(""); }}
                  >
                    <Text style={[styles.fundBtnText, { color: goal.color }]}>Add Funds</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ color: "#888", fontSize: 16 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>Goal Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Emergency Fund" placeholderTextColor="#666" value={formName} onChangeText={setFormName} />
            <Text style={styles.label}>Target Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="50000" placeholderTextColor="#666" value={formTarget} onChangeText={setFormTarget} />
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
              {GOAL_CATEGORIES.map((c) => (
                <TouchableOpacity key={c.value} style={[styles.chip, formCategory === c.value && { backgroundColor: getCategoryColor(c.value) }]}
                  onPress={() => setFormCategory(c.value)}>
                  <Text style={[styles.chipText, formCategory === c.value && { color: "#fff" }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={!formName || !formTarget || saving}>
              <Text style={styles.primaryText}>{saving ? "Saving…" : "Create Goal"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Funds Modal */}
      <Modal visible={!!fundGoal} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to {fundGoal?.name}</Text>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="1000" placeholderTextColor="#666" value={fundAmount} onChangeText={setFundAmount} autoFocus />
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: "#2a2a4a" }]} onPress={() => setFundGoal(null)}>
                <Text style={{ color: "#888", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]} onPress={handleAddFunds}>
                <Text style={styles.primaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  emptyBox: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  emptyBody: { fontSize: 13, color: "#666", marginTop: 4, textAlign: "center" },

  goalCard: { backgroundColor: "#1a1a2e", borderRadius: 16, borderWidth: 1, borderColor: "#2a2a4a", padding: 16, marginBottom: 12 },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  goalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  goalName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  goalCat: { fontSize: 11, color: "#666", marginTop: 1 },
  progressBg: { height: 10, backgroundColor: "#2a2a4a", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  goalStats: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  goalStat: { fontSize: 12, color: "#888" },
  fundBtn: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  fundBtnText: { fontWeight: "700", fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a2e", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  label: { fontSize: 12, fontWeight: "600", color: "#888", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#2a2a4a", borderRadius: 12, borderWidth: 1, borderColor: "#3a3a5a", padding: 14, fontSize: 16, color: "#fff" },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#3a3a5a", marginRight: 8, backgroundColor: "#2a2a4a" },
  chipText: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  primaryBtn: { backgroundColor: "#FFD700", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#0f0f1a" },
});