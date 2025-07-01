import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const ReelDetailScreen: React.FC = ({ route }: any) => {
  const { reel } = route.params;
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Video
        source={{
          uri:
            reel?.video ||
            reel?.media ||
            "https://www.w3schools.com/html/mov_bbb.mp4",
        }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.COVER}
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
