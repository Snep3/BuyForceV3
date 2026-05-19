import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import CustomHeader from "../../components/CustomHeader";
import { getTheme } from "../../src/theme";

export default function TabLayout() {
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const isDark = useStore((state) => state.isDark);
  const t = getTheme(isDark);
  const router = useRouter();

  const guardTabPress = (e: any) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push("/(auth)/login");
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#228be6",
        tabBarInactiveTintColor: isDark ? "#5a5e6a" : "gray",
        header: () => <CustomHeader />,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.tabBorder,
        },
        tabBarLabelStyle: { color: isDark ? t.subtext : undefined },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: guardTabPress }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: guardTabPress }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: "My Groups",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: guardTabPress }}
      />

      {/* Keep profile routable but off the tab bar */}
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}
