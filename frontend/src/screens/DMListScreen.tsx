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
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.dmItem}
      onPress={() => navigation.navigate("DMChat", { user: item.user })}
    >
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
      <View style={styles.dmInfo}>
        <Text style={styles.username}>{item.user.username}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white" }}
      edges={["bottom"]}
    >
      {/* Üst bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      {/* DM Listesi */}
      <FlatList
        data={mockDMs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  listContent: {
    padding: 8,
  },
  dmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
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
    color: "#222",
  },
  lastMessage: {
    color: "#666",
    fontSize: 14,
    marginTop: 2,
  },
  time: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 8,
  },
});

export default DMListScreen;
