import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import WaitingApprovalScreen from "@/screens/WaitingApprovalScreen"; // ← NOUVEAU
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  WaitingApproval: undefined; // ← NOUVEAU
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerTitle: "Demande d'inscription" }} // ← Changé
      />
      <Stack.Screen
        name="WaitingApproval"
        component={WaitingApprovalScreen}
        options={{ 
          headerTitle: "En attente",
          headerBackTitle: "Retour" 
        }}
      />
    </Stack.Navigator>
  );
}