import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockComments = [
  { id: "1", user: "user1", text: "Harika fotoğraf!" },
  { id: "2", user: "user2", text: "Çok beğendim." },
];

const CommentScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Yorumlar</Text>
      <FlatList
        data={mockComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text style={styles.user}>{item.user}:</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
        style={{ width: "100%" }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Yorum ekle..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#222",
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  user: {
    fontWeight: "bold",
    marginRight: 6,
    color: "#333",
  },
  text: {
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: "#222",
  },
  sendButton: {
    backgroundColor: "#E91E63",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CommentScreen;
