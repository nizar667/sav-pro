import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
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

interface User {
  id: string;
  email: string;
  name: string;
  role: "commercial" | "technicien" | "admin";
  status: "pending" | "active" | "rejected";
  created_at: string;
}

type FilterStatus = "all" | "pending" | "active" | "rejected";
type FilterRole = "all" | "commercial" | "technicien" | "admin";

export default function AllUsersScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    if (!token) return;

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/admin/users", baseUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      Alert.alert("Erreur", "Impossible de charger les utilisateurs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Filtrer les utilisateurs
    let filtered = users;

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Filtre par rôle
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filtre par recherche
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, statusFilter, roleFilter, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: "active" | "rejected") => {
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
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Mettre à jour la liste localement
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
        
        Alert.alert(
          "Succès",
          newStatus === "active" 
            ? "Utilisateur activé avec succès" 
            : "Utilisateur rejeté avec succès"
        );
        
        setIsModalVisible(false);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    }
  };

  const handleRoleChange = async (userId: string, newRole: "commercial" | "technicien") => {
    Alert.alert(
      "Changer le rôle",
      `Voulez-vous changer le rôle de cet utilisateur en ${newRole === "commercial" ? "Commercial" : "Technicien"} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/admin/users/${userId}/role`, baseUrl).href,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ role: newRole }),
                }
              );

              if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                
                setUsers((prevUsers) =>
                  prevUsers.map((user) =>
                    user.id === userId ? { ...user, role: newRole } : user
                  )
                );
                
                Alert.alert("Succès", "Rôle modifié avec succès");
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de modifier le rôle");
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
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return theme.success;
      case "pending": return theme.warning;
      case "rejected": return theme.primary;
      default: return theme.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Actif";
      case "pending": return "En attente";
      case "rejected": return "Rejeté";
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "commercial": return theme.primary;
      case "technicien": return theme.secondary;
      case "admin": return theme.warning;
      default: return theme.textSecondary;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "commercial": return "Commercial";
      case "technicien": return "Technicien";
      case "admin": return "Administrateur";
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Chargement des utilisateurs..." />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
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
        {/* BARRE DE RECHERCHE */}
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher par nom ou email..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* FILTRES */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {/* Filtre Statut */}
              <View style={styles.filterGroup}>
                <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
                  Statut:
                </ThemedText>
                <View style={styles.filterButtons}>
                  {(["all", "pending", "active", "rejected"] as FilterStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor:
                            statusFilter === status ? theme.primary : theme.backgroundSecondary,
                          borderColor: statusFilter === status ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setStatusFilter(status)}
                    >
                      <ThemedText
                        style={[
                          styles.filterButtonText,
                          {
                            color: statusFilter === status ? "#FFFFFF" : theme.text,
                          },
                        ]}
                      >
                        {status === "all" ? "Tous" : getStatusText(status)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Filtre Rôle */}
              <View style={styles.filterGroup}>
                <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
                  Rôle:
                </ThemedText>
                <View style={styles.filterButtons}>
                  {(["all", "commercial", "technicien", "admin"] as FilterRole[]).map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor:
                            roleFilter === role ? theme.secondary : theme.backgroundSecondary,
                          borderColor: roleFilter === role ? theme.secondary : theme.border,
                        },
                      ]}
                      onPress={() => setRoleFilter(role)}
                    >
                      <ThemedText
                        style={[
                          styles.filterButtonText,
                          {
                            color: roleFilter === role ? "#FFFFFF" : theme.text,
                          },
                        ]}
                      >
                        {role === "all" ? "Tous" : getRoleText(role)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* COMPTEUR */}
        <View style={styles.counterContainer}>
          <ThemedText style={{ color: theme.textSecondary }}>
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            Total: {users.length}
          </ThemedText>
        </View>

        {/* LISTE DES UTILISATEURS */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            image={require("../../assets/images/icon.png")}
            title="Aucun utilisateur trouvé"
            message="Ajustez vos filtres ou créez un nouvel utilisateur."
          />
        ) : (
          filteredUsers.map((user) => (
            <Pressable
              key={user.id}
              style={[styles.userCard, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}
              onPress={() => {
                setSelectedUser(user);
                setIsModalVisible(true);
              }}
            >
              <View style={styles.userHeader}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) + "20" }]}>
                    <ThemedText style={[styles.avatarText, { color: getRoleColor(user.role) }]}>
                      {user.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName} numberOfLines={1}>
                    {user.name}
                  </ThemedText>
                  <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </ThemedText>
                  
                  <View style={styles.userTags}>
                    <View style={[styles.tag, { backgroundColor: getRoleColor(user.role) + "20" }]}>
                      <ThemedText style={[styles.tagText, { color: getRoleColor(user.role) }]}>
                        {getRoleText(user.role)}
                      </ThemedText>
                    </View>
                    
                    <View style={[styles.tag, { backgroundColor: getStatusColor(user.status) + "20" }]}>
                      <ThemedText style={[styles.tagText, { color: getStatusColor(user.status) }]}>
                        {getStatusText(user.status)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.userMeta}>
                  <ThemedText style={[styles.dateText, { color: theme.textTertiary }]}>
                    {formatDate(user.created_at)}
                  </ThemedText>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* MODAL DÉTAILS UTILISATEUR */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="h4">Détails utilisateur</ThemedText>
                  <Pressable onPress={() => setIsModalVisible(false)}>
                    <Feather name="x" size={24} color={theme.text} />
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalAvatarContainer}>
                    <View style={[styles.modalAvatar, { backgroundColor: getRoleColor(selectedUser.role) + "20" }]}>
                      <ThemedText style={[styles.modalAvatarText, { color: getRoleColor(selectedUser.role) }]}>
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText type="h3" style={styles.modalUserName}>
                      {selectedUser.name}
                    </ThemedText>
                    <ThemedText style={[styles.modalUserEmail, { color: theme.textSecondary }]}>
                      {selectedUser.email}
                    </ThemedText>
                  </View>

                  <View style={styles.modalDetails}>
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Rôle:
                      </ThemedText>
                      <View style={[styles.detailValue, { backgroundColor: getRoleColor(selectedUser.role) + "20" }]}>
                        <ThemedText style={[styles.detailValueText, { color: getRoleColor(selectedUser.role) }]}>
                          {getRoleText(selectedUser.role)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Statut:
                      </ThemedText>
                      <View style={[styles.detailValue, { backgroundColor: getStatusColor(selectedUser.status) + "20" }]}>
                        <ThemedText style={[styles.detailValueText, { color: getStatusColor(selectedUser.status) }]}>
                          {getStatusText(selectedUser.status)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Créé le:
                      </ThemedText>
                      <ThemedText>
                        {formatDate(selectedUser.created_at)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* ACTIONS */}
                  <View style={styles.modalActions}>
                    {selectedUser.status === "pending" && (
                      <>
                        <Pressable
                          style={[styles.modalActionButton, { backgroundColor: theme.success }]}
                          onPress={() => handleStatusChange(selectedUser.id, "active")}
                        >
                          <Feather name="check" size={18} color="#FFFFFF" />
                          <ThemedText style={styles.modalActionText}>Approuver</ThemedText>
                        </Pressable>

                        <Pressable
                          style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                          onPress={() => handleStatusChange(selectedUser.id, "rejected")}
                        >
                          <Feather name="x" size={18} color="#FFFFFF" />
                          <ThemedText style={styles.modalActionText}>Rejeter</ThemedText>
                        </Pressable>
                      </>
                    )}

                    {selectedUser.status === "active" && selectedUser.role !== "admin" && (
                      <View style={styles.roleActions}>
                        <ThemedText style={[styles.actionLabel, { color: theme.textSecondary }]}>
                          Changer le rôle:
                        </ThemedText>
                        <View style={styles.roleButtons}>
                          {(["commercial", "technicien"] as const).map((role) => (
                            <Pressable
                              key={role}
                              style={[
                                styles.roleButton,
                                {
                                  backgroundColor:
                                    selectedUser.role === role
                                      ? getRoleColor(role)
                                      : getRoleColor(role) + "20",
                                  borderColor: getRoleColor(role),
                                },
                              ]}
                              onPress={() => handleRoleChange(selectedUser.id, role)}
                            >
                              <ThemedText
                                style={[
                                  styles.roleButtonText,
                                  {
                                    color:
                                      selectedUser.role === role
                                        ? "#FFFFFF"
                                        : getRoleColor(role),
                                  },
                                ]}
                              >
                                {getRoleText(role)}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  filtersContainer: {
    marginVertical: Spacing.sm,
  },
  filtersRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  filterGroup: {
    gap: Spacing.sm,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  counterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  userCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {},
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  userTags: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  userMeta: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 11,
    marginBottom: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalBody: {
    gap: Spacing.lg,
  },
  modalAvatarContainer: {
    alignItems: "center",
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: "600",
  },
  modalUserName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalUserEmail: {
    textAlign: "center",
    fontSize: 14,
  },
  modalDetails: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  modalActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  roleActions: {
    gap: Spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
  },
  roleButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});