import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function LoginScreen() {
  const { session, loading, signIn } = useAuth();
  const router = useRouter();

  // If already logged in, go to dashboard
  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)/dashboard");
    }
  }, [session, loading]);

  const handleSignIn = async () => {
    const { error } = await signIn();
    if (error) {
      Alert.alert("Sign In Failed", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>T2</Text>
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>T2</Text>
      <Text style={styles.tagline}>Think Twice. Spend Right.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardBody}>
          Your personal finance decision coach. Analyse purchases, track expenses,
          set savings goals, and take control of your money.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign in with Microsoft</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your data stays private and secure.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: -2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#888",
    marginBottom: 48,
  },
  card: {
    width: "100%",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    padding: 24,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f0f1a",
  },
  footer: {
    marginTop: 16,
    fontSize: 11,
    color: "#666",
  },
});