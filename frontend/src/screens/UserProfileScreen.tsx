import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const UserProfileScreen: React.FC = ({ route }: any) => {
  const { user } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: user?.avatar }} style={styles.avatar} />
      <Text style={styles.username}>{user?.username}</Text>
      <Text style={styles.fullName}>{user?.fullName}</Text>
      <Text style={styles.bio}>{user?.bio}</Text>
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
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 24 },
  username: { fontSize: 22, fontWeight: "bold", color: "#222" },
  fullName: { fontSize: 18, color: "#444", marginTop: 8 },
  bio: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default UserProfileScreen;
