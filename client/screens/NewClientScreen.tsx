import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function NewClientScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid = name.trim();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>{t("cancel")}</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSubmit} disabled={!isValid || isLoading}>
          <ThemedText
            style={{
              color: isValid && !isLoading ? theme.primary : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            {isLoading ? "..." : t("create")}
          </ThemedText>
        </HeaderButton>
      ),
      headerTitle: t("newClient"),
    });
  }, [navigation, theme, isValid, isLoading, name, email, phone, address, t]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t("fieldRequired");
    
    // Email optionnel mais doit être valide SI fourni
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("invalidEmail");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/clients", baseUrl).href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase() || "",
          phone: phone.trim() || "",
          address: address.trim() || "",
        }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        const error = await response.json();
        throw new Error(error.message || t("operationFailed"));
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), error.message);
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
      <Input
        label={`${t("clientName")} *`}
        placeholder={t("clientName")}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={errors.name}
      />

      <Input
        label={t("email")}
        placeholder="votre@email.com (optionnel)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />

      <Input
        label={t("clientPhone")}
        placeholder="01 23 45 67 89 (optionnel)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextArea
        label={t("clientAddress")}
        placeholder={t("clientAddress") + " (optionnel)"}
        value={address}
        onChangeText={setAddress}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
});