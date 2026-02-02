import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import DeclarationDetailScreen from "@/screens/DeclarationDetailScreen";
import NewDeclarationScreen from "@/screens/NewDeclarationScreen";
import NewClientScreen from "@/screens/NewClientScreen";
import ClientDetailScreen from "@/screens/ClientDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Declaration, Client } from "@/types";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DeclarationDetail: { declaration: Declaration };
  NewDeclaration: undefined;
  NewClient: undefined;
  ClientDetail: { client: Client };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DeclarationDetail"
            component={DeclarationDetailScreen}
            options={{ headerTitle: "Détails" }}
          />
          <Stack.Screen
            name="NewDeclaration"
            component={NewDeclarationScreen}
            options={{
              presentation: "modal",
              headerTitle: "Nouvelle déclaration",
            }}
          />
          <Stack.Screen
            name="NewClient"
            component={NewClientScreen}
            options={{
              presentation: "modal",
              headerTitle: "Nouveau client",
            }}
          />
          <Stack.Screen
            name="ClientDetail"
            component={ClientDetailScreen}
            options={{ headerTitle: "Client" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
