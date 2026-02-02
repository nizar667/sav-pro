import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
        },
      },
    ]);
  };

  const getRoleBadgeColor = () => {
    return user?.role === "commercial" ? theme.primary : theme.secondary;
  };

  const getRoleLabel = () => {
    return user?.role === "commercial" ? "Commercial" : "Technicien";
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor() + "20" }]}>
          <ThemedText style={[styles.avatarText, { color: getRoleBadgeColor() }]}>
            {user?.name.charAt(0).toUpperCase() || "?"}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.name}>
          {user?.name || "Utilisateur"}
        </ThemedText>
        <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
          {user?.email}
        </ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() + "20" }]}>
          <Feather
            name={user?.role === "commercial" ? "briefcase" : "tool"}
            size={14}
            color={getRoleBadgeColor()}
          />
          <ThemedText style={[styles.roleText, { color: getRoleBadgeColor() }]}>
            {getRoleLabel()}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Compte
        </ThemedText>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="user" size={18} color={theme.secondary} />
            </View>
            <ThemedText>Modifier le profil</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="lock" size={18} color={theme.primary} />
            </View>
            <ThemedText>Changer le mot de passe</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Préférences
        </ThemedText>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="bell" size={18} color={theme.warning} />
            </View>
            <ThemedText>Notifications</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="globe" size={18} color={theme.success} />
            </View>
            <ThemedText>Langue</ThemedText>
          </View>
          <View style={styles.menuItemRight}>
            <ThemedText style={{ color: theme.textSecondary }}>Français</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </Pressable>
      </View>

      <Pressable
        style={[styles.logoutButton, { backgroundColor: theme.primary + "15" }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color={theme.primary} />
        <ThemedText style={[styles.logoutText, { color: theme.primary }]}>
          Se déconnecter
        </ThemedText>
      </Pressable>

      <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
        SAV Pro v1.0.0
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
  },
  name: {
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
  },
});
