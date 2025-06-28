import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SavedDetailScreen: React.FC = ({ route }: any) => {
  const { post } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: post?.image }} style={styles.image} />
      <Text style={styles.title}>{post?.title || "Kaydedilen Gönderi"}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: 300, height: 300, borderRadius: 16, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222" },
});

export default SavedDetailScreen;
