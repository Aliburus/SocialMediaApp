import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const AddStoryScreen: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

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

  if (preview) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <Image
          source={{ uri: preview }}
          style={{ flex: 1, width: "100%" }}
          resizeMode="cover"
        />
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => setPreview(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureButton, { backgroundColor: "#E91E63" }]}
            onPress={() => alert("Story paylaşıldı!")}
          >
            <Ionicons name="send" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse" size={28} color="#fff" />
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
