import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { Declaration } from "@/types";

type RouteParams = RouteProp<RootStackParamList, "DeclarationDetail">;

export default function DeclarationDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { user, token } = useAuth();

  const [declaration, setDeclaration] = useState<Declaration | null>(
    route.params?.declaration || null
  );
  const [isLoading, setIsLoading] = useState(!route.params?.declaration);
  const [showTicket, setShowTicket] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [technicianRemarks, setTechnicianRemarks] = useState("");
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);

  useEffect(() => {
    if (!route.params?.declaration && token) {
      const declarationId = (route.params as any)?.declarationId || 
                           (route.params?.declaration as any)?.id;
      
      if (declarationId) {
        fetchDeclaration(declarationId);
      } else {
        Alert.alert(t("error"), "ID de déclaration manquant");
        navigation.goBack();
      }
    }
  }, [route.params, token]);

  useEffect(() => {
    if (declaration?.technician_remarks) {
      setTechnicianRemarks(declaration.technician_remarks);
    }
  }, [declaration]);

  const fetchDeclaration = async (id: string) => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/declarations/${id}`, baseUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeclaration(data);
      } else {
        Alert.alert(t("error"), t("loadingDetails"));
        navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to fetch declaration:", error);
      Alert.alert(t("error"), t("loadingDetails"));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const isTechnician = user?.role === "technicien";
  const isCommercial = user?.role === "commercial";
  const canTakeCharge = isTechnician && declaration?.status === "nouvelle";
  const canResolve =
    isTechnician &&
    declaration?.status === "en_cours" &&
    declaration.technician_id === user?.id;
  const canDelete =
    isCommercial &&
    declaration?.commercial_id === user?.id &&
    (declaration.status === "nouvelle" || 
     declaration.status === "en_cours" || 
     declaration.status === "reglee");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTakeCharge = async () => {
    if (!declaration || !token) return;

    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/declarations/${declaration.id}/take`, baseUrl).href,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updatedDeclaration = await response.json();
        setDeclaration(updatedDeclaration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t("success"), t("declarationTaken"));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t("takeChargeFailed"));
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!declaration || !token) return;

    Alert.alert(
      t("confirm"),
      t("confirmResolve"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirm"),
          onPress: async () => {
            setIsLoading(true);
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/declarations/${declaration.id}/resolve`, baseUrl)
                  .href,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ remarks: "" }),
                }
              );

              if (response.ok) {
                const updatedDeclaration = await response.json();
                setDeclaration(updatedDeclaration);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(t("success"), t("declarationResolved"));
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message || t("resolveFailed"));
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("error"), error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveRemarks = async () => {
    if (!declaration || !token) return;
    
    setIsSavingRemarks(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/declarations/${declaration.id}/remarks`, baseUrl).href,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ technician_remarks: technicianRemarks }),
        }
      );

      if (response.ok) {
        const updatedDeclaration = await response.json();
        setDeclaration(updatedDeclaration);
        setIsEditingRemarks(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Remarques enregistrées");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur enregistrement");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", error.message);
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const handleDelete = () => {
    if (!declaration || !token) return;

    Alert.alert(
      t("delete"),
      t("confirmDelete"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const baseUrl = getApiUrl();
              const response = await fetch(
                new URL(`/api/declarations/${declaration.id}`, baseUrl).href,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.ok) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(t("success"), t("declarationDeleted"));
                navigation.goBack();
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message || t("deleteFailed"));
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("error"), error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateTicket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTicket(true);
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
  };

  const handlePrintTicket = async () => {
    if (!declaration) return;
    
    setIsPrinting(true);
    try {
      const simplifiedID = declaration.id.substring(0, 8).toUpperCase();
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 400px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 3px solid #E63946;
                padding-bottom: 15px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #E63946;
                margin-bottom: 5px;
              }
              .company-subtitle {
                font-size: 14px;
                color: #666;
              }
              .id-display {
                font-size: 42px;
                font-weight: bold;
                text-align: center;
                margin: 30px 0;
                letter-spacing: 3px;
                color: #E63946;
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                border: 2px dashed #E63946;
              }
              .info-section {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background-color: #f9f9f9;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: bold;
                color: #666;
                min-width: 120px;
              }
              .value {
                text-align: right;
                flex: 1;
                font-weight: 500;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #888;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 15px;
              }
              .date {
                font-size: 11px;
                color: #999;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">SAV PRO</div>
              <div class="company-subtitle">Service Après-Vente Professionnel</div>
            </div>
            
            <div class="id-display">
              ${simplifiedID}
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="label">Commercial:</span>
                <span class="value">${declaration.commercial?.name || "—"}</span>
              </div>
              <div class="info-row">
                <span class="label">Client:</span>
                <span class="value">${declaration.client?.name || t("unknownClient")}</span>
              </div>
              <div class="info-row">
                <span class="label">Produit:</span>
                <span class="value">${declaration.product_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Référence:</span>
                <span class="value">${declaration.reference}</span>
              </div>
              <div class="info-row">
                <span class="label">S/N:</span>
                <span class="value">${declaration.serial_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Catégorie:</span>
                <span class="value">${declaration.category?.name || "—"}</span>
              </div>
              <div class="info-row">
                <span class="label">Date création:</span>
                <span class="value">${formatDate(declaration.created_at)}</span>
              </div>
              <div class="info-row">
                <span class="label">Statut:</span>
                <span class="value">${declaration.status === "nouvelle" ? "Nouvelle" : 
                                     declaration.status === "en_cours" ? "En cours" : 
                                     "Réglée"}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>SAV Pro - Ticket ID: ${declaration.id.substring(0, 12).toUpperCase()}</p>
              <p class="date">Généré le: ${new Date().toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Ticket imprimé avec succès");
      
    } catch (error: any) {
      console.error("Print error:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le ticket: " + error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const copySimplifiedID = () => {
    if (!declaration) return;
    
    const simplifiedID = declaration.id.substring(0, 8).toUpperCase();
    Alert.alert("ID copié", `ID: ${simplifiedID}`, [{ text: "OK" }]);
  };

  if (!declaration || isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, flex: 1 },
        ]}
      >
        <LoadingSpinner message={t("loadingDetails")} />
      </View>
    );
  }

  const simplifiedID = declaration.id.substring(0, 8).toUpperCase();
  const canEditRemarks = isTechnician && 
                        declaration?.technician_id === user?.id && 
                        declaration?.status === "en_cours";

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
      >
        {/* EN-TÊTE PRINCIPALE */}
        <View style={[styles.mainHeader, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.headerTop}>
            <StatusBadge status={declaration.status} size="medium" />
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
                {formatDate(declaration.created_at)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="h2" style={styles.productName}>
            {declaration.product_name}
          </ThemedText>

          {/* AFFICHAGE DE L'ID SIMPLIFIÉ */}
          <Pressable 
            style={[styles.idContainer, { backgroundColor: theme.primary + "10" }]}
            onPress={copySimplifiedID}
          >
            <Feather name="hash" size={16} color={theme.primary} />
            <ThemedText style={[styles.idLabel, { color: theme.primary }]}>
              ID: {simplifiedID}
            </ThemedText>
            <Feather name="copy" size={14} color={theme.primary} style={styles.copyIcon} />
          </Pressable>

          <View style={styles.clientInfo}>
            <Feather name="user" size={16} color={theme.secondary} />
            <ThemedText style={[styles.clientText, { color: theme.text }]}>
              {t("client")}: {declaration.client?.name || t("unknownClient")}
            </ThemedText>
          </View>
        </View>

        {/* SECTION INFORMATIONS PRODUIT */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="package" size={20} color={theme.primary} />
            <ThemedText type="h4">{t("productInfo")}</ThemedText>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="tag" size={16} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  {t("category")}
                </ThemedText>
                <ThemedText>{declaration.category?.name || "—"}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="hash" size={16} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  {t("reference")}
                </ThemedText>
                <ThemedText selectable={true}>
                  {declaration.reference || "—"}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="cpu" size={16} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  {t("serialNumber")}
                </ThemedText>
                <ThemedText selectable={true} style={styles.serialNumberText}>
                  {declaration.serial_number || "—"}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* SECTION DESCRIPTION DU PROBLÈME */}
          {declaration.description && (
            <View style={styles.descriptionBox}>
              <View style={styles.descriptionHeader}>
                <Feather name="align-left" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.descriptionLabel, { color: theme.textSecondary }]}>
                  {t("problemDescription")}
                </ThemedText>
              </View>
              <ThemedText style={styles.descriptionText}>
                {declaration.description}
              </ThemedText>
            </View>
          )}
        </View>

        {/* SECTION RESPONSABLES */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={20} color={theme.primary} />
            <ThemedText type="h4">{t("responsibles")}</ThemedText>
          </View>

          <View style={styles.responsiblesGrid}>
            <View style={styles.responsibleRow}>
              <View style={[styles.responsibleIcon, { backgroundColor: theme.secondary + "20" }]}>
                <Feather name="user-check" size={16} color={theme.secondary} />
              </View>
              <View style={styles.responsibleContent}>
                <ThemedText style={[styles.responsibleLabel, { color: theme.textSecondary }]}>
                  {t("commercialResponsible")}
                </ThemedText>
                <ThemedText>{declaration.commercial?.name || "—"}</ThemedText>
              </View>
            </View>

            {declaration.technician?.name && (
              <View style={styles.responsibleRow}>
                <View style={[styles.responsibleIcon, { backgroundColor: theme.success + "20" }]}>
                  <Feather name="tool" size={16} color={theme.success} />
                </View>
                <View style={styles.responsibleContent}>
                  <ThemedText style={[styles.responsibleLabel, { color: theme.textSecondary }]}>
                    {t("technicianAssigned")}
                  </ThemedText>
                  <ThemedText>{declaration.technician.name}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* SECTION ACCESSOIRES */}
        {declaration.accessories && declaration.accessories.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.sectionHeader}>
              <Feather name="package" size={20} color={theme.primary} />
              <ThemedText type="h4">{t("includedAccessories")}</ThemedText>
            </View>

            <View style={styles.accessoriesList}>
              {declaration.accessories.map((item, index) => (
                <View key={index} style={styles.accessoryItem}>
                  <Feather
                    name={item.checked ? "check-circle" : "circle"}
                    size={18}
                    color={item.checked ? theme.success : theme.textTertiary}
                  />
                  <ThemedText
                    style={[
                      styles.accessoryText,
                      { color: item.checked ? theme.text : theme.textTertiary },
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION PHOTO */}
        {declaration.photo_url && (
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.sectionHeader}>
              <Feather name="image" size={20} color={theme.primary} />
              <ThemedText type="h4">{t("photo")}</ThemedText>
            </View>

            <Image
              source={{ uri: declaration.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        {/* SECTION REMARQUES TECHNIQUE - INTÉGRÉE DANS LA PAGE */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="message-square" size={20} color={theme.secondary} />
            <ThemedText type="h4">{t("technicianRemarks")}</ThemedText>
            
            {/* BOUTON MODIFIER SI LE TECHNICIEN PEUT ÉDITER */}
            {canEditRemarks && !isEditingRemarks && (
              <Pressable 
                style={styles.editButton}
                onPress={() => setIsEditingRemarks(true)}
              >
                <Feather name="edit" size={18} color={theme.primary} />
              </Pressable>
            )}
          </View>

          {isEditingRemarks ? (
            <View style={styles.remarksEditContainer}>
              <TextInput
                style={[
                  styles.remarksInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Entrez vos remarques sur l'intervention..."
                placeholderTextColor={theme.textTertiary}
                value={technicianRemarks}
                onChangeText={setTechnicianRemarks}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <View style={styles.remarksActions}>
                <Button
                  onPress={() => {
                    setIsEditingRemarks(false);
                    setTechnicianRemarks(declaration.technician_remarks || "");
                  }}
                  style={[styles.remarksButton, { 
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: theme.border,
                  }]}
                >
                  <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
                    Annuler
                  </ThemedText>
                </Button>
                
                <Button
                  onPress={handleSaveRemarks}
                  disabled={isSavingRemarks}
                  style={[styles.remarksButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isSavingRemarks ? "Enregistrement..." : "Enregistrer"}
                  </ThemedText>
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.remarksBox}>
              <ThemedText style={declaration.technician_remarks ? styles.remarksText : styles.noRemarksText}>
                {declaration.technician_remarks || "Aucune remarque pour le moment."}
              </ThemedText>
              
              {/* MESSAGE POUR LE TECHNICIEN SI IL PEUT AJOUTER DES REMARQUES */}
              {canEditRemarks && !declaration.technician_remarks && (
                <ThemedText style={styles.addRemarksHint}>
                  Cliquez sur l'icône ✏️ pour ajouter vos remarques.
                </ThemedText>
              )}
            </View>
          )}
        </View>

        {/* SECTION HISTORIQUE */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={theme.primary} />
            <ThemedText type="h4">{t("history")}</ThemedText>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                  {t("created")}
                </ThemedText>
                <ThemedText>{formatDateTime(declaration.created_at)}</ThemedText>
              </View>
            </View>

            {declaration.taken_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: theme.warning }]} />
                <View style={styles.timelineContent}>
                  <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                    {t("taken")}
                  </ThemedText>
                  <ThemedText>{formatDateTime(declaration.taken_at)}</ThemedText>
                </View>
              </View>
            )}

            {declaration.resolved_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: theme.success }]} />
                <View style={styles.timelineContent}>
                  <ThemedText style={[styles.timelineLabel, { color: theme.textSecondary }]}>
                    {t("resolvedAt")}
                  </ThemedText>
                  <ThemedText>{formatDateTime(declaration.resolved_at)}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* SECTION ACTIONS */}
        {(canTakeCharge || canResolve || canDelete || isCommercial) && (
          <View style={styles.actionsSection}>
            {canTakeCharge && (
              <Button
                onPress={handleTakeCharge}
                disabled={isLoading}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <View style={styles.buttonInner}>
                  <Feather name="tool" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {t("takeCharge")}
                  </ThemedText>
                </View>
              </Button>
            )}

            {canResolve && (
              <Button
                onPress={handleResolve}
                disabled={isLoading}
                style={[styles.actionButton, { backgroundColor: theme.success }]}
              >
                <View style={styles.buttonInner}>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {t("markResolved")}
                  </ThemedText>
                </View>
              </Button>
            )}

            {/* BOUTON GÉNÉRER TICKET POUR COMMERCIAUX */}
            {isCommercial && declaration?.commercial_id === user?.id && (
              <Button
                onPress={handleGenerateTicket}
                style={[styles.actionButton, { backgroundColor: theme.secondary }]}
              >
                <View style={styles.buttonInner}>
                  <Feather name="printer" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Générer Ticket
                  </ThemedText>
                </View>
              </Button>
            )}

            {canDelete && (
              <Button
                onPress={handleDelete}
                style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
              >
                <View style={styles.buttonInner}>
                  <Feather name="trash" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {t("delete")}
                  </ThemedText>
                </View>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL DU TICKET */}
      <Modal
        visible={showTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseTicket}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Ticket SAV Pro</ThemedText>
              <Pressable onPress={handleCloseTicket}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.ticketScroll}>
              <View style={styles.ticketContent}>
                <View style={styles.ticketHeader}>
                  <ThemedText style={styles.ticketTitle}>SAV PRO</ThemedText>
                  <ThemedText style={styles.ticketSubtitle}>Service Après-Vente</ThemedText>
                </View>

                <View style={styles.ticketID}>
                  <ThemedText style={styles.ticketIDText}>
                    {simplifiedID}
                  </ThemedText>
                </View>

                <View style={styles.ticketInfo}>
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>Commercial:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {declaration.commercial?.name || "—"}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>Client:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {declaration.client?.name || t("unknownClient")}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>Produit:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {declaration.product_name}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>Référence:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {declaration.reference}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>S/N:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {declaration.serial_number}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.ticketRow}>
                    <ThemedText style={styles.ticketLabel}>Date:</ThemedText>
                    <ThemedText style={styles.ticketValue}>
                      {formatDate(declaration.created_at)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.ticketFooter}>
                  <ThemedText style={styles.ticketFooterText}>
                    ID Complet: {declaration.id.substring(0, 16).toUpperCase()}
                  </ThemedText>
                  <ThemedText style={styles.ticketFooterText}>
                    Généré le: {new Date().toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                onPress={handlePrintTicket}
                disabled={isPrinting}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <View style={styles.buttonInner}>
                  <Feather name="printer" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isPrinting ? "Impression..." : "Imprimer"}
                  </ThemedText>
                </View>
              </Button>
              
              <Button
                onPress={handleCloseTicket}
                style={[styles.modalButton, { backgroundColor: theme.textSecondary }]}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Fermer
                </ThemedText>
              </Button>
            </View>
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
    gap: Spacing.lg,
  },
  mainHeader: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: 14,
  },
  productName: {
    marginBottom: Spacing.sm,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.md,
    alignSelf: "flex-start",
  },
  idLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  copyIcon: {
    marginLeft: Spacing.xs,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  clientText: {
    fontSize: 15,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  editButton: {
    marginLeft: 'auto',
    padding: Spacing.xs,
  },
  infoGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  serialNumberText: {
    fontSize: 15,
    fontWeight: "500",
  },
  descriptionBox: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    borderRadius: BorderRadius.sm,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  descriptionLabel: {
    fontSize: 12,
  },
  descriptionText: {
    lineHeight: 20,
    fontSize: 14,
  },
  responsiblesGrid: {
    gap: Spacing.lg,
  },
  responsibleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  responsibleIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  responsibleContent: {
    flex: 1,
  },
  responsibleLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  accessoriesList: {
    gap: Spacing.sm,
  },
  accessoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  accessoryText: {
    fontSize: 14,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.sm,
  },
  remarksEditContainer: {
    marginTop: Spacing.sm,
  },
  remarksInput: {
    minHeight: 120,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  remarksActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  remarksButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  remarksBox: {
    padding: Spacing.md,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    borderRadius: BorderRadius.sm,
  },
  remarksText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noRemarksText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#999",
    fontStyle: "italic",
  },
  addRemarksHint: {
    fontSize: 12,
    color: "#666",
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  timeline: {
    gap: Spacing.lg,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  actionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginTop: 0,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  ticketScroll: {
    flex: 1,
  },
  ticketContent: {
    alignItems: "center",
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: "#E63946",
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.lg,
  },
  ticketHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  ticketTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E63946",
  },
  ticketSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: Spacing.xs,
  },
  ticketID: {
    marginVertical: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: "#F8F9FA",
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "#E63946",
    borderStyle: "dashed",
  },
  ticketIDText: {
    fontSize: 42,
    fontWeight: "bold",
    letterSpacing: 3,
    color: "#E63946",
    textAlign: "center",
  },
  ticketInfo: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  ticketLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  ticketFooter: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  ticketFooterText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});