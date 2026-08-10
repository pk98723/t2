import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import {
  PiggyBank,
  Target,
  Calculator,
  Clock,
  User,
  CreditCard,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { Alert } from "react-native";

const links = [
  { label: "Categories", icon: PiggyBank, route: "/categories", color: "#EC4899" },
  { label: "Bills & Recurring", icon: CreditCard, route: "/bills", color: "#3B82F6" },
  { label: "Savings Goals", icon: Target, route: "/goals", color: "#10B981" },
  { label: "Purchase Analyzer", icon: Calculator, route: "/analyzer", color: "#F59E0B" },
  { label: "Decision History", icon: Clock, route: "/history", color: "#8B5CF6" },
  { label: "Profile", icon: User, route: "/profile", color: "#FFD700" },
];

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {links.map((link) => (
        <TouchableOpacity
          key={link.route}
          style={styles.row}
          onPress={() => router.push(link.route as any)}
        >
          <View style={[styles.iconBox, { backgroundColor: link.color + "20" }]}>
            <link.icon size={20} color={link.color} />
          </View>
          <Text style={styles.label}>{link.label}</Text>
          <ChevronRight size={18} color="#555" />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.row, { marginTop: 20 }]} onPress={handleSignOut}>
        <View style={[styles.iconBox, { backgroundColor: "#EF444420" }]}>
          <LogOut size={20} color="#EF4444" />
        </View>
        <Text style={[styles.label, { color: "#EF4444" }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 16,
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: "#fff" },
});