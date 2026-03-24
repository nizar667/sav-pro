import React, { useState, useCallback } from "react";
import { FlatList, RefreshControl, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";
import { DeclarationCard } from "@/components/DeclarationCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemedText } from "@/components/ThemedText";
import { Declaration } from "@/types";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type RouteParams = {
  clientId: string;
  clientName: string;
};

export default function ClientDeclarationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { clientId, clientName } = route.params as RouteParams;
  const { token } = useAuth();

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDeclarations = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/declarations", baseUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((d: Declaration) => d.client_id === clientId);
        setDeclarations(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch declarations:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, clientId]);

  useFocusEffect(
    useCallback(() => {
      fetchDeclarations();
    }, [fetchDeclarations])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeclarations();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Chargement des déclarations..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={declarations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeclarationCard
            declaration={item}
            onPress={() => navigation.navigate("DeclarationDetail", { declaration: item })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            progressViewOffset={headerHeight}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h3" style={styles.title}>
              Déclarations de {clientName}
            </ThemedText>
            <ThemedText style={[styles.count, { color: theme.textSecondary }]}>
              {declarations.length} déclaration(s)
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
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  count: {
    fontSize: 14,
  },
});