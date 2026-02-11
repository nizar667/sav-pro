// components/ThemedText.tsx
import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "hero" | "title" | "h1" | "h2" | "h3" | "h4" | "headline" | "body" | "caption" | "small" | "tiny" | "link";
  t?: string; // Clé de traduction optionnelle
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  t, // Clé de traduction
  children,
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();
  const { t: translate } = useLanguage();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "hero":
        return Typography.hero;
      case "title":
        return Typography.title;
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "headline":
        return Typography.headline;
      case "body":
        return Typography.body;
      case "caption":
        return Typography.caption;
      case "small":
        return Typography.small;
      case "tiny":
        return Typography.tiny;
      case "link":
        return Typography.link;
      default:
        return Typography.body;
    }
  };

  // Utiliser la traduction si fournie, sinon le texte original
  const textContent = t ? translate(t) : children;

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest}>
      {textContent}
    </Text>
  );
}