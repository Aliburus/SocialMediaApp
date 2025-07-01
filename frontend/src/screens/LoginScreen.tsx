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
import { messages } from "../utils/messages";

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

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginService({ emailOrUsername: email, password });
      setLoading(false);
      if (onLogin) {
        onLogin(user);
      } else {
        navigation.navigate("MainTabs" as never);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || messages.loginFail);
      console.log("Login error:", {
        message: err?.message,
        code: err?.code,
        config: err?.config,
        response: err?.response,
        toJSON: err?.toJSON ? err.toJSON() : undefined,
        full: err,
      });
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
                  placeholder="Telefon numarası, kullanıcı adı veya e-posta"
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
                  placeholder="Şifre"
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
                  {loading ? "..." : "Giriş Yap"}
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
                  Şifreni mi unuttun?
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
                YA DA
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
                Hesabın yok mu?{" "}
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
                  Kaydol.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
