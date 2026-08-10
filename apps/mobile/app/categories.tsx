import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchCategories } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Category } from "@t2/shared";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, Edit3 } from "lucide-react-native";

const DEFAULT_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#FFD700", "#14B8A6"];

export default function CategoriesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_COLORS[0]);
  const [formEssential, setFormEssential] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try { setCategories(await fetchCategories(session.user.id)); }
    catch { /* */ }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setFormName(""); setFormBudget(""); setFormColor(DEFAULT_COLORS[0]); setFormEssential(false); setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat); setFormName(cat.name); setFormBudget(cat.monthly_budget?.toString() || "");
    setFormColor(cat.color); setFormEssential(cat.is_essential); setShowModal(true);
  };

  const handleSave = async () => {
    if (!session?.user.id || !formName) return;
    setSaving(true);
    try {
      const payload = {
        name: formName,
        monthly_budget: parseFloat(formBudget) || 0,
        color: formColor,
        is_essential: formEssential,
        icon: "circle",
        description: null,
      };
      if (editing) {
        await supabase.from("categories").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("categories").insert({ user_id: session.user.id, ...payload });
      }
      setShowModal(false); load();
    } catch (e: any) { Alert.alert("Error", e.message); }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this category?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await supabase.from("categories").delete().eq("id", id); load(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={openCreate}><Plus size={22} color="#FFD700" /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {categories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No categories</Text>
              <Text style={styles.emptyBody}>Create categories to organize your expenses.</Text>
            </View>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    {cat.is_essential && <Text style={styles.essentialBadge}>Essential</Text>}
                  </View>
                  {cat.monthly_budget > 0 && <Text style={styles.catBudget}>Budget: ₹{Math.round(cat.monthly_budget).toLocaleString("en-IN")}</Text>}
                </View>
                <TouchableOpacity onPress={() => openEdit(cat)} style={{ padding: 6 }}><Edit3 size={16} color="#888" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(cat.id)} style={{ padding: 6 }}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? "Edit" : "New"} Category</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="e.g. Food & Groceries" placeholderTextColor="#666" />
            <Text style={styles.label}>Monthly Budget (₹) — optional</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formBudget} onChangeText={setFormBudget} placeholder="0" placeholderTextColor="#666" />
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
              {DEFAULT_COLORS.map((c) => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, formColor === c && styles.colorActive]} onPress={() => setFormColor(c)} />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.essentialRow} onPress={() => setFormEssential(!formEssential)}>
              <View style={[styles.checkbox, formEssential && { backgroundColor: "#FFD700" }]}>
                {formEssential && <Text style={{ color: "#0f0f1a", fontSize: 12, fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={styles.essentialLabel}>Essential category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={!formName || saving}>
              <Text style={styles.primaryText}>{saving ? "Saving…" : editing ? "Update" : "Create"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  emptyBody: { fontSize: 13, color: "#666", marginTop: 4 },

  catRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a4a", padding: 14, marginBottom: 8 },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  essentialBadge: { fontSize: 9, color: "#888", backgroundColor: "#2a2a4a", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, overflow: "hidden" },
  catBudget: { fontSize: 12, color: "#666", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a2e", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#888", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#2a2a4a", borderRadius: 12, borderWidth: 1, borderColor: "#3a3a5a", padding: 14, fontSize: 16, color: "#fff" },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  colorActive: { borderWidth: 3, borderColor: "#fff" },
  essentialRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#666", alignItems: "center", justifyContent: "center", marginRight: 10 },
  essentialLabel: { fontSize: 14, color: "#aaa" },
  primaryBtn: { backgroundColor: "#FFD700", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#0f0f1a" },
});