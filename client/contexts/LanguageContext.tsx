// contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

export type Language = "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traductions complètes avec toutes les clés nécessaires
const TRANSLATIONS = {
  fr: {
    // App
    appName: "SAV Pro",
    appSubtitle: "Service Après-Vente Professionnel",
    
    // Auth
    login: "Connexion",
    register: "Inscription",
    waitingApproval: "En attente",
    email: "Email",
    password: "Mot de passe",
    yourPassword: "Votre mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    fullName: "Nom complet",
    role: "Rôle",
    commercial: "Commercial",
    technician: "Technicien",
    loginButton: "Se connecter",
    registerButton: "S'inscrire",
    noAccount: "Pas encore de compte ?",
    haveAccount: "Déjà un compte ?",
    approvalMessage: "Votre compte sera activé après validation",
    confirmLogout: "Voulez-vous vraiment vous déconnecter ?",
    logoutError: "Échec de la déconnexion",
    pendingApproval: "En attente de validation",
    adminApproval: "Validation par l'administrateur",
    approvalNotification: "Vous serez notifié par email une fois approuvé",
    passwordMinLength: "Le mot de passe doit contenir au moins 6 caractères",
    registerSuccess: "Inscription réussie",
    registerFailed: "Échec de l'inscription",
    
    // Profile
    profile: "Profil",
    managePersonalInfo: "Gérer vos informations personnelles",
    editName: "Modifier le nom",
    yourName: "Votre nom",
    name: "Nom",
    nameRequired: "Le nom ne peut pas être vide",
    nameUpdated: "Nom mis à jour",
    updateFailed: "Échec de la mise à jour",
    user: "Utilisateur",
    language: "Langue",
    chooseAppLanguage: "Choisissez la langue de l'application",
    french: "Français",
    arabic: "العربية",
    defaultLanguage: "Langue par défaut",
    arabicLanguage: "اللغة العربية",
    notifications: "Notifications",
    receivePushNotifications: "Recevoir les notifications push",
    pushNotifications: "Notifications push",
    notificationsDescription: "Déclarations, mises à jour, rappels",
    logout: "Se déconnecter",
    version: "Version",
    changeLanguage: "Changer la langue",
    selectLanguage: "Sélectionner la langue",
    choosePreferredLanguage: "Choisissez votre langue préférée",
    confirmLanguageChange: "Voulez-vous changer la langue en",
    informationsSaved: "Vos informations ont été enregistrées",
    
    // Clients
    clients: "Clients",
    clientList: "Liste des clients",
    addClient: "Ajouter un client",
    newClient: "Nouveau client",
    clientName: "Nom du client",
    clientPhone: "Téléphone",
    clientAddress: "Adresse",
    noClients: "Aucun client",
    clientDetails: "Détails client",
    call: "Appeler",
    emailAction: "Email",
    coordinates: "Coordonnées",
    loadingClients: "Chargement des clients...",
    emptyClientsMessage: "Appuyez sur + pour ajouter votre premier client",
    unknownClient: "Client inconnu",
    
    // Declarations
    declarations: "Déclarations",
    declarationList: "Liste des déclarations",
    addDeclaration: "Nouvelle déclaration",
    newDeclaration: "Nouvelle déclaration",
    declarationDetail: "Détails déclaration",
    productName: "Nom du produit",
    reference: "Référence",
    serialNumber: "Numéro de série",
    category: "Catégorie",
    description: "Description",
    accessories: "Accessoires",
    photo: "Photo",
    status: "Statut",
    new: "Nouvelle",
    inProgress: "En cours",
    resolved: "Réglée",
    all: "Toutes",
    takeCharge: "Prendre en charge",
    markResolved: "Marquer comme réglée",
    delete: "Supprimer",
    confirmDelete: "Confirmer la suppression",
    remarks: "Remarques",
    history: "Historique",
    created: "Créée",
    taken: "Prise en charge",
    resolvedAt: "Résolue",
    loadingDeclarations: "Chargement des déclarations...",
    noDeclarations: "Aucune déclaration",
    emptyDeclarationsMessage: "Appuyez sur + pour créer votre première déclaration",
    productInfo: "Informations produit",
    responsibles: "Responsables",
    includedAccessories: "Accessoires inclus",
    technicianRemarks: "Remarques du technicien",
    client: "Client",
    commercialResponsible: "Commercial",
    technicianAssigned: "Technicien assigné",
    noDescription: "Aucune description fournie",
    problemDescription: "Description du problème",
    
    // Common
    save: "Enregistrer",
    cancel: "Annuler",
    create: "Créer",
    update: "Mettre à jour",
    confirm: "Confirmer",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    required: "Requis",
    optional: "Optionnel",
    select: "Sélectionner",
    add: "Ajouter",
    back: "Retour",
    close: "Fermer",
    yes: "Oui",
    no: "Non",
    ok: "OK",
    search: "Rechercher",
    filter: "Filtrer",
    apply: "Appliquer",
    reset: "Réinitialiser",
    
    // Messages
    loadingDetails: "Chargement des détails...",
    pullToRefresh: "Tirer pour rafraîchir",
    operationSuccess: "Opération réussie",
    operationFailed: "Opération échouée",
    
    // Errors
    networkError: "Erreur réseau",
    serverError: "Erreur serveur",
    unauthorized: "Non autorisé",
    invalidCredentials: "Identifiants invalides",
    fieldRequired: "Ce champ est requis",
    invalidEmail: "Email invalide",
    invalidPhone: "Téléphone invalide",
    passwordsDontMatch: "Les mots de passe ne correspondent pas",
    emailAlreadyUsed: "Cet email est déjà utilisé",
    invalidRole: "Rôle invalide",
declarationsWillAppear: "Les déclarations apparaîtront ici automatiquement",
    
    // Status
    pending: "En attente",
    active: "Actif",
    rejected: "Rejeté",
    
    // Categories
    appliance: "Électroménager",
    computer: "Informatique",
    phone: "Téléphonie",
    audioVideo: "Audio/Vidéo",
    airConditioning: "Climatisation",
    plumbing: "Plomberie",
    other: "Autre",
    
    // Dates
    today: "Aujourd'hui",
    yesterday: "Hier",
    daysAgo: "Il y a {days} jours",
    
    // Form Labels
    selectCategory: "Sélectionner une catégorie",
    selectClient: "Sélectionner un client",
    addAnotherItem: "Ajouter un autre élément...",
    addPhoto: "Ajouter une photo",
    removePhoto: "Supprimer la photo",
    checkProvidedItems: "Cocher les éléments fournis", // AJOUTÉ
    
    // Status Badges
    status_new: "Nouvelle",
    status_in_progress: "En cours",
    status_resolved: "Réglée",
    
    // Accessories
    accessoriesIncluded: "Accessoires inclus",
    powerCable: "Câble d'alimentation",
    remoteControl: "Télécommande",
    userManual: "Manuel d'utilisation",
    originalBox: "Boîte d'origine",
    originalAccessories: "Accessoires d'origine",
    warranty: "Garantie",
  },
  
  ar: {
    // App
    appName: "SAV Pro",
    appSubtitle: "خدمة ما بعد البيع المهنية",
    
    // Auth
    login: "تسجيل الدخول",
    register: "التسجيل",
    waitingApproval: "في انتظار الموافقة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    yourPassword: "كلمة المرور الخاصة بك",
    confirmPassword: "تأكيد كلمة المرور",
    fullName: "الاسم الكامل",
    role: "الدور",
    commercial: "تجاري",
    technician: "فني",
    loginButton: "تسجيل الدخول",
    registerButton: "التسجيل",
    noAccount: "ليس لديك حساب ؟",
    haveAccount: "لديك حساب بالفعل ؟",
    approvalMessage: "سيتم تفعيل حسابك بعد الموافقة",
    confirmLogout: "هل تريد حقًا تسجيل الخروج؟",
    logoutError: "فشل تسجيل الخروج",
    pendingApproval: "في انتظار الموافقة",
    adminApproval: "الموافقة من قبل المدير",
    approvalNotification: "سيتم إعلامك بالبريد الإلكتروني بمجرد الموافقة",
    passwordMinLength: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل",
    registerSuccess: "تم التسجيل بنجاح",
    registerFailed: "فشل التسجيل",
    
    // Profile
    profile: "الملف الشخصي",
    managePersonalInfo: "إدارة معلوماتك الشخصية",
    editName: "تعديل الاسم",
    yourName: "اسمك",
    name: "الاسم",
    nameRequired: "الاسم لا يمكن أن يكون فارغًا",
    nameUpdated: "تم تحديث الاسم",
    updateFailed: "فشل التحديث",
    user: "مستخدم",
    language: "اللغة",
    chooseAppLanguage: "اختر لغة التطبيق",
    french: "الفرنسية",
    arabic: "العربية",
    defaultLanguage: "اللغة الافتراضية",
    arabicLanguage: "اللغة العربية",
    notifications: "الإشعارات",
    receivePushNotifications: "تلقي الإشعارات الفورية",
    pushNotifications: "الإشعارات الفورية",
    notificationsDescription: "إقرارات، تحديثات، تذكيرات",
    logout: "تسجيل الخروج",
    version: "الإصدار",
    changeLanguage: "تغيير اللغة",
    selectLanguage: "اختر اللغة",
    choosePreferredLanguage: "اختر لغتك المفضلة",
    confirmLanguageChange: "هل تريد تغيير اللغة إلى",
    informationsSaved: "تم حفظ معلوماتك",
    
    // Clients
    clients: "العملاء",
    clientList: "قائمة العملاء",
    addClient: "إضافة عميل",
    newClient: "عميل جديد",
    clientName: "اسم العميل",
    clientPhone: "الهاتف",
    clientAddress: "العنوان",
    noClients: "لا يوجد عملاء",
    clientDetails: "تفاصيل العميل",
    call: "اتصال",
    emailAction: "بريد إلكتروني",
    coordinates: "إحداثيات",
    loadingClients: "جاري تحميل العملاء...",
    emptyClientsMessage: "اضغط على + لإضافة عميلك الأول",
    unknownClient: "عميل غير معروف",
    
    // Declarations
    declarations: "الإقرارات",
    declarationList: "قائمة الإقرارات",
    addDeclaration: "إقرار جديد",
    newDeclaration: "إقرار جديد",
    declarationDetail: "تفاصيل الإقرار",
    productName: "اسم المنتج",
    reference: "المرجع",
    serialNumber: "الرقم التسلسلي",
    category: "الفئة",
    description: "الوصف",
    accessories: "الملحقات",
    photo: "صورة",
    status: "الحالة",
    new: "جديد",
    inProgress: "قيد التنفيذ",
    resolved: "تم الحل",
    all: "الكل",
    takeCharge: "تولي المسؤولية",
    markResolved: "تم الحل",
    delete: "حذف",
    confirmDelete: "تأكيد الحذف",
    remarks: "ملاحظات",
    history: "السجل",
    created: "تم الإنشاء",
    taken: "تم التولي",
    resolvedAt: "تم الحل",
    loadingDeclarations: "جاري تحميل الإقرارات...",
    noDeclarations: "لا توجد إقرارات",
    emptyDeclarationsMessage: "اضغط على + لإنشاء أول إقرار",
    productInfo: "معلومات المنتج",
    responsibles: "المسؤولون",
    includedAccessories: "الملحقات المضمنة",
    technicianRemarks: "ملاحظات الفني",
    client: "العميل",
    commercialResponsible: "التجاري",
    technicianAssigned: "الفني المعين",
    noDescription: "لم يتم تقديم وصف",
    problemDescription: "وصف المشكلة",
    
    // Common
    save: "حفظ",
    cancel: "إلغاء",
    create: "إنشاء",
    update: "تحديث",
    confirm: "تأكيد",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    required: "مطلوب",
    optional: "اختياري",
    select: "اختر",
    add: "إضافة",
    back: "رجوع",
    close: "إغلاق",
    yes: "نعم",
    no: "لا",
    ok: "موافق",
    search: "بحث",
    filter: "تصفية",
    apply: "تطبيق",
    reset: "إعادة تعيين",
    
    // Messages
    loadingDetails: "جاري تحميل التفاصيل...",
    pullToRefresh: "اسحب للتحديث",
    operationSuccess: "تمت العملية بنجاح",
    operationFailed: "فشلت العملية",
    
    // Errors
    networkError: "خطأ في الشبكة",
    serverError: "خطأ في الخادم",
    unauthorized: "غير مصرح",
    invalidCredentials: "بيانات الدخول غير صحيحة",
    fieldRequired: "هذا الحقل مطلوب",
    invalidEmail: "بريد إلكتروني غير صالح",
    invalidPhone: "هاتف غير صالح",
    passwordsDontMatch: "كلمات المرور غير متطابقة",
    emailAlreadyUsed: "هذا البريد الإلكتروني مستخدم بالفعل",
    invalidRole: "دور غير صالح",
    
    // Status
    pending: "قيد الانتظار",
    active: "نشط",
    rejected: "مرفوض",
    
    // Categories
    appliance: "الأجهزة المنزلية",
    computer: "معلوماتية",
    phone: "هاتف",
    audioVideo: "صوت/فيديو",
    airConditioning: "تكييف الهواء",
    plumbing: "سباكة",
    other: "آخر",
    
    // Dates
    today: "اليوم",
    yesterday: "أمس",
    daysAgo: "قبل {days} يوم",
    
    // Form Labels
    selectCategory: "اختر الفئة",
    selectClient: "اختر العميل",
    addAnotherItem: "إضافة عنصر آخر...",
    addPhoto: "إضافة صورة",
    removePhoto: "حذف الصورة",
    checkProvidedItems: "تحقق من العناصر المقدمة", // AJOUTÉ
    
    // Status Badges
    status_new: "جديد",
    status_in_progress: "قيد التنفيذ",
    status_resolved: "تم الحل",
    declarationsWillAppear: "ستظهر الإقرارات هنا تلقائياً",

    // Accessories
    accessoriesIncluded: "الملحقات المضمنة",
    powerCable: "كابل الطاقة",
    remoteControl: "جهاز التحكم",
    userManual: "دليل المستخدم",
    originalBox: "الصندوق الأصلي",
    originalAccessories: "الملحقات الأصلية",
    warranty: "الضمان",
  }
};

const LANGUAGE_STORAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "ar")) {
        setLanguageState(savedLanguage);
        // Forcer RTL pour l'arabe
        if (savedLanguage === "ar" && !I18nManager.isRTL) {
          I18nManager.forceRTL(true);
        }
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    } finally {
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    // Forcer RTL pour l'arabe
    if (lang === "ar") {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
    
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    if (TRANSLATIONS[language] && TRANSLATIONS[language][key]) {
      let translation = TRANSLATIONS[language][key];
      
      // Remplacer les paramètres dans la traduction
      if (params) {
        Object.keys(params).forEach(paramKey => {
          translation = translation.replace(`{${paramKey}}`, params[paramKey]);
        });
      }
      
      return translation;
    }
    console.warn(`Translation key not found: ${key} in ${language}`);
    return key;
  };

  const isRTL = language === "ar";

  if (!isReady) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}