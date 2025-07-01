import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
}

const friendsList = [
  {
    id: "1",
    username: "ahmet_yilmaz",
    avatar: "https://picsum.photos/200/200?random=1",
    isOnline: true,
  },
  {
    id: "2",
    username: "ayse_demir",
    avatar: "https://picsum.photos/200/200?random=2",
    isOnline: false,
  },
  // ... diğer mock arkadaşlar ...
];

export const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose }) => {
  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.friendAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendUsername}>{item.username}</Text>
        <Text style={styles.friendStatus}>
          {item.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Text>
      </View>
      <TouchableOpacity style={styles.sendButton}>
        <Ionicons name="paper-plane" size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={["bottom"]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Paylaş</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="add-circle" size={32} color="#007AFF" />
            </View>
            <Text style={styles.shareOptionText}>Hikaye</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="chatbubble" size={32} color="#007AFF" />
            </View>
            <Text style={styles.shareOptionText}>Mesaj</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="copy" size={32} color="#007AFF" />
            </View>
            <Text style={styles.shareOptionText}>Bağlantıyı Kopyala</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.friendsSection}>
          <Text style={styles.friendsSectionTitle}>Arkadaşlar</Text>
          <FlatList
            data={friendsList}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  shareOption: {
    alignItems: "center",
  },
  shareOptionIcon: {
    marginBottom: 4,
  },
  shareOptionText: {
    fontSize: 14,
  },
  friendsSection: {
    flex: 1,
    padding: 16,
  },
  friendsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  friendAvatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4cd137",
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontWeight: "bold",
    fontSize: 15,
  },
  friendStatus: {
    fontSize: 12,
    color: "#888",
  },
  sendButton: {
    padding: 8,
  },
});
