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
      console.log("[POST PAYLAŞ] userObj:", userObj);
      console.log("[POST PAYLAŞ] userId:", userId);
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
      console.log("[POST PAYLAŞ HATA] Tam Hata:", err);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[
          styles.imagePicker,
          {
            marginTop: insets.top,
            height: screenHeight / 2,
          },
        ]}
        onPress={pickImage}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={{ color: "#fff", fontSize: 18, marginBottom: 20 }}>
              Fotoğraf seçmek için tıkla
            </Text>
            <View style={styles.iconContainer}>
              <Ionicons name="images-outline" size={40} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cameraButton, { backgroundColor: colors.primary }]}
        onPress={takePhoto}
      >
        <Ionicons name="camera" size={24} color="#fff" />
        <Text
          style={{
            color: "#fff",
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Kamera ile Çek
        </Text>
      </TouchableOpacity>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
          },
        ]}
        placeholder="Açıklama (isteğe bağlı)"
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleShare}
        disabled={loading}
      >
        <Text style={{ color: colors.background, fontWeight: "bold" }}>
          {loading ? "Paylaşılıyor..." : "Paylaş"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imagePicker: {
    width: "100%",
    backgroundColor: "#000",
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
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 16,
  },
  input: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 48,
    margin: 16,
  },
  button: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    marginHorizontal: 16,
  },
});

export default AddPostScreen;
