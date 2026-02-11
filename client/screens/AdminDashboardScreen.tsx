import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AllUsers">;

interface AdminStats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
  commercials: number;
  technicians: number;
  admins: number;
}

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: "commercial" | "technicien";
  status: "pending";
  created_at: string;
}

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!token) return;

    try {
      const baseUrl = getApiUrl();

      // Récupérer les statistiques
      const statsResponse = await fetch(
        new URL("/api/admin/stats", baseUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Récupérer les utilisateurs en attente
      const pendingResponse = await fetch(
        new URL("/api/admin/users/pending", baseUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingUsers(pendingData);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    Alert.alert(
      "Approuver l'utilisateur",
      `Voulez-vous approuver ${userName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Approuver",
          style: "default",
          onPress: async () => {
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/admin/users/${userId}/status`, baseUrl).href,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: "active" }),
                }
              );

              if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Succès", "Utilisateur approuvé avec succès");
                fetchAdminData();
              } else {
                const error = await response.json();
                throw new Error(error.message);
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erreur", error.message || "Échec de l'approbation");
            }
          },
        },
      ]
    );
  };

  const handleRejectUser = async (userId: string, userName: string) => {
    Alert.alert(
      "Rejeter l'utilisateur",
      `Voulez-vous rejeter ${userName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Rejeter",
          style: "destructive",
          onPress: async () => {
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/admin/users/${userId}/status`, baseUrl).href,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: "rejected" }),
                }
              );

              if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Succès", "Utilisateur rejeté");
                fetchAdminData();
              } else {
                const error = await response.json();
                throw new Error(error.message);
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erreur", error.message || "Échec du rejet");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Chargement du tableau de bord..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing["3xl"],  // ou Spacing["3xl"] pour encore plus bas // MODIFIÉ: plus petit padding en haut
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
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
    // REMPLACE PAR CE CODE (sans le badge) :
<View style={styles.header}>
  <ThemedText type="h2" style={styles.title}>
    Tableau de bord
  </ThemedText>
  <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
    Gestion des utilisateurs et statistiques
  </ThemedText>
</View>

      {/* BOUTON TOUS LES UTILISATEURS */}
      <Pressable
        style={[styles.allUsersButton, { backgroundColor: theme.secondary }]}
        onPress={() => navigation.navigate("AllUsers")}
      >
        <Feather name="users" size={20} color="#FFFFFF" />
        <ThemedText style={styles.allUsersButtonText}>
          Voir tous les utilisateurs
        </ThemedText>
        <Feather name="chevron-right" size={20} color="#FFFFFF" />
      </Pressable>

      {/* STATISTIQUES */}
      {stats && (
        <View style={[styles.statsSection, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
          <View style={styles.statsHeader}>
            <Feather name="bar-chart-2" size={20} color={theme.primary} />
            <ThemedText type="h4">Statistiques</ThemedText>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.primary + "10" }]}>
              <ThemedText style={[styles.statNumber, { color: theme.primary }]}>
                {stats.total}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.warning + "10" }]}>
              <ThemedText style={[styles.statNumber, { color: theme.warning }]}>
                {stats.pending}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                En attente
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.success + "10" }]}>
              <ThemedText style={[styles.statNumber, { color: theme.success }]}>
                {stats.active}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Actifs
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* UTILISATEURS EN ATTENTE */}
      <View style={[styles.pendingSection, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <View style={styles.sectionHeader}>
          <Feather name="clock" size={20} color={theme.warning} />
          <View style={styles.sectionTitleContainer}>
            <ThemedText type="h4">Demandes en attente</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              {pendingUsers.length} demande(s) à traiter
            </ThemedText>
          </View>
        </View>

        {pendingUsers.length === 0 ? (
          <EmptyState
            image={require("../../assets/images/icon.png")}
            title="Aucune demande en attente"
            message="Toutes les demandes ont été traitées."
          />
        ) : (
          pendingUsers.map((pendingUser) => (
            <View
              key={pendingUser.id}
              style={[styles.pendingCard, { backgroundColor: theme.backgroundSecondary }]}
            >
              <View style={styles.pendingHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: theme.secondary + "20" }]}>
                    <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>
                      {pendingUser.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.userDetails}>
                    <ThemedText style={styles.userName}>{pendingUser.name}</ThemedText>
                    <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
                      {pendingUser.email}
                    </ThemedText>
                    <View style={styles.userMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              pendingUser.role === "commercial"
                                ? theme.primary + "20"
                                : theme.secondary + "20",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.roleText,
                            {
                              color:
                                pendingUser.role === "commercial"
                                  ? theme.primary
                                  : theme.secondary,
                            },
                          ]}
                        >
                          {pendingUser.role === "commercial" ? "Commercial" : "Technicien"}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.dateText, { color: theme.textTertiary }]}>
                        {formatDate(pendingUser.created_at)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: theme.success }]}
                  onPress={() => handleApproveUser(pendingUser.id, pendingUser.name)}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Approuver</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleRejectUser(pendingUser.id, pendingUser.name)}
                >
                  <Feather name="x" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Rejeter</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* INFORMATIONS */}
      <View style={[styles.infoSection, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={20} color={theme.secondary} />
          <ThemedText type="h4">Informations</ThemedText>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Les utilisateurs approuvés peuvent se connecter immédiatement
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <Feather name="x-circle" size={16} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Les utilisateurs rejetés ne pourront plus se connecter
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <Feather name="refresh-cw" size={16} color={theme.secondary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Tirez pour actualiser la liste
            </ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md, // MODIFIÉ: plus petit gap
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.md, // MODIFIÉ: plus petit margin
    marginTop: Spacing.xs, // AJOUTÉ: espace en haut
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm, // MODIFIÉ: plus petit
  },
  adminText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    marginBottom: Spacing.xs,
    fontSize: 24, // MODIFIÉ: plus petit
  },
  subtitle: {
    fontSize: 14,
  },
  allUsersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  allUsersButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsSection: {
    padding: Spacing.md, // MODIFIÉ: plus petit padding
    borderRadius: BorderRadius.md,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md, // MODIFIÉ: plus petit
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  statNumber: {
    fontSize: 22, // MODIFIÉ: plus petit
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  pendingSection: {
    padding: Spacing.md, // MODIFIÉ: plus petit
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md, // MODIFIÉ: plus petit
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pendingCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  pendingHeader: {
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  avatar: {
    width: 44, // MODIFIÉ: plus petit
    height: 44, // MODIFIÉ: plus petit
    borderRadius: 22, // MODIFIÉ: plus petit
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16, // MODIFIÉ: plus petit
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15, // MODIFIÉ: plus petit
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  infoSection: {
    padding: Spacing.md, // MODIFIÉ: plus petit
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoList: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});