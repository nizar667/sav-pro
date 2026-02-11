import React from "react";
import { View, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<RootStackParamList, "ClientDetail">;

export default function ClientDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteParams>();
  const { client } = route.params;

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${client.phone}`);
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${client.email}`);
  };

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
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.secondary + "20" }]}>
          <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>
            {client.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.name}>
          {client.name}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleCall}
        >
          <Feather name="phone" size={20} color="#FFFFFF" />
          <ThemedText style={styles.actionText}>{t("call")}</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.secondary }]}
          onPress={handleEmail}
        >
          <Feather name="mail" size={20} color="#FFFFFF" />
          <ThemedText style={styles.actionText}>{t("emailAction")}</ThemedText>
        </Pressable>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, ...Shadows.small }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          {t("coordinates")}
        </ThemedText>
        
        <Pressable style={styles.row} onPress={handleEmail}>
          <View style={styles.rowIcon}>
            <Feather name="mail" size={18} color={theme.secondary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
              {t("email")}
            </ThemedText>
            <ThemedText style={{ color: theme.link }}>{client.email}</ThemedText>
          </View>
        </Pressable>

        <Pressable style={styles.row} onPress={handleCall}>
          <View style={styles.rowIcon}>
            <Feather name="phone" size={18} color={theme.secondary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
              {t("clientPhone")}
            </ThemedText>
            <ThemedText style={{ color: theme.link }}>{client.phone}</ThemedText>
          </View>
        </Pressable>

        {client.address ? (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Feather name="map-pin" size={18} color={theme.secondary} />
            </View>
            <View style={styles.rowContent}>
              <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>
                {t("clientAddress")}
              </ThemedText>
              <ThemedText>{client.address}</ThemedText>
            </View>
          </View>
        ) : null}
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
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    width: 32,
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
});