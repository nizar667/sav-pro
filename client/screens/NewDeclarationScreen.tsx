import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Image, Pressable, Alert, Platform, TextInput, ScrollView, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Checkbox from "expo-checkbox";
import { ThemedText } from "@/components/ThemedText";
import { Picker } from "@/components/Picker";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CATEGORIES, Client, AccessoryItem, DEFAULT_ACCESSORIES } from "@/types";
import { getApiUrl } from "@/lib/query-client";

export default function NewDeclarationScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useLanguage();

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
      name: name,
      checked: false,
    }))
  );
  const [customAccessory, setCustomAccessory] = useState("");

  // Références pour stocker les valeurs COMPLÈTES
  const serialNumberRef = React.useRef("");
  const descriptionRef = React.useRef("");
  const productNameRef = React.useRef("");
  const referenceRef = React.useRef("");

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
      headerTitle: t("newDeclaration"),
    });
  }, [navigation, theme, isValid, isLoading, t]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("permissionRequired"),
        t("galleryPermissionMessage")
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
        t("permissionRequired"),
        t("cameraPermissionMessage")
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

    Alert.alert(t("addPhoto"), t("howToAddPhoto"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("gallery"), onPress: pickImage },
      { text: t("camera"), onPress: takePhoto },
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

    if (!categoryId) newErrors.category = t("fieldRequired");
    if (!productName.trim()) newErrors.productName = t("fieldRequired");
    if (!reference.trim()) newErrors.reference = t("fieldRequired");
    if (!serialNumber.trim()) newErrors.serialNumber = t("fieldRequired");
    if (!clientId) newErrors.client = t("fieldRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SOLUTION CRITIQUE : Utiliser onChange au lieu de onChangeText
  const handleSerialNumberChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const text = e.nativeEvent.text;
    console.log("🔍 SerialNumber (onChange):", text, "length:", text.length);
    setSerialNumber(text);
    serialNumberRef.current = text;
  };

  const handleDescriptionChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const text = e.nativeEvent.text;
    console.log("🔍 Description (onChange):", text, "length:", text.length);
    setDescription(text);
    descriptionRef.current = text;
  };

  const handleProductNameChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const text = e.nativeEvent.text;
    setProductName(text);
    productNameRef.current = text;
  };

  const handleReferenceChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const text = e.nativeEvent.text;
    setReference(text);
    referenceRef.current = text;
  };

  const handleSubmit = async () => {
    console.log("🔄 SUBMIT - Valeurs FINALES:");
    console.log("serialNumber (state):", serialNumber);
    console.log("serialNumber (ref):", serialNumberRef.current);
    console.log("description (state):", description);
    console.log("description (ref):", descriptionRef.current);
    
    if (!validate()) return;

    // Utiliser la valeur du ref (toujours complète)
    const finalSerialNumber = serialNumberRef.current || serialNumber;
    const finalDescription = descriptionRef.current || description;
    const finalProductName = productNameRef.current || productName;
    const finalReference = referenceRef.current || reference;

    console.log("🎯 Valeurs utilisées pour l'envoi:");
    console.log("serial_number:", finalSerialNumber);
    console.log("description:", finalDescription);

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

      const requestData = {
        category_id: categoryId,
        client_id: clientId,
        product_name: finalProductName.trim(),
        reference: finalReference.trim(),
        serial_number: finalSerialNumber.trim(),
        description: finalDescription.trim(),
        photo_url: photoUrl,
        accessories: checkedAccessories,
      };

      console.log("📤 Envoi au backend:", JSON.stringify(requestData, null, 2));

      const response = await fetch(new URL("/api/declarations", baseUrl).href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
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

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

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
      <Picker
        label={`${t("category")} *`}
        placeholder={t("selectCategory")}
        value={categoryId}
        options={CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name
        }))}
        onSelect={(opt) => setCategoryId(opt.id)}
        error={errors.category}
      />

      <Picker
        label={`${t("client")} *`}
        placeholder={t("selectClient")}
        value={clientId}
        options={clientOptions}
        onSelect={(opt) => setClientId(opt.id)}
        error={errors.client}
      />

      {/* PRODUCT NAME - CORRIGÉ */}
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("productName")} *
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: errors.productName ? theme.primary : theme.border,
            },
          ]}
          placeholder={t("productName")}
          value={productName}
          onChange={handleProductNameChange}
        />
        {errors.productName && (
          <ThemedText style={[styles.error, { color: theme.primary }]}>
            {errors.productName}
          </ThemedText>
        )}
      </View>

      {/* REFERENCE - CORRIGÉ */}
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("reference")} *
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: errors.reference ? theme.primary : theme.border,
            },
          ]}
          placeholder={t("reference")}
          value={reference}
          onChange={handleReferenceChange}
          autoCapitalize="characters"
        />
        {errors.reference && (
          <ThemedText style={[styles.error, { color: theme.primary }]}>
            {errors.reference}
          </ThemedText>
        )}
      </View>

      {/* SERIAL NUMBER - CORRIGÉ (SOLUTION) */}
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("serialNumber")} *
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: errors.serialNumber ? theme.primary : theme.border,
            },
          ]}
          placeholder={t("serialNumber")}
          value={serialNumber}
          onChange={handleSerialNumberChange} // ← CHANGÉ ICI
          autoCapitalize="characters"
        />
        {errors.serialNumber && (
          <ThemedText style={[styles.error, { color: theme.primary }]}>
            {errors.serialNumber}
          </ThemedText>
        )}
      </View>

      {/* DESCRIPTION - CORRIGÉ (SOLUTION) */}
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("problemDescription")}
        </ThemedText>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={t("problemDescription")}
          value={description}
          onChange={handleDescriptionChange} // ← CHANGÉ ICI
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.accessoriesSection}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t("accessoriesIncluded")}
        </ThemedText>
        <ThemedText style={[styles.hint, { color: theme.textTertiary }]}>
          {t("checkProvidedItems")}
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
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder={t("addAnotherItem")}
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
          {t("photo")} ({t("optional")})
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
                {t("addPhoto")}
              </ThemedText>
            </View>
          )}
        </Pressable>
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)} style={styles.removePhoto}>
            <ThemedText style={{ color: theme.primary }}>{t("removePhoto")}</ThemedText>
          </Pressable>
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
    paddingHorizontal: Spacing.xl,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    marginTop: Spacing.xs,
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