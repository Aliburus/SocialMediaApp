import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { login as loginService } from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "../context/ToastContext";
import ToastNotification from "../components/ToastNotification";

const { width } = Dimensions.get("window");

type LoginScreenProps = {
  onLogin?: (user: any) => void;
  onGoToRegister?: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onGoToRegister,
}) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
    visible: boolean;
  } | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginService({ emailOrUsername: email, password });
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
      setToast({ type: "success", message: "Welcome!", visible: true });
      if (onLogin) {
        onLogin(user);
      } else {
        navigation.navigate("MainTabs" as never);
      }
    } catch (e: any) {
      let errorMsg = "Login failed. Please check your credentials.";
      if (e?.response?.data?.message) {
        if (e.response.data.message.includes("Şifre hatalı")) {
          errorMsg = "Your password is incorrect, please try again.";
        } else if (e.response.data.message.includes("Kullanıcı bulunamadı")) {
          errorMsg = "User not found. Please check your email or username.";
        } else {
          errorMsg = e.response.data.message;
        }
      }
      setToast({ type: "error", message: errorMsg, visible: true });
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              {/* <Text style={[styles.logoText, { color: colors.text }]}>socialapp</Text> */}
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder="Phone number, username or email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text
                  style={[styles.loginButtonText, { color: colors.background }]}
                >
                  {loading ? "..." : "Log In"}
                </Text>
              </TouchableOpacity>

              {error && (
                <Text
                  style={{
                    color: colors.error,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity style={styles.forgotPassword}>
                <Text
                  style={[styles.forgotPasswordText, { color: colors.primary }]}
                >
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text
                style={[styles.dividerText, { color: colors.textSecondary }]}
              >
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>
          </View>

          {/* Bottom */}
          <View style={styles.bottomContainer}>
            <View style={styles.signupContainer}>
              <Text
                style={[styles.signupText, { color: colors.textSecondary }]}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onGoToRegister) {
                    onGoToRegister();
                  } else {
                    navigation.navigate("Register" as never);
                  }
                }}
              >
                <Text style={[styles.signupLink, { color: colors.primary }]}>
                  Sign up.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          visible={toast.visible}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Billabong" : "serif",
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 14,
    padding: 4,
  },
  loginButton: {
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
    marginHorizontal: 18,
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  signupText: {
    fontSize: 12,
  },
  signupLink: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default LoginScreen;
