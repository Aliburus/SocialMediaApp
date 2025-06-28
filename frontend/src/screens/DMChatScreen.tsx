import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

const mockMessages = [
  { id: "1", fromMe: false, text: "Selam!" },
  { id: "2", fromMe: true, text: "Merhaba!" },
  { id: "3", fromMe: false, text: "Nasılsın?" },
  { id: "4", fromMe: true, text: "İyiyim, sen?" },
];

const DMChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = (route.params as any) || {};
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white" }}
      edges={["bottom"]}
    >
      {/* Üst bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <Image
          source={{
            uri: user?.avatar || "https://placehold.co/100x100/000/fff",
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{user?.username || "kullanici"}</Text>
      </View>
      {/* Mesajlar */}
      <FlatList
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.fromMe ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        inverted
      />
      {/* Mesaj yazma kutusu */}
      <View style={[styles.inputBar, { bottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity>
          <Ionicons name="send" size={24} color="#E91E63" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 10,
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#222",
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: "#E91E63",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#222",
    fontSize: 15,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
});

export default DMChatScreen;
