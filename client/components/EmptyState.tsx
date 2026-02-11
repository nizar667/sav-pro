import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
// import { useLanguage } from "@/contexts/LanguageContext"; // RETIREZ SI NON UTILISÉ

interface EmptyStateProps {
  image: any;
  title: string; // Le titre est déjà passé comme prop
  message: string; // Le message est déjà passé comme prop
}

export function EmptyState({ image, title, message }: EmptyStateProps) {
  const { theme } = useTheme();
  // const { t } = useLanguage(); // RETIREZ SI NON UTILISÉ

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <ThemedText type="h4" style={styles.title}>
        {title} {/* Utilisez directement la prop */}
      </ThemedText>
      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {message} {/* Utilisez directement la prop */}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
  },
});