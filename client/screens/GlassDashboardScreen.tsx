import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { GLASS_SIZES, GLASS_SUPPLIERS } from "@/types";

interface GlassStats {
  [supplier: string]: {
    [size: number]: number;
    total: number;
  };
}

export default function GlassDashboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [stats, setStats] = useState<GlassStats>({});
  const [suppliersList, setSuppliersList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGlassStats = useCallback(async () => {
    if (!token) return;

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/glass-stats", baseUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Initialiser les statistiques
        const newStats: GlassStats = {};
        const suppliers: Set<string> = new Set();
        
        // Initialiser tous les fournisseurs
        GLASS_SUPPLIERS.forEach(supplier => {
          newStats[supplier] = {};
          GLASS_SIZES.forEach(size => {
            newStats[supplier][size] = 0;
          });
          newStats[supplier].total = 0;
          suppliers.add(supplier);
        });
        
        // Remplir avec les données réelles
        data.forEach((item: any) => {
          const supplier = item.glass_supplier;
          const size = item.glass_size;
          if (supplier && size && newStats[supplier]) {
            newStats[supplier][size] = (newStats[supplier][size] || 0) + 1;
            newStats[supplier].total = (newStats[supplier].total || 0) + 1;
          }
        });
        
        // Calculer le total général
        let grandTotal = 0;
        GLASS_SUPPLIERS.forEach(supplier => {
          grandTotal += newStats[supplier].total || 0;
        });
        setTotalCount(grandTotal);
        
        setStats(newStats);
        setSuppliersList(GLASS_SUPPLIERS);
      }
    } catch (error) {
      console.error("Failed to fetch glass stats:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchGlassStats();
  }, [fetchGlassStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGlassStats();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Chargement des statistiques..." />
      </View>
    );
  }

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
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          progressViewOffset={headerHeight}
        />
      }
    >
      {/* EN-TÊTE */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="alert-triangle" size={32} color={theme.warning} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          Tableau de bord verre
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Statistiques des téléviseurs avec verre cassé
        </ThemedText>
      </View>

      {/* RÉSUMÉ */}
      <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault, ...Shadows.medium }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: theme.warning }]}>
              {totalCount}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total TV cassées
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: theme.primary }]}>
              {suppliersList.length}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Fournisseurs
            </ThemedText>
          </View>
        </View>
      </View>

      {/* TABLEAU CROISÉ */}
      {totalCount > 0 ? (
        <View style={[styles.tableContainer, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* En-tête du tableau */}
              <View style={styles.tableHeader}>
                <View style={[styles.cell, styles.firstColumn, { backgroundColor: theme.primary + "10" }]}>
                  <ThemedText style={[styles.headerText, { fontWeight: "bold" }]}>
                    Fournisseur
                  </ThemedText>
                </View>
                {GLASS_SIZES.map((size) => (
                  <View key={size} style={[styles.cell, styles.sizeCell, { backgroundColor: theme.primary + "10" }]}>
                    <ThemedText style={[styles.headerText, { fontWeight: "bold" }]}>
                      {size}"
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.cell, styles.totalCell, { backgroundColor: theme.primary + "10" }]}>
                  <ThemedText style={[styles.headerText, { fontWeight: "bold" }]}>
                    Total
                  </ThemedText>
                </View>
              </View>

              {/* Lignes du tableau */}
              {suppliersList.map((supplier) => (
                <View key={supplier} style={styles.tableRow}>
                  <View style={[styles.cell, styles.firstColumn, { backgroundColor: supplier === "TONY" ? "#FFE0B2" : supplier === "CINDY" ? "#E8F5E9" : "#E3F2FD" }]}>
                    <ThemedText style={styles.supplierName}>{supplier}</ThemedText>
                  </View>
                  {GLASS_SIZES.map((size) => (
                    <View key={size} style={[styles.cell, styles.sizeCell]}>
                      <ThemedText style={styles.cellNumber}>
                        {stats[supplier]?.[size] || 0}
                      </ThemedText>
                    </View>
                  ))}
                  <View style={[styles.cell, styles.totalCell]}>
                    <ThemedText style={[styles.cellNumber, { fontWeight: "bold", color: theme.primary }]}>
                      {stats[supplier]?.total || 0}
                    </ThemedText>
                  </View>
                </View>
              ))}

              {/* Ligne Totaux */}
              <View style={[styles.tableFooter, { borderTopColor: theme.border }]}>
                <View style={[styles.cell, styles.firstColumn, { backgroundColor: theme.secondary + "10" }]}>
                  <ThemedText style={[styles.footerText, { fontWeight: "bold" }]}>
                    TOTAL
                  </ThemedText>
                </View>
                {GLASS_SIZES.map((size) => {
                  const colTotal = suppliersList.reduce((sum, supplier) => sum + (stats[supplier]?.[size] || 0), 0);
                  return (
                    <View key={size} style={[styles.cell, styles.sizeCell]}>
                      <ThemedText style={[styles.cellNumber, { fontWeight: "bold", color: theme.secondary }]}>
                        {colTotal}
                      </ThemedText>
                    </View>
                  );
                })}
                <View style={[styles.cell, styles.totalCell]}>
                  <ThemedText style={[styles.cellNumber, { fontWeight: "bold", color: theme.secondary }]}>
                    {totalCount}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <EmptyState
          source={require("../assets/images/icon.png")}
          title="Aucune donnée"
          message="Aucun téléviseur avec verre cassé n'a été enregistré pour le moment."
        />
      )}

      {/* LÉGENDE */}
      <View style={[styles.legendContainer, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText style={[styles.legendTitle, { color: theme.textSecondary }]}>
          Couleurs par fournisseur :
        </ThemedText>
        <View style={styles.legendRow}>
          <View style={[styles.legendColor, { backgroundColor: "#FFE0B2" }]} />
          <ThemedText>TONY</ThemedText>
          <View style={[styles.legendColor, { backgroundColor: "#E8F5E9", marginLeft: Spacing.md }]} />
          <ThemedText>CINDY</ThemedText>
          <View style={[styles.legendColor, { backgroundColor: "#E3F2FD", marginLeft: Spacing.md }]} />
          <ThemedText>OWEN</ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  
  header: { alignItems: "center", marginBottom: Spacing.sm },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: Spacing.md },
  title: { marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, textAlign: "center" },
  
  summaryCard: { padding: Spacing.lg, borderRadius: BorderRadius.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontSize: 32, fontWeight: "bold", marginBottom: Spacing.xs },
  summaryLabel: { fontSize: 14 },
  
  tableContainer: { borderRadius: BorderRadius.md, overflow: "hidden" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tableFooter: { flexDirection: "row", borderTopWidth: 2, backgroundColor: "#f9f9f9" },
  
  cell: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, justifyContent: "center", alignItems: "center", minWidth: 60 },
  firstColumn: { minWidth: 110, alignItems: "flex-start" },
  sizeCell: { minWidth: 55 },
  totalCell: { minWidth: 65, backgroundColor: "#f5f5f5" },
  
  headerText: { fontSize: 12, textAlign: "center" },
  supplierName: { fontSize: 14, fontWeight: "500" },
  cellNumber: { fontSize: 14, textAlign: "center" },
  footerText: { fontSize: 13, fontWeight: "bold" },
  
  legendContainer: { padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: "center" },
  legendTitle: { fontSize: 12, marginBottom: Spacing.sm },
  legendRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  legendColor: { width: 20, height: 20, borderRadius: 4, marginRight: Spacing.xs },
});