import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, type Profile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { ChevronLeft, User, LogOut, DollarSign } from "lucide-react-native";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
      setName(p?.full_name || "");
      setSalary(p?.monthly_salary?.toString() || "");
    } catch { /* */ }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!session?.user.id) return;
    setSaving(true);
    try {
      const updates: any = {};
      if (name) updates.full_name = name;
      const salaryNum = parseFloat(salary);
      if (!isNaN(salaryNum)) updates.monthly_salary = salaryNum;
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase.from("profiles").upsert({
        user_id: session.user.id,
        id: profile?.id || session.user.id,
        ...updates,
      });
      if (error) throw error;
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Avatar placeholder */}
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <User size={32} color="#FFD700" />
            </View>
            <Text style={styles.email}>{session?.user?.email || ""}</Text>
          </View>

          <Text style={styles.sectionTitle}>Personal Info</Text>
          <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <Input label="Monthly Salary (₹)" value={salary} onChange={setSalary} placeholder="50000" keyboardType="numeric" />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save Profile"}</Text>
          </TouchableOpacity>

          {/* App info */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>T2 — Think Twice</Text>
            <Text style={styles.aboutBody}>Version 0.1.0 · Build for Android</Text>
            <Text style={styles.aboutBody}>Your data stays private and secure.</Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function Input({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value} onChangeText={onChange}
        placeholder={placeholder || ""} placeholderTextColor="#666"
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#2a2a4a", padding: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  avatarBox: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#2a2a4a", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  email: { fontSize: 13, color: "#666" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#aaa", textTransform: "uppercase", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#888", marginBottom: 6 },
  input: { backgroundColor: "#2a2a4a", borderRadius: 12, borderWidth: 1, borderColor: "#3a3a5a", padding: 14, fontSize: 16, color: "#fff" },

  saveBtn: { backgroundColor: "#FFD700", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  saveText: { fontSize: 16, fontWeight: "700", color: "#0f0f1a" },

  aboutCard: { backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a4a", padding: 16, marginTop: 20, alignItems: "center" },
  aboutTitle: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
  aboutBody: { fontSize: 12, color: "#666", marginTop: 4 },

  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20, paddingVertical: 14 },
  signOutText: { color: "#EF4444", fontSize: 15, fontWeight: "600", marginLeft: 8 },
});