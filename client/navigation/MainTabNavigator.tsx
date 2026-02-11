import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import DeclarationsStackNavigator from "@/navigation/DeclarationsStackNavigator";
import ClientsStackNavigator from "@/navigation/ClientsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import IDEntryScreen from "@/screens/IDEntryScreen"; // IMPORT NOUVEAU
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

export type MainTabParamList = {
  DeclarationsTab: undefined;
  ClientsTab: undefined;
  ProfileTab: undefined;
  AdminTab: undefined;
  IDEntryTab: undefined; // NOUVEAU
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const isCommercial = user?.role === "commercial";
  const isAdmin = user?.role === "admin";
  const isTechnician = user?.role === "technicien";

  return (
    <Tab.Navigator
      initialRouteName="DeclarationsTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      {/* ONGLET DÉCLARATIONS - Toujours visible */}
      <Tab.Screen
        name="DeclarationsTab"
        component={DeclarationsStackNavigator}
        options={{
          title: "Déclarations",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      
      {/* ONGLET CLIENTS - Seulement pour commerciaux */}
      {isCommercial ? (
        <Tab.Screen
          name="ClientsTab"
          component={ClientsStackNavigator}
          options={{
            title: "Clients",
            tabBarIcon: ({ color, size }) => (
              <Feather name="users" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      
      {/* ONGLET SAISIR ID - Pour commerciaux ET techniciens */}
      {(isTechnician || isCommercial) ? (
        <Tab.Screen
          name="IDEntryTab"
          component={IDEntryScreen}
          options={{
            title: "Saisir ID",
            tabBarIcon: ({ color, size }) => (
              <Feather name="hash" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      
      {/* ONGLET ADMIN - Seulement pour admins */}
      {isAdmin ? (
        <Tab.Screen
          name="AdminTab"
          component={AdminDashboardScreen}
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => (
              <Feather name="shield" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      
      {/* ONGLET PROFIL - Toujours visible */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Styles si nécessaires
});