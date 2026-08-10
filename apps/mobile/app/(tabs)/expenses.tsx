import { View, Text, StyleSheet } from "react-native";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expenses</Text>
      <Text style={styles.subtitle}>WS-2: Add transactions, category picker, month nav</Text>
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
  title: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888" },
});