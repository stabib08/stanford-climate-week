import { Redirect } from "expo-router";

// The root navigator in _layout handles real routing; this just points somewhere valid.
export default function Index() {
  return <Redirect href="/(tabs)/events" />;
}
