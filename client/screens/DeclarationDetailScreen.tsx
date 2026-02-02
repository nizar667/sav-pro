import React, { useState } from "react";
import { View, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type RouteParams = RouteProp<RootStackParamList, "DeclarationDetail">;

export default function DeclarationDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { user, token } = useAuth();

  const [declaration, setDeclaration] = useState(route.params.declaration);
  const [isLoading, setIsLoading] = useState(false);

  const isTechnician = user?.role === "technicien";
  const canTakeCharge = isTechnician && declaration.status === "nouvelle";
  const canResolve = isTechnician && declaration.status === "en_cours" && declaration.technician_id === user?.id;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTakeCharge = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/declarations/${declaration.id}/take`, baseUrl).href,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const updatedDeclaration = await response.json();
        setDeclaration(updatedDeclaration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("Échec de la prise en charge");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    Alert.alert(
      "Confirmer",
      "Voulez-vous marquer cette déclaration comme réglée ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setIsLoading(true);
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/declarations/${declaration.id}/resolve`, baseUrl).href,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.ok) {
                const updatedDeclaration = await response.json();
                setDeclaration(updatedDeclaration);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                throw new Error("Échec de la résolution");
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erreur", error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor:
              declaration.status === "nouvelle"
                ? theme.primary + "15"
                : declaration.status === "en_cours"
                ? theme.warning + "15"
                : theme.success + "15",
          },
        ]}
      >
        <StatusBadge status={declaration.status} size="medium" />
        <ThemedText
          style={[
            styles.statusText,
            {
              color:
                declaration.status === "nouvelle"
                  ? theme.primary
                  : declaration.status === "en_cours"
                  ? theme.warning
                  : theme.success,
            },
          ]}
        >
          {declaration.status === "nouvelle"
            ? "En attente de prise en charge"
            : declaration.status === "en_cours"
            ? `Pris en charge par ${declaration.technician_name || "un technicien"}`
            : "Problème résolu"}
        </ThemedText>
      </View>

      {declaration.photo_url ? (
        <Image
          source={{ uri: declaration.photo_url }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : null}

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Produit
        </ThemedText>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Feather name="box" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
              Nom du produit
            </ThemedText>
            <ThemedText type="body">{declaration.product_name}</ThemedText>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Feather name="hash" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
              Référence
            </ThemedText>
            <ThemedText type="body">{declaration.reference}</ThemedText>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Feather name="cpu" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
              Numéro de série
            </ThemedText>
            <ThemedText type="body">{declaration.serial_number}</ThemedText>
          </View>
        </View>
        {declaration.category_name ? (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Feather name="tag" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowContent}>
              <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
                Catégorie
              </ThemedText>
              <ThemedText type="body">{declaration.category_name}</ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Client
        </ThemedText>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Feather name="user" size={18} color={theme.secondary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText type="body">{declaration.client_name || "Client inconnu"}</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Description du problème
        </ThemedText>
        <ThemedText style={styles.description}>
          {declaration.description || "Aucune description fournie"}
        </ThemedText>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Historique
        </ThemedText>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
            <View style={styles.timelineContent}>
              <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                Créée le
              </ThemedText>
              <ThemedText>{formatDate(declaration.created_at)}</ThemedText>
            </View>
          </View>
          {declaration.taken_at ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.warning }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                  Prise en charge le
                </ThemedText>
                <ThemedText>{formatDate(declaration.taken_at)}</ThemedText>
              </View>
            </View>
          ) : null}
          {declaration.resolved_at ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.success }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                  Résolue le
                </ThemedText>
                <ThemedText>{formatDate(declaration.resolved_at)}</ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {canTakeCharge ? (
        <Button onPress={handleTakeCharge} disabled={isLoading} style={styles.actionButton}>
          {isLoading ? "Chargement..." : "Prendre en charge"}
        </Button>
      ) : null}

      {canResolve ? (
        <Button onPress={handleResolve} disabled={isLoading} style={styles.actionButton}>
          {isLoading ? "Chargement..." : "Marquer comme réglée"}
        </Button>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    width: 32,
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  timeline: {
    gap: Spacing.md,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  actionButton: {
    marginTop: Spacing.md,
  },
});
