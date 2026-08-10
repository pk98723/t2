import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Check auth state — redirect to login or tabs
  return <Redirect href="/(tabs)/dashboard" />;
}