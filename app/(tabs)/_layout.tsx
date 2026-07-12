import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useRoles } from "@/hooks/useProfile";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B3D2E",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#eee", height: 88, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="events"
        options={{ title: "Events", tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }}
      />
      <Tabs.Screen
        name="my-events"
        options={{ title: "My Events", tabBarIcon: ({ focused }) => <TabIcon emoji="🎟️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: "Inbox", tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
