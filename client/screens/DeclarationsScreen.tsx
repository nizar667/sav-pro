import React, { useState, useCallback } from "react";
import { FlatList, RefreshControl, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing } from "@/constants/theme";
import { DeclarationCard } from "@/components/DeclarationCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FAB } from "@/components/FAB";
import { ThemedText } from "@/components/ThemedText";
import { Declaration, DeclarationStatus } from "@/types";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type FilterStatus = "all" | DeclarationStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "nouvelle", label: "Nouvelles" },
  { key: "en_cours", label: "En cours" },
  { key: "reglee", label: "Réglées" },
];

export default function DeclarationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token } = useAuth();

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const fetchDeclarations = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/declarations", baseUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeclarations(data);
      }
    } catch (error) {
      console.error("Failed to fetch declarations:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchDeclarations();
    }, [fetchDeclarations])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeclarations();
  };

  const filteredDeclarations = declarations.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  const isCommercial = user?.role === "commercial";

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
        data={filteredDeclarations}
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
          <View style={styles.filterContainer}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      filter === f.key ? theme.primary : theme.backgroundDefault,
                    borderColor: filter === f.key ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFilter(f.key)}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    { color: filter === f.key ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {f.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            image={require("../../assets/images/empty-declarations.png")}
            title="Aucune déclaration"
            message={
              isCommercial
                ? "Appuyez sur + pour créer votre première déclaration"
                : "Les déclarations des commerciaux apparaîtront ici"
            }
          />
        }
      />
      
      {isCommercial ? (
        <FAB
          onPress={() => navigation.navigate("NewDeclaration")}
          bottom={tabBarHeight + Spacing.lg}
        />
      ) : null}
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
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
