import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView, // AJOUTÉ pour permettre le défilement si nécessaire
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function IDEntryScreen() {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [idInput, setIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!idInput.trim()) {
      Alert.alert("ID requis", "Veuillez entrer l'ID de déclaration");
      return;
    }

    const cleanId = idInput.trim().toUpperCase();
    
    if (cleanId.length < 3) {
      Alert.alert("ID invalide", "L'ID doit contenir au moins 3 caractères");
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();
    
    try {
      const baseUrl = getApiUrl();
      
      // MODIFICATION: Autoriser commerciaux ET techniciens
      if (user?.role !== "technicien" && user?.role !== "commercial") {
        throw new Error("Accès réservé aux techniciens et commerciaux");
      }

      // Récupérer toutes les déclarations visibles par l'utilisateur
      const response = await fetch(
        `${baseUrl}/api/declarations`,
        {
          headers: { 
            "Authorization": `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error("Erreur de connexion au serveur");
      }

      const declarations = await response.json();
      
      // Chercher par ID partiel
      const foundDeclaration = declarations.find((d: any) => 
        d.id.toUpperCase().includes(cleanId)
      );

      if (!foundDeclaration) {
        // Si non trouvé dans ses propres déclarations, essayer directement par ID
        const directResponse = await fetch(
          `${baseUrl}/api/declarations/${cleanId}`,
          {
            headers: { 
              "Authorization": `Bearer ${token}`,
            }
          }
        );

        if (directResponse.ok) {
          const declaration = await directResponse.json();
          
          // Vérifier si l'utilisateur a le droit de voir cette déclaration
          if (user?.role === "commercial" && declaration.commercial_id !== user?.id) {
            throw new Error("Cette déclaration ne vous appartient pas");
          }
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.navigate("DeclarationDetail", { 
            declaration
          });
        } else {
          throw new Error("Déclaration non trouvée. Vérifiez l'ID.");
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("DeclarationDetail", { 
          declaration: foundDeclaration
        });
      }

    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible de trouver la déclaration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleID = () => {
    setIdInput("DEMO001");
  };

  const handleClear = () => {
    setIdInput("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      {/* AJOUT: ScrollView pour permettre le défilement si nécessaire */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.contentContainer} onPress={Keyboard.dismiss}>
          <View
            style={[
              styles.content,
              {
                // MODIFICATION: Plus de paddingTop - on laisse le ScrollView gérer
                paddingBottom: insets.bottom + Spacing.xl,
                minHeight: '100%', // Assure que le contenu prend toute la hauteur
              },
            ]}
          >
            {/* EN-TÊTE - DÉPLACÉ PLUS BAS */}
            {/* AJOUT: Espace vide en haut pour descendre le contenu */}
            <View style={styles.topSpacer} />
            
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="hash" size={40} color={theme.primary} />
              </View>
              
              <ThemedText type="h2" style={styles.title}>
                Saisir ID déclaration
              </ThemedText>
              
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Entrez l'ID de l'étiquette sur le produit
              </ThemedText>
            </View>

            {/* CHAMP DE SAISIE */}
            <View style={styles.inputSection}>
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <Feather name="hash" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Ex: ABC12345"
                  placeholderTextColor={theme.textTertiary}
                  value={idInput}
                  onChangeText={setIdInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  maxLength={20}
                  editable={!isLoading}
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                />
                
                {idInput.length > 0 && (
                  <Pressable onPress={handleClear} hitSlop={10}>
                    <Feather name="x" size={20} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
              
              <ThemedText style={[styles.hint, { color: theme.textTertiary }]}>
                L'ID se trouve sur l'étiquette collée sur le produit
              </ThemedText>
            </View>

            {/* BOUTON EXEMPLE */}
            <Pressable
              style={[styles.exampleCard, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handleExampleID}
            >
              <Feather name="info" size={18} color={theme.secondary} />
              <View style={styles.exampleContent}>
                <ThemedText style={[styles.exampleTitle, { color: theme.text }]}>
                  Exemple d'ID
                </ThemedText>
                <ThemedText style={[styles.exampleID, { color: theme.secondary }]}>
                  DEMO001
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            {/* BOUTON VALIDER - CORRIGÉ */}
            <Button
              onPress={handleSubmit}
              disabled={isLoading || !idInput.trim()}
              style={[
                styles.submitButton,
                { 
                  backgroundColor: !idInput.trim() ? theme.textSecondary : theme.primary,
                }
              ]}
            >
              <View style={styles.buttonInner}>
                <Feather 
                  name={isLoading ? "loader" : "search"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {isLoading ? "Recherche..." : "Chercher la déclaration"}
                </ThemedText>
              </View>
            </Button>

            {/* ESPACE EN BAS POUR ÉVITER QUE LE CLAVIER COUPE LE CONTENU */}
            <View style={styles.bottomSpacer} />
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center', // Centre verticalement le contenu
  },
  topSpacer: {
    height: 40, // Espace en haut pour descendre tout le contenu
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 1,
  },
  hint: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  exampleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  exampleContent: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  exampleID: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomSpacer: {
    height: 20, // Espace en bas
  },
});