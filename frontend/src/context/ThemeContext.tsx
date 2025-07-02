import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

export type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof lightColors | typeof darkColors;
  setTheme: (theme: ThemeType) => void;
}

const lightColors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  primary: "#E91E63",
  secondary: "#9C27B0",
  text: "#000000",
  textSecondary: "#666666",
  border: "#E5E5E5",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E5E5E5",
  card: "#FFFFFF",
  shadow: "#000000",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
};

const darkColors = {
  background: "#000000",
  surface: "#121212",
  primary: "#E91E63",
  secondary: "#9C27B0",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  border: "#333333",
  tabBar: "#121212",
  tabBarBorder: "#333333",
  card: "#1E1E1E",
  shadow: "#000000",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("system");

  useEffect(() => {
    setTheme("system");
  }, [systemColorScheme]);

  const isDark =
    theme === "system" ? systemColorScheme === "dark" : theme === "dark";

  const colors = isDark ? darkColors : lightColors;

  const value = {
    theme,
    isDark,
    colors,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
