import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  size?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 24 }) => {
  const { isDark, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleToggle}>
      <Ionicons
        name={isDark ? "sunny" : "moon"}
        size={size}
        color={isDark ? "#FFD700" : "#666666"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
  },
});
