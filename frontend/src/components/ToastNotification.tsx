import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  onPress?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onClose,
  onPress,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: colors.success,
          icon: "checkmark-circle",
          iconColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: colors.error,
          icon: "close-circle",
          iconColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: colors.warning,
          icon: "warning",
          iconColor: "#fff",
        };
      case "info":
        return {
          backgroundColor: colors.info,
          icon: "information-circle",
          iconColor: "#fff",
        };
      default:
        return {
          backgroundColor: colors.primary,
          icon: "information-circle",
          iconColor: "#fff",
        };
    }
  };

  const toastStyle = getToastStyle();

  useEffect(() => {
    if (visible) {
      // Toast'u göster
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Otomatik kapat
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={toastStyle.icon as any}
            size={24}
            color={toastStyle.iconColor}
          />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
          <Ionicons name="close" size={20} color={toastStyle.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ToastNotification;
