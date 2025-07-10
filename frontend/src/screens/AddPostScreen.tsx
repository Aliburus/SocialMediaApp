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
import { Video, ResizeMode } from "expo-av";
import { useToast } from "../context/ToastContext";
import LoadingOverlay from "../components/LoadingOverlay";

const { height: screenHeight } = Dimensions.get("window");

const AddPostScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [media, setMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        pickMedia();
      }
    })();
  }, []);

  const takePhotoOrVideo = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type?.startsWith("video") ? "video" : "image",
      });
    }
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type?.startsWith("video") ? "video" : "image",
      });
    }
  };

  const getFileName = (uri: string) => {
    return uri.split("/").pop() || `media_${Date.now()}`;
  };
  const getMimeType = (uri: string, type: "image" | "video") => {
    if (type === "image") return "image/jpeg";
    if (type === "video") return "video/mp4";
    return "application/octet-stream";
  };

  const handleShare = async () => {
    if (!media) {
      showToast("Lütfen bir fotoğraf veya video seçin", "warning");
      return;
    }
    setLoading(true);
    setUploadProgress(0);

    // Progress simülasyonu başlat
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) {
        showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
        await AsyncStorage.removeItem("user");
        navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        return;
      }
      const mediaFile = {
        uri: media.uri,
        name: getFileName(media.uri),
        type: getMimeType(media.uri, media.type),
      };
      const newPost = await createPost({
        type: media.type === "video" ? "reel" : "post",
        description,
        user: userId,
        mediaFile,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        showToast("🎉 Post başarıyla paylaşıldı!", "success");
        setMedia(null);
        setDescription("");
        setUploadProgress(0);
        navigation.navigate("Home", { scrollToTop: true });
      }, 500);
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
      showToast(msg, "error");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
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
              disabled={loading || !media}
              style={[
                styles.shareButton,
                {
                  backgroundColor: colors.primary,
                  opacity: loading || !media ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.shareButtonText, { color: "#fff" }]}>
                {loading ? "..." : "Paylaş"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {loading && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${uploadProgress}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {Math.round(uploadProgress)}% yükleniyor...
              </Text>
            </View>
          )}

          {/* Image Section */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickMedia}>
            {media ? (
              media.type === "video" ? (
                <Video
                  source={{ uri: media.uri }}
                  style={styles.image}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                />
              ) : (
                <Image source={{ uri: media.uri }} style={styles.image} />
              )
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
                  Fotoğraf veya video seçmek için tıkla
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Camera Button */}
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: colors.surface }]}
            onPress={takePhotoOrVideo}
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

      <LoadingOverlay
        visible={loading}
        type="upload"
        progress={uploadProgress}
        message="Post yükleniyor..."
      />
    </>
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default AddPostScreen;
