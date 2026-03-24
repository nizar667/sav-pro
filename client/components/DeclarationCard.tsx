import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { BorderRadius, Spacing } from "@/constants/theme";
import { Declaration } from "@/types";

interface DeclarationCardProps {
  declaration: Declaration;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DeclarationCard({ declaration, onPress }: DeclarationCardProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t("today") || "Aujourd'hui";
    } else if (diffDays === 1) {
      return t("yesterday") || "Hier";
    } else if (diffDays < 7) {
      return t("daysAgo", { days: diffDays }) || `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // ✅ Fonction pour déterminer la couleur de la bordure gauche
  const getBorderColor = () => {
    switch (declaration.status) {
      case "nouvelle":
        return theme.primary;
      case "en_cours":
        return theme.warning;
      case "reglee":
        return theme.success;
      case "sortie":
        return "#9C27B0"; // Violet
      default:
        return theme.border;
    }
  };

  // ✅ Vérifier si des accessoires sont cochés
  const hasCheckedAccessories = declaration.accessories?.some(item => item.checked) || false;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { 
          backgroundColor: theme.backgroundDefault,
          borderLeftWidth: 3,
          borderLeftColor: getBorderColor(),
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Ligne 1: Statut + Date + Indicateur accessoires */}
      <View style={styles.topRow}>
        <StatusBadge status={declaration.status} size="small" />
        <View style={styles.rightContainer}>
          {hasCheckedAccessories && (
            <View style={[styles.accessoryIndicator, { backgroundColor: theme.secondary }]}>
              <Feather name="package" size={8} color="#FFFFFF" />
            </View>
          )}
          <ThemedText style={[styles.date, { color: "#FFFFFF" }]}>
            {formatDate(declaration.created_at)}
          </ThemedText>
        </View>
      </View>

      {/* Ligne 2: Nom produit */}
      <ThemedText 
        type="body" 
        numberOfLines={1} 
        style={[styles.productName, { color: theme.text }]}
      >
        {declaration.product_name}
      </ThemedText>

      {/* Ligne 3: Client */}
      <View style={styles.infoRow}>
        <Feather name="user" size={12} color="#FFFFFF" />
        <ThemedText
          style={[styles.infoText, { color: "#FFFFFF" }]}
          numberOfLines={1}
        >
          {declaration.client?.name || t("unknownClient") || "Client inconnu"}
        </ThemedText>
      </View>

      {/* Ligne 4: Commercial */}
      {declaration.commercial?.name && (
        <View style={styles.infoRow}>
          <Feather name="user-check" size={12} color={theme.primary} />
          <ThemedText
            style={[styles.infoText, { color: theme.primary }]}
            numberOfLines={1}
          >
            {declaration.commercial.name}
          </ThemedText>
        </View>
      )}

      {/* Ligne 5: Technicien (si présent) */}
      {declaration.technician?.name && declaration.status !== "nouvelle" && (
        <View style={styles.infoRow}>
          <Feather name="tool" size={12} color={theme.secondary} />
          <ThemedText
            style={[styles.infoText, { color: theme.secondary }]}
            numberOfLines={1}
          >
            {declaration.technician.name}
          </ThemedText>
        </View>
      )}

      {/* Ligne 6: Référence + S/N */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="hash" size={10} color={theme.textSecondary} />
          <ThemedText 
            style={[styles.detailText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {declaration.reference}
          </ThemedText>
        </View>
        
        <View style={styles.detailItem}>
          <Feather name="cpu" size={10} color={theme.textSecondary} />
          <ThemedText 
            style={[styles.detailText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {declaration.serial_number}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accessoryIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  date: {
    fontSize: 11,
    fontWeight: "500",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  detailText: {
    fontSize: 11,
  },
});