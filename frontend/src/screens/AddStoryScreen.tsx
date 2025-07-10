import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { createStory } from "../services/storyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode, Audio } from "expo-av";
import Svg, { Circle } from "react-native-svg";
import { Animated as RNAnimated } from "react-native";
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const CIRCLE_SIZE = 74;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AddStoryScreen: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [progressAnimation] = useState(new Animated.Value(0));
  const isActuallyRecording = useRef(false);
  const cameraRef = useRef<any>(null);
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [lastTap, setLastTap] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const STORY_DURATION = 8000; // 8 saniye

  // Audio permissions için
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Audio permission not granted");
      }
    })();
  }, []);

  // Progress bar animasyonu
  useEffect(() => {
    if (recording) {
      progressAnimation.setValue(0);
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnimation.setValue(0);
    }
  }, [recording]);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <View style={styles.container}>
          <Text style={styles.message}>
            Kamerayı göstermek için izninize ihtiyacımız var
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function takePhoto() {
    if (cameraRef.current && !recording) {
      const photo = await cameraRef.current.takePictureAsync();
      setPreview(photo.uri);
    }
  }

  async function startRecording() {
    if (cameraRef.current && !recording) {
      setRecording(true);
      setRecordingStartTime(Date.now());
      isActuallyRecording.current = true;
      try {
        const video = await cameraRef.current.recordAsync({
          mute: false,
          maxDuration: 8, // 8 saniye
        });
        setPreview(video.uri);
      } catch (error: any) {
        console.error("Video kaydetme hatası:", error);
      } finally {
        setRecording(false);
        setRecordingStartTime(0);
        isActuallyRecording.current = false;
      }
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const getFileName = (uri: string) => {
    return uri.split("/").pop() || `story_${Date.now()}`;
  };
  const getMimeType = (uri: string) => {
    if (uri.endsWith(".mp4")) return "video/mp4";
    if (uri.endsWith(".mov")) return "video/quicktime";
    if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
    if (uri.endsWith(".png")) return "image/png";
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
        alert("Kullanıcı bulunamadı");
        return;
      }
      if (!preview) return;
      const isVideo = preview.endsWith(".mp4") || preview.endsWith(".mov");
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
        alert("Story paylaşıldı!");
        setUploading(false);
        setUploadProgress(0);
        navigation.goBack();
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      alert("Story paylaşılırken hata oluştu");
    }
  }

  const pickFromGallery = async () => {
    console.log("pickFromGallery çağrıldı");
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Galeri izni durumu:", status);
      if (status !== "granted") {
        alert("Galeriye erişim izni vermeniz gerekiyor.");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log("Galeri sonucu:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreview(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Galeri hatası:", err);
      alert("Galeri açılırken bir hata oluştu.");
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      // Çift tık algılandı
      toggleCameraFacing();
    }
    setLastTap(now);
  };

  if (preview) {
    const isVideo = preview.endsWith(".mp4") || preview.endsWith(".mov");
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Hikaye Önizlemesi
          </Text>
          {isVideo ? (
            <Video
              source={{ uri: preview }}
              style={{
                width: "90%",
                height: 400,
                borderRadius: 24,
                marginBottom: 32,
              }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
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
              }}
              onPress={() => setPreview(null)}
            >
              <Text style={{ color: "#222", fontWeight: "bold", fontSize: 16 }}>
                Vazgeç
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#E91E63",
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 32,
              }}
              onPress={shareStory}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                Paylaş
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
          }}
          onPress={handleDoubleTap}
        />
        <TouchableOpacity
          style={styles.flipButton}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            position: "absolute",
            left: 24,
            bottom: 48,
            backgroundColor: "#222a",
            borderRadius: 16,
            padding: 16,
            width: 56,
            height: 56,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => {
            console.log("Galeri ikonuna tıklandı");
            pickFromGallery();
          }}
        >
          <Ionicons name="images" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.bottomBar}>
          <View style={styles.captureButtonContainer}>
            {recording && (
              <Svg
                width={CIRCLE_SIZE}
                height={CIRCLE_SIZE}
                style={styles.progressSvg}
              >
                <AnimatedCircle
                  stroke="#fff"
                  fill="none"
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
                  strokeDashoffset={progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, CIRCUMFERENCE],
                  })}
                />
              </Svg>
            )}
            <TouchableOpacity
              style={[
                styles.captureButton,
                recording && styles.recordingButton,
              ]}
              onPress={takePhoto}
              onLongPress={startRecording}
              delayLongPress={300}
              onPressOut={async () => {
                if (
                  isActuallyRecording.current &&
                  cameraRef.current &&
                  recording
                ) {
                  const elapsed = Date.now() - recordingStartTime;
                  if (elapsed > 500) {
                    cameraRef.current.stopRecording();
                  }
                }
                setRecording(false);
                setRecordingStartTime(0);
                isActuallyRecording.current = false;
              }}
            >
              {recording ? (
                <View style={styles.recordingIndicator}>
                  <Ionicons name="stop" size={24} color="#fff" />
                </View>
              ) : (
                <View style={styles.innerCircle} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
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
  message: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  flipButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#0008",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    zIndex: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 24,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f04",
  },
  recordingButton: {
    backgroundColor: "#E91E63",
    borderColor: "#E91E63",
  },
  recordingInnerCircle: {
    backgroundColor: "#fff",
  },
  recordingIndicator: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonContainer: {
    position: "relative",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
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
});

export default AddStoryScreen;
