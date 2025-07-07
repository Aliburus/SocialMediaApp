import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export type FollowButtonType =
  | "follow"
  | "unfollow"
  | "accept"
  | "reject"
  | "follow_back"
  | "cancel_request"
  | "pending_request";

interface FollowButtonProps {
  type: FollowButtonType;
  onPress: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  style?: any;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  type,
  onPress,
  disabled = false,
  size = "medium",
  style,
}) => {
  const { colors } = useTheme();

  const getButtonConfig = () => {
    switch (type) {
      case "follow":
        return {
          text: "Takip Et",
          backgroundColor: colors.primary,
          textColor: colors.background,
          borderColor: colors.primary,
        };
      case "unfollow":
        return {
          text: "Takipten Çık",
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
      case "accept":
        return {
          text: "Onayla",
          backgroundColor: colors.primary,
          textColor: colors.background,
          borderColor: colors.primary,
        };
      case "reject":
        return {
          text: "Reddet",
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
      case "follow_back":
        return {
          text: "Geri Takip Et",
          backgroundColor: colors.primary,
          textColor: colors.background,
          borderColor: colors.primary,
        };
      case "cancel_request":
        return {
          text: "İsteği İptal Et",
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
      case "pending_request":
        return {
          text: "Onay Bekliyor",
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
      default:
        return {
          text: "Takip Et",
          backgroundColor: colors.primary,
          textColor: colors.background,
          borderColor: colors.primary,
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          borderRadius: 4,
        };
      case "large":
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          borderRadius: 8,
        };
      default: // medium
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          borderRadius: 6,
        };
    }
  };

  const config = getButtonConfig();
  const sizeConfig = getSizeConfig();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          borderWidth: 1,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: sizeConfig.fontSize,
            fontWeight: "bold",
          },
        ]}
      >
        {config.text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
});

export default FollowButton;
