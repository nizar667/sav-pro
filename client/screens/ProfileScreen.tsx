import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Switch, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type LanguageOption = {
  code: "fr" | "ar";
  name: string;
  flag: string;
  description: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    description: "Langue par défaut"
  },
  {
    code: "ar",
    name: "العربية",
    flag: "🇸🇦",
    description: "اللغة العربية"
  }
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout, token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [notifications, setNotifications] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      t("confirmLogout"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(t("error"), t("logoutError"));
            }
          },
        },
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !token || !user) {
      Alert.alert(t("error"), t("nameRequired"));
      return;
    }

    setIsUpdating(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL(`/api/users/${user.id}`, baseUrl).href, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t("success"), t("nameUpdated"));
        setEditModalVisible(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t("updateFailed"));
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLanguageSelect = (selectedLang: "fr" | "ar") => {
    if (selectedLang === language) {
      setLanguageModalVisible(false);
      return;
    }

    Alert.alert(
      t("changeLanguage"),
      `${t("confirmLanguageChange")} ${selectedLang === "fr" ? "Français" : "العربية"}?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirm"),
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLanguage(selectedLang);
            setLanguageModalVisible(false);
            
            // Message de confirmation
            setTimeout(() => {
              Alert.alert(
                t("success"),
                selectedLang === "fr" 
                  ? "La langue a été changée en Français" 
                  : "تم تغيير اللغة إلى العربية"
              );
            }, 300);
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = () => {
    return user?.role === "commercial" ? theme.primary : theme.secondary;
  };

  const getRoleLabel = () => {
    if (user?.role === "commercial") return t("commercial");
    if (user?.role === "technicien") return t("technician");
    return t("user");
  };

  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => !prev);
  };

  const getCurrentLanguage = () => {
    return LANGUAGE_OPTIONS.find(lang => lang.code === language);
  };

  return (
    <>
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
        {/* EN-TÊTE PROFIL */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor() + "20" }]}>
            <ThemedText style={[styles.avatarText, { color: getRoleBadgeColor() }]}>
              {user?.name.charAt(0).toUpperCase() || "?"}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={styles.name}>
            {user?.name || t("user")}
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

        {/* SECTION MODIFIER PROFIL */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="user" size={20} color={theme.secondary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                {t("profile")}
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {t("managePersonalInfo")}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={styles.profileOption}
            onPress={() => {
              setNewName(user?.name || "");
              setEditModalVisible(true);
            }}
          >
            <View style={styles.profileInfo}>
              <View style={[styles.profileIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="edit-2" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={styles.profileLabel}>
                  {t("editName")}
                </ThemedText>
                <ThemedText style={[styles.profileDesc, { color: theme.textSecondary }]}>
                  {user?.name || t("name")}
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* SECTION LANGUE */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="globe" size={20} color={theme.success} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                {t("language")}
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {t("chooseAppLanguage")}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={styles.languageOption}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.languageInfo}>
              <View style={[styles.languageIcon, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText style={[styles.languageFlag, { color: theme.primary }]}>
                  {getCurrentLanguage()?.flag || "🇫🇷"}
                </ThemedText>
              </View>
              <View style={styles.languageTextContainer}>
                <ThemedText style={styles.languageName}>
                  {getCurrentLanguage()?.name || t("french")}
                </ThemedText>
                <ThemedText style={[styles.languageCode, { color: theme.textSecondary }]}>
                  {getCurrentLanguage()?.description || t("defaultLanguage")}
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* SECTION NOTIFICATIONS */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="bell" size={20} color={theme.warning} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                {t("notifications")}
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {t("receivePushNotifications")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.notificationOption}>
            <View style={styles.notificationInfo}>
              <View style={[styles.notificationIcon, { backgroundColor: theme.secondary + "20" }]}>
                <Feather name="message-square" size={18} color={theme.secondary} />
              </View>
              <View>
                <ThemedText style={styles.notificationLabel}>
                  {t("pushNotifications")}
                </ThemedText>
                <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                  {t("notificationsDescription")}
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={notifications ? theme.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* BOUTON DÉCONNEXION */}
        <View style={styles.logoutContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={() => {
              console.log("🚨 BOUTON DÉCONNEXION CLIQUÉ !");
              handleLogout();
            }}
          >
            <View style={styles.logoutContent}>
              <View style={[styles.logoutIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="log-out" size={20} color={theme.primary} />
              </View>
              <ThemedText style={[styles.logoutText, { color: theme.primary }]}>
                {t("logout").toUpperCase()}
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* VERSION APP */}
        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          SAV Pro v1.0.0
        </ThemedText>
      </KeyboardAwareScrollViewCompat>

      {/* MODAL MODIFICATION NOM */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setEditModalVisible(false)}
        >
          <View style={styles.modalContentContainer}>
            <Pressable 
              style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="h4">{t("editName")}</ThemedText>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t("yourName")}
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                />
              </View>

              <View style={styles.modalButtons}>
                <Button
                  onPress={() => setEditModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={{ color: theme.textSecondary }}>{t("cancel")}</ThemedText>
                </Button>
                
                <Button
                  onPress={handleUpdateName}
                  disabled={isUpdating || !newName.trim()}
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isUpdating ? "..." : t("save")}
                  </ThemedText>
                </Button>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* MODAL SÉLECTION LANGUE */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.languageModalContainer}>
            <Pressable 
              style={[styles.languageModalContent, { backgroundColor: theme.backgroundDefault }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.languageModalHeader}>
                <ThemedText type="h4">{t("selectLanguage")}</ThemedText>
                <Pressable 
                  onPress={() => setLanguageModalVisible(false)}
                  hitSlop={10}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ThemedText style={[styles.languageModalSubtitle, { color: theme.textSecondary }]}>
                {t("choosePreferredLanguage")}
              </ThemedText>

              <View style={styles.languageOptionsList}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.languageOptionItem,
                      {
                        backgroundColor: language === lang.code ? theme.primary + "15" : "transparent",
                        borderColor: language === lang.code ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <View style={styles.languageOptionContent}>
                      <View style={styles.languageOptionLeft}>
                        <View style={[
                          styles.languageOptionFlag,
                          { backgroundColor: theme.primary + "20" }
                        ]}>
                          <ThemedText style={styles.languageOptionFlagText}>
                            {lang.flag}
                          </ThemedText>
                        </View>
                        <View style={styles.languageOptionTexts}>
                          <ThemedText style={[
                            styles.languageOptionName,
                            { color: language === lang.code ? theme.primary : theme.text }
                          ]}>
                            {lang.name}
                          </ThemedText>
                          <ThemedText style={[
                            styles.languageOptionDesc,
                            { color: theme.textSecondary }
                          ]}>
                            {lang.description}
                          </ThemedText>
                        </View>
                      </View>
                      
                      {language === lang.code && (
                        <View style={[
                          styles.languageSelectedIcon,
                          { backgroundColor: theme.primary }
                        ]}>
                          <Feather name="check" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={styles.languageModalButtons}>
                <Button
                  onPress={() => setLanguageModalVisible(false)}
                  style={[styles.languageModalButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={{ color: theme.textSecondary }}>
                    {t("cancel")}
                  </ThemedText>
                </Button>
              </View>
            </Pressable>
          </View>
        </Pressable>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  profileOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  profileLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  profileDesc: {
    fontSize: 12,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  languageIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 13,
  },
  notificationOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  notificationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
  },
  logoutContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontWeight: "600",
    fontSize: 16,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContentContainer: {
    width: "100%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  nameInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  languageModalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  languageModalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  languageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  languageModalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  languageOptionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  languageOptionItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  languageOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  languageOptionFlag: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  languageOptionFlagText: {
    fontSize: 20,
  },
  languageOptionTexts: {
    flex: 1,
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageOptionDesc: {
    fontSize: 12,
  },
  languageSelectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  languageModalButtons: {
    marginTop: Spacing.md,
  },
  languageModalButton: {
    paddingVertical: Spacing.md,
  },
});