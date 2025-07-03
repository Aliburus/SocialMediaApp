import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark, setTheme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.item}>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Karanlık Mod
        </Text>
        <Switch
          value={isDark}
          onValueChange={() => setTheme(isDark ? "light" : "dark")}
        />
      </View>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Archive")}
      >
        <Ionicons
          name="archive-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>Arşiv</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Notifications")}
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>Bildirimler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <Ionicons
          name="key-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>
          Şifre Değiştir
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  text: {
    fontSize: 16,
  },
});

export default SettingsScreen;
