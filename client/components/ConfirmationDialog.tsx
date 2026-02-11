import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext"; // AJOUTÉ
import { Spacing, BorderRadius } from "@/constants/theme";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  tTitle?: string; // AJOUTÉ
  tMessage?: string; // AJOUTÉ
  tConfirm?: string; // AJOUTÉ
  tCancel?: string; // AJOUTÉ
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "info",
  onConfirm,
  onCancel,
  tTitle, // AJOUTÉ
  tMessage, // AJOUTÉ
  tConfirm, // AJOUTÉ
  tCancel, // AJOUTÉ
}: ConfirmationDialogProps) {
  const { theme } = useTheme();
  const { t } = useLanguage(); // AJOUTÉ

  const getColor = () => {
    switch (type) {
      case "danger":
        return theme.primary;
      case "warning":
        return theme.warning;
      default:
        return theme.secondary;
    }
  };

  if (!visible) return null;

  // Utiliser les traductions si disponibles
  const displayTitle = tTitle ? t(tTitle) : title;
  const displayMessage = tMessage ? t(tMessage) : message;
  const displayConfirm = tConfirm ? t(tConfirm) : confirmText;
  const displayCancel = tCancel ? t(tCancel) : cancelText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.overlayContent}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={[styles.title, { color: getColor() }]}>
              {displayTitle}
            </ThemedText>
            
            <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
              {displayMessage}
            </ThemedText>

            <View style={styles.buttons}>
              <Button
                onPress={onCancel}
                style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>
                  {displayCancel}
                </ThemedText>
              </Button>
              
              <Button
                onPress={onConfirm}
                style={[styles.button, { backgroundColor: getColor() }]}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {displayConfirm}
                </ThemedText>
              </Button>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContent: {
    width: "90%",
    maxWidth: 400,
  },
  dialog: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
});