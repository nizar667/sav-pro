import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { DeclarationStatus } from "@/types";

interface StatusBadgeProps {
  status: DeclarationStatus;
  size?: "small" | "medium" | "large";
}

export function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const getStatusConfig = () => {
    switch (status) {
      case "nouvelle":
        return {
          color: theme.primary,
          backgroundColor: theme.primary + "20",
          text: t("new")
        };
      case "en_cours":
        return {
          color: theme.warning,
          backgroundColor: theme.warning + "20",
          text: t("inProgress")
        };
      case "reglee":
        return {
          color: theme.success,
          backgroundColor: theme.success + "20",
          text: t("resolved")
        };
      default:
        return {
          color: theme.textSecondary,
          backgroundColor: theme.backgroundSecondary,
          text: status
        };
    }
  };

  const config = getStatusConfig();

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        getSizeStyle(),
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.color,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          getSizeStyle(),
          { color: config.color },
        ]}
      >
        {config.text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
  small: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    fontSize: 12,
  },
  large: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});