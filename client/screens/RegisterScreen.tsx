import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();
  const { t } = useLanguage();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("commercial");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = t("fieldRequired");
    }
    
    if (!email.trim()) {
      newErrors.email = t("fieldRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("invalidEmail");
    }
    
    if (!password) {
      newErrors.password = t("fieldRequired");
    } else if (password.length < 6) {
      newErrors.password = t("passwordMinLength");
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t("passwordsDontMatch");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await register(email.trim().toLowerCase(), password, name.trim(), role);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("WaitingApproval");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t("information"), result.message || t("registerSuccess"));
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), error.message || t("registerFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <ThemedText type="h2" style={styles.title}>
        {t("register")}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t("approvalMessage")}
      </ThemedText>

      <View style={styles.roleSelector}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("role")}
        </ThemedText>
        <View style={styles.roleButtons}>
          <Pressable
            style={[
              styles.roleButton,
              {
                backgroundColor:
                  role === "commercial" ? theme.primary : theme.backgroundDefault,
                borderColor: role === "commercial" ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setRole("commercial")}
          >
            <ThemedText
              style={[
                styles.roleButtonText,
                { color: role === "commercial" ? "#FFFFFF" : theme.text },
              ]}
            >
              {t("commercial")}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.roleButton,
              {
                backgroundColor:
                  role === "technicien" ? theme.secondary : theme.backgroundDefault,
                borderColor: role === "technicien" ? theme.secondary : theme.border,
              },
            ]}
            onPress={() => setRole("technicien")}
          >
            <ThemedText
              style={[
                styles.roleButtonText,
                { color: role === "technicien" ? "#FFFFFF" : theme.text },
              ]}
            >
              {t("technician")}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Input
        label={t("fullName")}
        placeholder={t("fullName")}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={errors.name}
      />

      <Input
        label={t("email")}
        placeholder="votre@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />

      <Input
        label={t("password")}
        placeholder={t("password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <Input
        label={t("confirmPassword")}
        placeholder={t("confirmPassword")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={errors.confirmPassword}
      />

      <ThemedText style={[styles.note, { color: theme.textTertiary }]}>
        ⓘ {t("approvalMessage")}. {t("approvalNotification")}
      </ThemedText>

      <Button
        onPress={handleRegister}
        disabled={isLoading}
        style={styles.registerButton}
      >
        {isLoading ? t("loading") : t("registerButton")}
      </Button>

      <View style={styles.footer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          {t("haveAccount")}{" "}
        </ThemedText>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
            {t("login")}
          </ThemedText>
        </Pressable>
      </View>
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
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing["2xl"],
  },
  roleSelector: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  roleButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 13,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  registerButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
});