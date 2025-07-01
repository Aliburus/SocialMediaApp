import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const mockDMs = [
  {
    id: "1",
    user: {
      username: "alice_wonder",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    lastMessage: "Naber?",
    time: "2d",
  },
  {
    id: "2",
    user: {
      username: "bob_photographer",
      avatar:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    lastMessage: "Fotoğraflar harika!",
    time: "1d",
  },
];

const DMListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.dmItem, { borderBottomColor: colors.border }]}
      onPress={() => navigation.navigate("DMChat", { user: item.user })}
    >
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
      <View style={styles.dmInfo}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.user.username}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {item.time}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      {/* Üst bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, flex: 1, textAlign: "left" },
          ]}
        >
          Direct
        </Text>
        <TouchableOpacity style={{ marginLeft: 12 }}>
          <Ionicons name="create-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* DM Listesi */}
      <FlatList
        data={mockDMs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 8,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 8,
  },
  dmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  dmInfo: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default DMListScreen;
