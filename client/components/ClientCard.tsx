import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { Client } from "@/types";

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClientCard({ client, onPress }: ClientCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.avatar, { backgroundColor: theme.secondary + "20" }]}>
        <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>
          {client.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>

      <View style={styles.info}>
        <ThemedText type="h4" numberOfLines={1}>
          {client.name}
        </ThemedText>
        <View style={styles.detailRow}>
          <Feather name="mail" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.detailText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {client.email}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="phone" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.detailText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {client.phone}
          </ThemedText>
        </View>
      </View>

      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  info: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
});
