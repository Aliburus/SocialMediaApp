import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Video } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ReelDetailScreen: React.FC = ({ route }: any) => {
  const { reel } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Video
        source={{
          uri:
            reel?.video ||
            reel?.media ||
            "https://www.w3schools.com/html/mov_bbb.mp4",
        }}
        style={styles.video}
        useNativeControls
        resizeMode="cover"
        shouldPlay
        isLooping
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  video: { width, height },
});

export default ReelDetailScreen;
