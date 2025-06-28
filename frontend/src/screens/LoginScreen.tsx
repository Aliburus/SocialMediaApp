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

const { width } = Dimensions.get("window");

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Instagram</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Telefon numarası, kullanıcı adı veya e-posta"
                  placeholderTextColor="#8e8e8e"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#8e8e8e"
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
                    color="#8e8e8e"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Şifreni mi unuttun?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>YA DA</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Facebook Login */}
            <TouchableOpacity style={styles.facebookButton}>
              <Ionicons name="logo-facebook" size={20} color="#1877f2" />
              <Text style={styles.facebookButtonText}>
                Facebook ile devam et
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom */}
          <View style={styles.bottomContainer}>
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Hesabın yok mu? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register" as never)}
              >
                <Text style={styles.signupLink}>Kaydol.</Text>
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
    backgroundColor: "#fff",
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
    color: "#000",
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
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#262626",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 14,
    padding: 4,
  },
  loginButton: {
    backgroundColor: "#0095f6",
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    color: "#00376b",
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
    backgroundColor: "#dbdbdb",
  },
  dividerText: {
    color: "#8e8e8e",
    fontSize: 13,
    fontWeight: "600",
    marginHorizontal: 18,
  },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  facebookButtonText: {
    color: "#1877f2",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
    borderTopColor: "#dbdbdb",
  },
  signupText: {
    color: "#8e8e8e",
    fontSize: 12,
  },
  signupLink: {
    color: "#0095f6",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default LoginScreen;
