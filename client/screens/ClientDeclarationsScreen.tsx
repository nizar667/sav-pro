import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Declaration } from "@/types";
import { getApiUrl } from "@/lib/query-client";

export default function ClientDeclarationsScreen() {
  const { theme } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // Sécuriser la récupération des paramètres
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? "";
  const clientName = params?.clientName ?? "?";

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      Alert.alert("Erreur", "Client non trouvé");
      setLoading(false);
      return;
    }

    const fetchDeclarations = async () => {
      try {
        const baseUrl = getApiUrl();
        const response = await fetch(new URL("/api/declarations", baseUrl).href, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const filtered = data.filter((d: Declaration) => d.client_id === clientId);
        setDeclarations(filtered);
      } catch (error) {
        console.error("Erreur chargement déclarations:", error);
        Alert.alert("Erreur", "Impossible de charger les déclarations");
      } finally {
        setLoading(false);
      }
    };

    fetchDeclarations();
  }, [clientId, token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
        <LoadingSpinner message="Chargement des déclarations..." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        data={declarations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => {
              navigation.navigate("DeclarationDetail", { 
                declarationId: item.id 
              });
            }}
          >
            <View style={styles.cardHeader}>
              <StatusBadge status={item.status} size="small" />
              <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
                {formatDate(item.created_at)}
              </ThemedText>
            </View>
            <ThemedText type="body" numberOfLines={1} style={styles.productName}>
              {item.product_name}
            </ThemedText>
            <ThemedText style={[styles.reference, { color: theme.textSecondary }]}>
              {item.reference}
            </ThemedText>
          </Pressable>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h3">Déclarations de {clientName}</ThemedText>
            <ThemedText style={[styles.count, { color: theme.textSecondary }]}>
              {declarations.length} déclaration{declarations.length > 1 ? "s" : ""}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            source={require("../assets/images/icon.png")}
            title="Aucune déclaration"
            message={`Aucune déclaration trouvée pour ${clientName}`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  count: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: 12,
  },
  productName: {
    marginBottom: Spacing.xs,
  },
  reference: {
    fontSize: 12,
  },
});