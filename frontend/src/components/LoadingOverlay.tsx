import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  type?: "default" | "upload" | "processing";
  progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = "Loading...",
  type = "default",
  progress,
}) => {
  const { colors } = useTheme();

  const getIcon = () => {
    switch (type) {
      case "upload":
        return "cloud-upload";
      case "processing":
        return "sync";
      default:
        return "hourglass";
    }
  };

  const getMessage = () => {
    if (type === "upload" && progress !== undefined) {
      return `Uploading... %${Math.round(progress)}`;
    }
    return message;
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIcon() as any}
              size={32}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.message, { color: colors.text }]}>
            {getMessage()}
          </Text>

          {type === "default" && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.spinner}
            />
          )}

          {type === "upload" && progress !== undefined && (
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {type === "processing" && (
            <View style={styles.processingContainer}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.processingSpinner}
              />
              <Text
                style={[styles.processingText, { color: colors.textSecondary }]}
              >
                İşleniyor...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.8,
    maxWidth: 300,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
  progressContainer: {
    width: "100%",
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  processingSpinner: {
    marginRight: 8,
  },
  processingText: {
    fontSize: 14,
  },
});

export default LoadingOverlay;
