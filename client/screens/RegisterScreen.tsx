import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function RegisterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { register } = useAuth();
  
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
      newErrors.name = "Le nom est requis";
    }
    
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide";
    }
    
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim(), role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", error.message || "Échec de l'inscription");
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
        Créer un compte
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Rejoignez SAV Pro pour gérer vos déclarations
      </ThemedText>

      <View style={styles.roleSelector}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Je suis un
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
              Commercial
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
              Technicien
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Input
        label="Nom complet"
        placeholder="Jean Dupont"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={errors.name}
      />

      <Input
        label="Email"
        placeholder="votre@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />

      <Input
        label="Mot de passe"
        placeholder="Au moins 6 caractères"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <Input
        label="Confirmer le mot de passe"
        placeholder="Répétez votre mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={errors.confirmPassword}
      />

      <Button
        onPress={handleRegister}
        disabled={isLoading}
        style={styles.registerButton}
      >
        {isLoading ? "Inscription..." : "S'inscrire"}
      </Button>
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
  registerButton: {
    marginTop: Spacing.lg,
  },
});
