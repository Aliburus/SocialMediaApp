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

const AddPostScreen: React.FC = () => {
  const { colors } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeriye erişim izni vermeniz gerekiyor.");
      } else {
        pickImage();
      }
    })();
  }, []);

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
      await createPost({ image, description, user: userId });
      Alert.alert("Başarılı", "Post paylaşıldı!");
      setImage(null);
      setDescription("");
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
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>
            Fotoğraf seçmek için tıkla
          </Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePicker: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  image: {
    width: 220,
    height: 220,
    resizeMode: "cover",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 48,
  },
  button: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default AddPostScreen;
