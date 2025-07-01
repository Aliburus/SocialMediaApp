import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const UserProfileScreen: React.FC = ({ route }: any) => {
  const { user } = route.params;
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Image source={{ uri: user?.avatar }} style={styles.avatar} />
      <Text style={[styles.username, { color: colors.text }]}>
        {user?.username}
      </Text>
      <Text style={[styles.fullName, { color: colors.textSecondary }]}>
        {user?.fullName}
      </Text>
      <Text style={[styles.bio, { color: colors.textSecondary }]}>
        {user?.bio}
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
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 24 },
  username: { fontSize: 22, fontWeight: "bold" },
  fullName: { fontSize: 18, marginTop: 8 },
  bio: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default UserProfileScreen;
