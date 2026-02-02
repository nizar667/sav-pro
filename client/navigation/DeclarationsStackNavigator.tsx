import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeclarationsScreen from "@/screens/DeclarationsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type DeclarationsStackParamList = {
  DeclarationsList: undefined;
};

const Stack = createNativeStackNavigator<DeclarationsStackParamList>();

export default function DeclarationsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DeclarationsList"
        component={DeclarationsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Déclarations" />,
        }}
      />
    </Stack.Navigator>
  );
}
