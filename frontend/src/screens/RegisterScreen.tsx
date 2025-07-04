import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { register as registerService } from "../services/authService";
import { messages } from "../utils/messages";

const { width } = Dimensions.get("window");

type RegisterScreenProps = {
  onGoToLogin?: () => void;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onGoToLogin }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gender, setGender] = useState<string>("");

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await registerService({
        name: fullName,
        username,
        email,
        password,
        gender,
      });
      setLoading(false);
      setSuccess(messages.registerSuccess);
      setTimeout(() => {
        if (onGoToLogin) onGoToLogin();
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || messages.registerFail);
      console.log("Register error:", {
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                {/* <Text style={[styles.logoText, { color: colors.text }]}>socialapp</Text> */}
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Arkadaşlarının fotoğraflarını ve videolarını görmek için
                  kaydol.
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border },
                  ]}
                />
                <Text
                  style={[styles.dividerText, { color: colors.textSecondary }]}
                >
                  YA DA
                </Text>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border },
                  ]}
                />
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
                    placeholder="Cep telefonu numarası veya e-posta"
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
                    placeholder="Ad ve soyad"
                    placeholderTextColor={colors.textSecondary}
                    value={fullName}
                    onChangeText={setFullName}
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
                    placeholder="Kullanıcı adı"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
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

                <View style={styles.inputContainer}>
                  <Text
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Cinsiyet
                  </Text>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 16,
                      }}
                      onPress={() => setGender("male")}
                    >
                      <Ionicons
                        name={
                          gender === "male"
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={{ color: colors.text, marginLeft: 6 }}>
                        Erkek
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 16,
                      }}
                      onPress={() => setGender("female")}
                    >
                      <Ionicons
                        name={
                          gender === "female"
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={{ color: colors.text, marginLeft: 6 }}>
                        Kadın
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center" }}
                      onPress={() => setGender("")}
                    >
                      <Ionicons
                        name={
                          gender === "" ? "radio-button-on" : "radio-button-off"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={{ color: colors.text, marginLeft: 6 }}>
                        Belirtmek istemiyorum
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.registerButtonText,
                      { color: colors.background },
                    ]}
                  >
                    {loading ? "..." : "Kaydol"}
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
                {success && (
                  <Text
                    style={{
                      color: colors.success,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {success}
                  </Text>
                )}
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text
                  style={[styles.termsText, { color: colors.textSecondary }]}
                >
                  Kaydolarak,{" "}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Hizmet Şartlarımızı
                  </Text>
                  ,{" "}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Veri İlkemizi
                  </Text>{" "}
                  ve{" "}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Çerez kullanımımızı
                  </Text>{" "}
                  kabul etmiş olursun.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom */}
          <View style={styles.bottomContainer}>
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Hesabın var mı?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onGoToLogin) {
                    onGoToLogin();
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Giriş yap.
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: "center",
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Billabong" : "serif",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
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
  registerButton: {
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  termsContainer: {
    marginTop: 24,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
  },
  termsLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  loginText: {
    fontSize: 12,
  },
  loginLink: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default RegisterScreen;
