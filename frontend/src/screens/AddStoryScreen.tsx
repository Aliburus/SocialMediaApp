import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const AddStoryScreen: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [lastTap, setLastTap] = useState<number>(0);

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
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPreview(photo.uri);
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function shareStory() {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) {
        alert("Kullanıcı bulunamadı");
        return;
      }
      await api.post("/users/stories", {
        user: userId,
        image: preview,
      });
      alert("Story paylaşıldı!");
      navigation.goBack();
    } catch (err) {
      alert("Story paylaşılırken hata oluştu");
    }
  }

  const pickFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Galeriye erişim izni vermeniz gerekiyor.");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreview(result.assets[0].uri);
      }
    } catch (err) {
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
            padding: 10,
          }}
          onPress={pickFromGallery}
        >
          <Ionicons name="images" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.innerCircle} />
          </TouchableOpacity>
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
});

export default AddStoryScreen;
