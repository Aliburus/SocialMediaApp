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

const { width } = Dimensions.get("window");

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Instagram</Text>
                <Text style={styles.subtitle}>
                  Arkadaşlarının fotoğraflarını ve videolarını görmek için
                  kaydol.
                </Text>
              </View>

              {/* Facebook Button */}
              <TouchableOpacity style={styles.facebookButton}>
                <Ionicons name="logo-facebook" size={20} color="#fff" />
                <Text style={styles.facebookButtonText}>
                  Facebook ile Kaydol
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>YA DA</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cep telefonu numarası veya e-posta"
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
                    placeholder="Ad ve soyad"
                    placeholderTextColor="#8e8e8e"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Kullanıcı adı"
                    placeholderTextColor="#8e8e8e"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
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

                <TouchableOpacity style={styles.registerButton}>
                  <Text style={styles.registerButtonText}>Kaydol</Text>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  Kaydolarak,{" "}
                  <Text style={styles.termsLink}>Hizmet Şartlarımızı</Text>,{" "}
                  <Text style={styles.termsLink}>Veri İlkemizi</Text> ve{" "}
                  <Text style={styles.termsLink}>Çerez kullanımımızı</Text>{" "}
                  kabul etmiş olursun.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom */}
          <View style={styles.bottomContainer}>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Hesabın var mı? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Giriş yap.</Text>
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
    color: "#000",
    fontFamily: Platform.OS === "ios" ? "Billabong" : "serif",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: "#8e8e8e",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
  facebookButton: {
    backgroundColor: "#1877f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 5,
    marginBottom: 20,
  },
  facebookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
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
  formContainer: {
    marginBottom: 20,
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
  registerButton: {
    backgroundColor: "#0095f6",
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  termsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: "#8e8e8e",
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: "#00376b",
    fontWeight: "600",
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
    borderTopColor: "#dbdbdb",
  },
  loginText: {
    color: "#8e8e8e",
    fontSize: 12,
  },
  loginLink: {
    color: "#0095f6",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default RegisterScreen;
