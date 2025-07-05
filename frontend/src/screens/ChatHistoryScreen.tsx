import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const ChatHistoryScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user } = (route.params as any) || {};
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Üst bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Chat History</Text>
      </View>

      {/* İçerik */}
      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          Chat history özelliği yakında eklenecek...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholder: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default ChatHistoryScreen;
