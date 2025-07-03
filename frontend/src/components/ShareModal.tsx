import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserFriends } from "../services/api";
import { useTheme } from "../context/ThemeContext";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const [friends, setFriends] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const filteredFriends = friends.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    if (visible) {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id || userObj?.id) {
          const list = await getUserFriends(userObj._id || userObj.id);
          setFriends(list);
        }
      })();
    }
  }, [visible]);

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.friendItem, { backgroundColor: colors.surface }]}
    >
      <View style={styles.friendAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
        {item.isOnline && (
          <View
            style={[styles.onlineIndicator, { borderColor: colors.surface }]}
          />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendUsername, { color: colors.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.friendStatus, { color: colors.textSecondary }]}>
          {item.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Text>
      </View>
      <TouchableOpacity style={styles.sendButton}>
        <Ionicons name="paper-plane" size={20} color={colors.primary} />
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
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <View
          style={[styles.modalHeader, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Paylaş
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.shareOptionText, { color: colors.text }]}>
              Hikaye
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="chatbubble" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.shareOptionText, { color: colors.text }]}>
              Mesaj
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption}>
            <View style={styles.shareOptionIcon}>
              <Ionicons name="copy" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.shareOptionText, { color: colors.text }]}>
              Bağlantıyı Kopyala
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.friendsSection}>
          <Text style={[styles.friendsSectionTitle, { color: colors.text }]}>
            Arkadaşlar
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              color: colors.text,
              fontSize: 16,
              height: 40,
              marginBottom: 12,
            }}
            placeholder="Arkadaş ara..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id || item._id || item.username}
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
