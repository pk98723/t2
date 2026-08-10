import { Tabs } from "expo-router";
import { View, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#888",
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Overview",
          tabBarLabel: "Overview",
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarLabel: "Expenses",
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarLabel: "Insights",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarLabel: "More",
        }}
      />
    </Tabs>
  );
}