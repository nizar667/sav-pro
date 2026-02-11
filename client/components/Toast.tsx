import React, { useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext"; // AJOUTÉ

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  tMessage?: string; // AJOUTÉ
}

export function Toast({ visible, message, type = "info", duration = 3000, onHide, tMessage }: ToastProps) {
  const { theme } = useTheme();
  const { t } = useLanguage(); // AJOUTÉ
  const opacity = React.useRef(new Animated.Value(0)).current;

  const getConfig = () => {
    switch (type) {
      case "success":
        return { icon: "check-circle", color: theme.success, bgColor: theme.success + "20" };
      case "error":
        return { icon: "alert-circle", color: theme.primary, bgColor: theme.primary + "20" };
      case "warning":
        return { icon: "alert-triangle", color: theme.warning, bgColor: theme.warning + "20" };
      default:
        return { icon: "info", color: theme.secondary, bgColor: theme.secondary + "20" };
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const config = getConfig();
  // Utiliser la traduction si disponible
  const displayMessage = tMessage ? t(tMessage) : message;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.color,
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Feather name={config.icon as any} size={20} color={config.color} />
      <ThemedText style={[styles.message, { color: config.color, marginLeft: 8 }]}>
        {displayMessage}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1001,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});