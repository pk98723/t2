import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchCategories, fetchTransactions, createTransaction, deleteTransaction } from "@/lib/data";
import type { Category, Transaction } from "@t2/shared";
import { fmt, getMonthYear } from "@t2/shared";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react-native";

type ViewState = "loading" | "error" | "data";

export default function ExpensesScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [state, setState] = useState<ViewState>("loading");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const load = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true);
    else setState("loading");
    try {
      const [txs, cats] = await Promise.all([
        fetchTransactions(userId, { startDate, endDate }),
        fetchCategories(userId),
      ]);
      setTransactions(txs);
      setCategories(cats);
      setState("data");
    } catch (e: any) {
      setError(e.message || "Failed to load expenses");
      setState("error");
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [userId, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const handleAdd = async () => {
    if (!userId || !formCategory) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert("Invalid amount", "Enter a positive number"); return; }
    setSaving(true);
    try {
      await createTransaction(userId, {
        category_id: formCategory,
        amount,
        description: formDesc || null,
        notes: null,
        transaction_date: new Date().toISOString().split("T")[0],
        is_recurring: false,
        recurring_interval: null,
        tags: null,
      });
      setFormAmount("");
      setFormDesc("");
      setShowModal(false);
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteTransaction(id); load(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
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

  const totalExpenses = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* Month Nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.monthInfo}>
          <Text style={styles.monthLabel}>{getMonthYear(year, month)}</Text>
          <Text style={styles.monthTotal}>{fmt(totalExpenses)}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} refreshing={false} />}
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyBody}>Tap + to add your first expense.</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.category_id);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View style={[styles.txDot, { backgroundColor: cat?.color || "#666" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description || cat?.name || "Expense"}</Text>
                    <Text style={styles.txCat}>{cat?.name || "Unknown"} · {tx.transaction_date}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>{fmt(tx.amount)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.deleteBtn}>
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={24} color="#0f0f1a" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Category Picker */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, formCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setFormCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, formCategory === cat.id && { color: "#fff" }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#666"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grocery shopping"
              placeholderTextColor="#666"
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <TouchableOpacity
              style={[styles.saveBtn, (!formCategory || !formAmount) && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!formCategory || !formAmount || saving}
            >
              <Text style={styles.saveText}>{saving ? "Saving…" : "Add Expense"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, backgroundColor: "#0f0f1a", alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#EF4444", fontSize: 14, marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#FFD700", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#0f0f1a", fontWeight: "700", fontSize: 14 },

  // Month Nav
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
  monthInfo: { alignItems: "center" },
  monthLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  monthTotal: { fontSize: 12, color: "#888", marginTop: 2 },

  // List
  list: { flex: 1 },
  emptyBox: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
  emptyBody: { fontSize: 13, color: "#666" },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 14,
    marginBottom: 8,
  },
  txLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  txDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  txDesc: { fontSize: 14, fontWeight: "600", color: "#fff" },
  txCat: { fontSize: 11, color: "#666", marginTop: 2 },
  txRight: { flexDirection: "row", alignItems: "center" },
  txAmount: { fontSize: 14, fontWeight: "700", color: "#FFD700", marginRight: 8 },
  deleteBtn: { padding: 4 },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#FFD700",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#888", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#2a2a4a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3a3a5a",
    padding: 14,
    fontSize: 16,
    color: "#fff",
  },

  // Category picker
  catPicker: { flexDirection: "row", maxHeight: 40 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3a3a5a",
    marginRight: 8,
    backgroundColor: "#2a2a4a",
  },
  catChipText: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { fontSize: 16, fontWeight: "700", color: "#0f0f1a" },
});