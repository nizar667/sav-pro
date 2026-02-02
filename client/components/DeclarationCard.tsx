import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { Declaration } from "@/types";

interface DeclarationCardProps {
  declaration: Declaration;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DeclarationCard({ declaration, onPress }: DeclarationCardProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StatusBadge status={declaration.status} />
          {declaration.category_name ? (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.secondary + "20" },
              ]}
            >
              <ThemedText
                style={[styles.categoryText, { color: theme.secondary }]}
              >
                {declaration.category_name}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
          {formatDate(declaration.created_at)}
        </ThemedText>
      </View>

      <View style={styles.content}>
        {declaration.photo_url ? (
          <Image
            source={{ uri: declaration.photo_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : null}
        <View style={[styles.info, { flex: declaration.photo_url ? undefined : 1 }]}>
          <ThemedText type="h4" numberOfLines={1} style={styles.productName}>
            {declaration.product_name}
          </ThemedText>
          <View style={styles.detailRow}>
            <Feather name="user" size={14} color={theme.textSecondary} />
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {declaration.client_name || "Client inconnu"}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="hash" size={14} color={theme.textSecondary} />
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {declaration.reference}
            </ThemedText>
          </View>
        </View>
      </View>

      {declaration.technician_name && declaration.status !== "nouvelle" ? (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Feather name="tool" size={14} color={theme.secondary} />
          <ThemedText
            style={[styles.technicianText, { color: theme.secondary }]}
          >
            {declaration.technician_name}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
  },
  content: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xs,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    marginBottom: Spacing.xs,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  technicianText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
