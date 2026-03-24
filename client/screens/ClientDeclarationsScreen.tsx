import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { DeclarationCard } from "@/components/DeclarationCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing } from "@/constants/theme";
import { Declaration } from "@/types";
import { getApiUrl } from "@/lib/query-client";

export default function ClientDeclarationsScreen() {
  const { theme } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const params = route.params as { clientId: string; clientName: string };
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeclarations = async () => {
      try {
        const baseUrl = getApiUrl();
        const response = await fetch(new URL("/api/declarations", baseUrl).href, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const filtered = data.filter((d: Declaration) => d.client_id === params.clientId);
        setDeclarations(filtered);
      } catch (error) {
        console.error("Erreur chargement déclarations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeclarations();
  }, [params.clientId, token]);

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
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        data={declarations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeclarationCard
            declaration={item}
            onPress={() => navigation.navigate("DeclarationDetail", { 
              declarationId: item.id 
            })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h3">Déclarations de {params.clientName}</ThemedText>
            <ThemedText style={[styles.count, { color: theme.textSecondary }]}>
              {declarations.length} déclaration{declarations.length > 1 ? "s" : ""}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            source={require("../assets/images/icon.png")}
            title="Aucune déclaration"
            message={`Aucune déclaration trouvée pour ${params.clientName}`}
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
});