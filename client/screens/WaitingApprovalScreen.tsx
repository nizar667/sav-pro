import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function WaitingApprovalScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing["4xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="clock" size={60} color={theme.warning} />
        </View>
      </View>

      <ThemedText type="h1" style={styles.title}>
        {t("pendingApproval")}
      </ThemedText>

      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {t("approvalMessage")}
      </ThemedText>

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.infoItem}>
          <Feather name="check-circle" size={20} color={theme.success} />
          <ThemedText style={styles.infoText}>
            {t("informationsSaved")}
          </ThemedText>
        </View>
        
        <View style={styles.infoItem}>
          <Feather name="user-check" size={20} color={theme.warning} />
          <ThemedText style={styles.infoText}>
            {t("adminApproval")}
          </ThemedText>
        </View>
        
        <View style={styles.infoItem}>
          <Feather name="mail" size={20} color={theme.primary} />
          <ThemedText style={styles.infoText}>
            {t("approvalNotification")}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.note, { color: theme.textTertiary }]}>
        {t("approvalTime")}
      </ThemedText>

      <Pressable
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("Login")}
      >
        <ThemedText style={[styles.buttonText, { color: "#FFFFFF" }]}>
          {t("backToLogin")}
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing["2xl"],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
  },
  infoBox: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing["2xl"],
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoText: {
    marginLeft: Spacing.md,
    fontSize: 15,
    flex: 1,
  },
  note: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: Spacing["2xl"],
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});