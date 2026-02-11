import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.backgroundRoot + "CC" }]}>
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        {message && (
          <ThemedText style={[styles.message, { color: theme.textSecondary, marginTop: 12 }]}>
            {message}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 150,
    minHeight: 150,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 14,
  },
});