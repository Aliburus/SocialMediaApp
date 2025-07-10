import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { changePassword } from "../services/api";
import { useToast } from "../context/ToastContext";

const ChangePasswordScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !newPasswordAgain) {
      showToast("Tüm alanları doldurun", "warning");
      return;
    }
    if (newPassword !== newPasswordAgain) {
      showToast("Yeni şifreler eşleşmiyor", "error");
      return;
    }
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) throw new Error("Kullanıcı bulunamadı");
      await changePassword(userId, oldPassword, newPassword);
      setLoading(false);
      showToast("🔐 Şifreniz başarıyla değiştirildi!", "success");
      navigation.goBack();
    } catch (err: any) {
      setLoading(false);
      const errorMessage =
        err?.response?.data?.message || err.message || "Bir hata oluştu";
      showToast(errorMessage, "error");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, flex: 1 }]}>
          Şifre Değiştir
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface },
          ]}
          placeholder="Eski Şifre"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-open-outline"
          size={20}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface },
          ]}
          placeholder="Yeni Şifre"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-open-outline"
          size={20}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface },
          ]}
          placeholder="Yeni Şifre (Tekrar)"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={newPasswordAgain}
          onChangeText={setNewPasswordAgain}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          {loading ? "Kaydediliyor..." : "Şifreyi Değiştir"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default ChangePasswordScreen;
