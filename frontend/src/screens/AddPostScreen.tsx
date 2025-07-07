import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { createPost } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight } = Dimensions.get("window");

const AddPostScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted" || cameraStatus.status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Galeriye ve kameraya erişim izni vermeniz gerekiyor."
        );
      } else {
        pickImage();
      }
    })();
  }, []);

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    if (!image) {
      Alert.alert("Hata", "Lütfen bir fotoğraf seçin.");
      return;
    }
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) {
        Alert.alert("Oturum Hatası", "Lütfen tekrar giriş yapın.");
        await AsyncStorage.removeItem("user");
        navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        return;
      }
      const newPost = await createPost({ image, description, user: userId });
      Alert.alert("Başarılı", "Post paylaşıldı!");
      setImage(null);
      setDescription("");
      navigation.navigate("Home", {
        scrollToTop: true,
        newPostId: newPost._id || newPost.id,
      });
    } catch (err: any) {
      if (err?.response) {
        console.log("[POST PAYLAŞ HATA] response:", err.response);
        console.log("[POST PAYLAŞ HATA] response.data:", err.response.data);
        console.log("[POST PAYLAŞ HATA] response.status:", err.response.status);
        console.log(
          "[POST PAYLAŞ HATA] response.headers:",
          err.response.headers
        );
      } else if (err?.request) {
        console.log("[POST PAYLAŞ HATA] request:", err.request);
      } else {
        console.log("[POST PAYLAŞ HATA] message:", err.message);
      }
      let msg = "Post paylaşılırken hata oluştu.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Yeni Gönderi
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={loading || !image}
            style={[
              styles.shareButton,
              {
                backgroundColor: colors.primary,
                opacity: loading || !image ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.shareButtonText, { color: "#fff" }]}>
              {loading ? "..." : "Paylaş"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Section */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons
                name="images-outline"
                size={60}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.placeholderText,
                  { color: colors.textSecondary },
                ]}
              >
                Fotoğraf seçmek için tıkla
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Camera Button */}
        <TouchableOpacity
          style={[styles.cameraButton, { backgroundColor: colors.surface }]}
          onPress={takePhoto}
        >
          <Ionicons name="camera" size={24} color={colors.primary} />
          <Text style={[styles.cameraButtonText, { color: colors.primary }]}>
            Kamera ile Çek
          </Text>
        </TouchableOpacity>

        {/* Description Input */}
        <View
          style={[styles.inputContainer, { backgroundColor: colors.surface }]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Açıklama ekle..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  imagePicker: {
    width: "100%",
    height: 300,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  cameraButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    minHeight: 100,
  },
});

export default AddPostScreen;
