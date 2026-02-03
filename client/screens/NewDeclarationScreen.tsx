import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Image, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Checkbox from "expo-checkbox";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { Picker } from "@/components/Picker";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CATEGORIES, Client, AccessoryItem, DEFAULT_ACCESSORIES } from "@/types";
import { getApiUrl } from "@/lib/query-client";

export default function NewDeclarationScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { token } = useAuth();

  const [categoryId, setCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  const [reference, setReference] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [accessories, setAccessories] = useState<AccessoryItem[]>(
    DEFAULT_ACCESSORIES.map((name, index) => ({
      id: String(index + 1),
      name,
      checked: false,
    }))
  );
  const [customAccessory, setCustomAccessory] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/clients", baseUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const isValid =
    categoryId && productName.trim() && reference.trim() && serialNumber.trim() && clientId;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText style={{ color: theme.primary }}>Annuler</ThemedText>
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
            {isLoading ? "..." : "Créer"}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, isValid, isLoading, categoryId, productName, reference, serialNumber, clientId, description, photoUri, accessories]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la galerie est nécessaire pour ajouter une photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la caméra est nécessaire pour prendre une photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePhotoPress = () => {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }

    Alert.alert("Ajouter une photo", "Comment voulez-vous ajouter une photo ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Galerie", onPress: pickImage },
      { text: "Caméra", onPress: takePhoto },
    ]);
  };

  const toggleAccessory = (id: string) => {
    setAccessories((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const addCustomAccessory = () => {
    if (!customAccessory.trim()) return;
    
    const newAccessory: AccessoryItem = {
      id: String(Date.now()),
      name: customAccessory.trim(),
      checked: true,
    };
    
    setAccessories((prev) => [...prev, newAccessory]);
    setCustomAccessory("");
  };

  const removeAccessory = (id: string) => {
    setAccessories((prev) => prev.filter((item) => item.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!categoryId) newErrors.category = "Sélectionnez une catégorie";
    if (!productName.trim()) newErrors.productName = "Le nom du produit est requis";
    if (!reference.trim()) newErrors.reference = "La référence est requise";
    if (!serialNumber.trim()) newErrors.serialNumber = "Le numéro de série est requis";
    if (!clientId) newErrors.client = "Sélectionnez un client";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      
      let photoUrl = null;
      if (photoUri) {
        const formData = new FormData();
        const filename = photoUri.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        
        formData.append("photo", {
          uri: photoUri,
          name: filename,
          type,
        } as any);

        const uploadResponse = await fetch(new URL("/api/upload", baseUrl).href, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrl = uploadData.url;
        }
      }

      const checkedAccessories = accessories.filter((a) => a.checked);

      const response = await fetch(new URL("/api/declarations", baseUrl).href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: categoryId,
          client_id: clientId,
          product_name: productName.trim(),
          reference: reference.trim(),
          serial_number: serialNumber.trim(),
          description: description.trim(),
          photo_url: photoUrl,
          accessories: checkedAccessories,
        }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Échec de la création");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

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
      <Picker
        label="Catégorie *"
        placeholder="Sélectionner une catégorie"
        value={categoryId}
        options={CATEGORIES}
        onSelect={(opt) => setCategoryId(opt.id)}
        error={errors.category}
      />

      <Picker
        label="Client *"
        placeholder="Sélectionner un client"
        value={clientId}
        options={clientOptions}
        onSelect={(opt) => setClientId(opt.id)}
        error={errors.client}
      />

      <Input
        label="Nom du produit *"
        placeholder="Ex: Lave-linge Samsung"
        value={productName}
        onChangeText={setProductName}
        error={errors.productName}
      />

      <Input
        label="Référence *"
        placeholder="Ex: WW90T534DAW"
        value={reference}
        onChangeText={setReference}
        autoCapitalize="characters"
        error={errors.reference}
      />

      <Input
        label="Numéro de série *"
        placeholder="Ex: S/N 123456789"
        value={serialNumber}
        onChangeText={setSerialNumber}
        autoCapitalize="characters"
        error={errors.serialNumber}
      />

      <TextArea
        label="Description du problème"
        placeholder="Décrivez le problème rencontré..."
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.accessoriesSection}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Faux Client (Accessoires inclus)
        </ThemedText>
        <ThemedText style={[styles.hint, { color: theme.textTertiary }]}>
          Cochez les éléments fournis avec le produit
        </ThemedText>
        
        <View style={[styles.accessoriesList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {accessories.map((item) => (
            <View key={item.id} style={styles.accessoryRow}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => toggleAccessory(item.id)}
              >
                <Checkbox
                  value={item.checked}
                  onValueChange={() => toggleAccessory(item.id)}
                  color={item.checked ? theme.primary : undefined}
                  style={styles.checkbox}
                />
                <ThemedText style={styles.accessoryText}>{item.name}</ThemedText>
              </Pressable>
              {!DEFAULT_ACCESSORIES.includes(item.name) ? (
                <Pressable onPress={() => removeAccessory(item.id)} hitSlop={8}>
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.addAccessoryRow}>
          <View style={styles.addAccessoryInput}>
            <Input
              placeholder="Ajouter un autre élément..."
              value={customAccessory}
              onChangeText={setCustomAccessory}
              onSubmitEditing={addCustomAccessory}
              returnKeyType="done"
            />
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={addCustomAccessory}
            disabled={!customAccessory.trim()}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.photoSection}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Photo (optionnelle)
        </ThemedText>
        <Pressable
          style={[
            styles.photoButton,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
          onPress={handlePhotoPress}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.photoText, { color: theme.textSecondary }]}>
                Ajouter une photo
              </ThemedText>
            </View>
          )}
        </Pressable>
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)} style={styles.removePhoto}>
            <ThemedText style={{ color: theme.primary }}>Supprimer la photo</ThemedText>
          </Pressable>
        ) : null}
      </View>
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  accessoriesSection: {
    marginBottom: Spacing.lg,
  },
  accessoriesList: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  accessoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    marginRight: Spacing.md,
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  accessoryText: {
    fontSize: 15,
    flex: 1,
  },
  addAccessoryRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addAccessoryInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  photoSection: {
    marginBottom: Spacing.lg,
  },
  photoButton: {
    height: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  removePhoto: {
    marginTop: Spacing.sm,
    alignSelf: "center",
  },
});
