import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { DeclarationStatus } from "@/types";

interface StatusBadgeProps {
  status: DeclarationStatus;
  size?: "small" | "medium";
}

export function StatusBadge({ status, size = "small" }: StatusBadgeProps) {
  const { theme } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case "nouvelle":
        return {
          label: "Nouvelle",
          backgroundColor: theme.primary + "20",
          textColor: theme.primary,
        };
      case "en_cours":
        return {
          label: "En cours",
          backgroundColor: theme.warning + "20",
          textColor: theme.warning,
        };
      case "reglee":
        return {
          label: "Réglée",
          backgroundColor: theme.success + "20",
          textColor: theme.success,
        };
      default:
        return {
          label: status,
          backgroundColor: theme.backgroundSecondary,
          textColor: theme.textSecondary,
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? Spacing.xs : Spacing.sm,
        },
      ]}
    >
      <ThemedText
        style={[
          isSmall ? styles.textSmall : styles.textMedium,
          { color: config.textColor },
        ]}
      >
        {config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  textSmall: {
    fontSize: 12,
    fontWeight: "600",
  },
  textMedium: {
    fontSize: 14,
    fontWeight: "600",
  },
});
