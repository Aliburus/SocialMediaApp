import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { createStory } from "../services/storyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import Svg, { Circle } from "react-native-svg";
import { Animated as RNAnimated } from "react-native";
import { useToast } from "../context/ToastContext";
import LoadingOverlay from "../components/LoadingOverlay";
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const CIRCLE_SIZE = 74;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AddStoryScreen: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoRef, setVideoRef] = useState<any>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Kamera izni gerekiyor");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreview(result.assets[0].uri);
        setVideoReady(true);
      }
    } catch (error) {
      console.error("Fotoğraf çekme hatası:", error);
      showToast("Fotoğraf çekilirken hata oluştu", "error");
    }
  };

  const takeVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Kamera izni gerekiyor");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        videoMaxDuration: 8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreview(result.assets[0].uri);
        setVideoReady(true);
      }
    } catch (error) {
      console.error("Video çekme hatası:", error);
      showToast("Video çekilirken hata oluştu", "error");
    }
  };

  const getFileName = (uri: string) => {
    return uri.split("/").pop() || `story_${Date.now()}`;
  };
  const getMimeType = (uri: string) => {
    if (uri.endsWith(".mp4")) return "video/mp4";
    if (uri.endsWith(".mov")) return "video/quicktime";
    if (uri.endsWith(".avi")) return "video/x-msvideo";
    if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
    if (uri.endsWith(".png")) return "image/png";
    if (uri.endsWith(".gif")) return "image/gif";
    return "application/octet-stream";
  };

  async function shareStory() {
    setUploading(true);
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
        return;
      }
      if (!preview) return;

      // Video kontrolü - hem dosya uzantısı hem de mode'a göre
      const isVideo =
        preview.endsWith(".mp4") ||
        preview.endsWith(".mov") ||
        mode === "video";
      const mediaFile = {
        uri: preview,
        name: getFileName(preview),
        type: getMimeType(preview),
      };

      await createStory({
        user: userId,
        ...(isVideo ? { videoFile: mediaFile } : { imageFile: mediaFile }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        showToast("🎉 Story başarıyla paylaşıldı!", "success");
        setUploading(false);
        setUploadProgress(0);
        navigation.goBack();
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      showToast("Story paylaşılırken hata oluştu", "error");
    }
  }

  const pickFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showToast("Galeriye erişim izni vermeniz gerekiyor", "warning");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreview(result.assets[0].uri);
        setVideoReady(true);
      }
    } catch (err) {
      console.error("Galeri hatası:", err);
      showToast("Galeri açılırken bir hata oluştu", "error");
    }
  };

  if (preview) {
    const isVideo = preview.endsWith(".mp4") || preview.endsWith(".mov");
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              backgroundColor: "#222a",
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="eye" size={24} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Hikaye Önizlemesi
            </Text>
          </View>
          {isVideo ? (
            <View style={styles.videoContainer}>
              <Video
                ref={(ref) => setVideoRef(ref)}
                source={{ uri: preview }}
                style={styles.videoPlayer}
                resizeMode={ResizeMode.COVER}
                shouldPlay={!isPaused}
                isLooping={false}
                onLoad={(data: any) => {
                  setVideoDuration(data.durationMillis || 0);
                }}
                onPlaybackStatusUpdate={(status: any) => {
                  if (status.isLoaded && !isPaused) {
                    setVideoProgress(
                      status.positionMillis / (status.durationMillis || 1)
                    );
                    setIsPlaying(status.isPlaying);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.videoOverlay}
                onPressIn={() => {
                  setIsPaused(true);
                  videoRef?.pauseAsync();
                }}
                onPressOut={() => {
                  setIsPaused(false);
                  videoRef?.playAsync();
                }}
              >
                {isPaused && (
                  <View style={styles.playButton}>
                    <Ionicons name="pause" size={40} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.videoProgressBar}>
                <View
                  style={[
                    styles.videoProgressFill,
                    { width: `${videoProgress * 100}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: preview }}
              style={{
                width: "90%",
                height: 400,
                borderRadius: 24,
                marginBottom: 32,
                shadowColor: "#000",
                shadowOpacity: 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                borderWidth: 2,
                borderColor: "#fff",
              }}
              resizeMode="cover"
            />
          )}
          {/* Progress Bar */}
          {uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(uploadProgress)}% yükleniyor...
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              gap: 16,
              backgroundColor: "#222a",
              borderRadius: 24,
              padding: 16,
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
              onPress={() => setPreview(null)}
            >
              <Ionicons name="close" size={20} color="#222" />
              <Text style={{ color: "#222", fontWeight: "bold", fontSize: 16 }}>
                İptal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: videoReady ? "#E91E63" : "#666",
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 32,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                minWidth: 120,
                justifyContent: "center",
              }}
              onPress={videoReady ? shareStory : undefined}
              disabled={!videoReady}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                {videoReady ? "Paylaş" : "Hazırlanıyor..."}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Story Ekle</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickFromGallery}
          >
            <Ionicons name="images" size={32} color="#fff" />
            <Text style={styles.galleryText}>Galeriden Seç</Text>
          </TouchableOpacity>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "photo" && styles.activeModeButton,
              ]}
              onPress={() => setMode("photo")}
            >
              <Ionicons
                name="camera"
                size={24}
                color={mode === "photo" ? "#E91E63" : "#fff"}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === "photo" && styles.activeModeText,
                ]}
              >
                Fotoğraf
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "video" && styles.activeModeButton,
              ]}
              onPress={() => setMode("video")}
            >
              <Ionicons
                name="videocam"
                size={24}
                color={mode === "video" ? "#E91E63" : "#fff"}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === "video" && styles.activeModeText,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={mode === "photo" ? takePhoto : takeVideo}
          >
            <Ionicons
              name={mode === "photo" ? "camera" : "videocam"}
              size={32}
              color="#fff"
            />
            <Text style={styles.captureText}>
              {mode === "photo" ? "Fotoğraf Çek" : "Video Çek"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LoadingOverlay
        visible={uploading}
        type="upload"
        progress={uploadProgress}
        message="Story yükleniyor..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },
  galleryButton: {
    backgroundColor: "#222a",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  galleryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222a",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  activeModeButton: {
    backgroundColor: "#E91E63",
  },
  modeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activeModeText: {
    color: "#fff",
  },
  captureButton: {
    backgroundColor: "#E91E63",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  captureText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E91E63",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  videoContainer: {
    width: "90%",
    height: 400,
    borderRadius: 24,
    marginBottom: 32,
    position: "relative",
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#0008",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  videoProgressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#0008",
  },
  videoProgressFill: {
    height: "100%",
    backgroundColor: "#E91E63",
  },
});

export default AddStoryScreen;
