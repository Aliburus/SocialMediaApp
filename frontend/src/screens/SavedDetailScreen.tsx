import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const SavedDetailScreen: React.FC = ({ route }: any) => {
  const { post } = route.params;
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Image source={{ uri: post?.image }} style={styles.image} />
      <Text style={[styles.title, { color: colors.text }]}>
        {post?.title || "Kaydedilen Gönderi"}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: 300, height: 300, borderRadius: 16, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "bold" },
});

export default SavedDetailScreen;
