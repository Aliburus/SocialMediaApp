import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  containerStyle?: any;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;

  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoadingSpinner;
