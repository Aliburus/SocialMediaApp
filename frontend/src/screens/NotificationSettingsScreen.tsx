import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const NotificationSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [followEnabled, setFollowEnabled] = useState(true);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.item}>
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Push Bildirimleri
        </Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>
      <View style={styles.item}>
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Yorum Bildirimleri
        </Text>
        <Switch value={commentEnabled} onValueChange={setCommentEnabled} />
      </View>
      <View style={styles.item}>
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Takip Bildirimleri
        </Text>
        <Switch value={followEnabled} onValueChange={setFollowEnabled} />
      </View>
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

export default NotificationSettingsScreen;
