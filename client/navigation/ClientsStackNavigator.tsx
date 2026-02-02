import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientsScreen from "@/screens/ClientsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ClientsStackParamList = {
  ClientsList: undefined;
};

const Stack = createNativeStackNavigator<ClientsStackParamList>();

export default function ClientsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ClientsList"
        component={ClientsScreen}
        options={{ headerTitle: "Clients" }}
      />
    </Stack.Navigator>
  );
}
