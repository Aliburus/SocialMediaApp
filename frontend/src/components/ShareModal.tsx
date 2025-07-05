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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserFriends } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { sendMessage } from "../services/api";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  post?: any;
  story?: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  post,
  story,
}) => {
  const { colors } = useTheme();
  const [friends, setFriends] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedFriend, setSelectedFriend] = React.useState<any>(null);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const filteredFriends = friends.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    if (visible) {
      console.log("ShareModal - Modal açıldı, post:", post, "story:", story);
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        console.log("ShareModal - Kullanıcı bilgisi:", userObj);
        if (userObj?._id || userObj?.id) {
          const list = await getUserFriends(userObj._id || userObj.id);
          console.log("ShareModal - Arkadaş listesi yüklendi:", list);
          setFriends(list);
        }
      })();
      setSelectedFriend(null);
      setSent(false);
    }
  }, [visible, post, story]);

  const handleSend = async () => {
    console.log("[ShareModal] post:", post, "story:", story);
    if (!selectedFriend) {
      console.log("ShareModal - Kullanıcı seçilmedi");
      return;
    }
    try {
      setSending(true);
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id && !userObj?.id) {
        console.log("ShareModal - Kullanıcı bilgisi bulunamadı");
        return;
      }
      const senderId = userObj._id || userObj.id;
      const receiverId = selectedFriend._id || selectedFriend.id;
      let payload: any = { senderId, receiverId };
      if (post) {
        payload.postId = post._id || post.id;
        console.log("ShareModal - postId eklendi:", payload.postId);
      }
      if (story) {
        payload.storyId = story._id || story.id;
        console.log("ShareModal - storyId eklendi:", payload.storyId);
      }
      if (!post && !story) {
        payload.text = "Paylaşım";
        console.log("ShareModal - Boş mesaj eklendi");
      } else {
        delete payload.text;
      }
      console.log("ShareModal - Gönderilecek payload:", payload);
      const result = await sendMessage(payload);
      console.log("ShareModal - Gönderim sonucu:", result);
      setSent(true);
      setSending(false);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    } catch (err) {
      setSending(false);
      Alert.alert("Hata", "Mesaj gönderilemedi");
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        { backgroundColor: colors.surface },
        selectedFriend &&
        (selectedFriend._id || selectedFriend.id) === (item._id || item.id)
          ? { borderColor: colors.primary, borderWidth: 2 }
          : {},
      ]}
      onPress={() => {
        console.log("ShareModal - Kullanıcı seçildi:", item);
        setSelectedFriend(item);
      }}
      disabled={sending}
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
          {" "}
          {item.username}{" "}
        </Text>
        <Text style={[styles.friendStatus, { color: colors.textSecondary }]}>
          {" "}
          {item.isOnline ? "Çevrimiçi" : "Çevrimdışı"}{" "}
        </Text>
      </View>
      {selectedFriend &&
        (selectedFriend._id || selectedFriend.id) === (item._id || item.id) && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.primary}
            style={{ marginLeft: 8 }}
          />
        )}
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
            {" "}
            Paylaş{" "}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.friendsSection}>
          <Text style={[styles.friendsSectionTitle, { color: colors.text }]}>
            {" "}
            Arkadaşlar{" "}
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
        <TouchableOpacity
          style={{
            backgroundColor: selectedFriend ? colors.primary : colors.surface,
            padding: 16,
            borderRadius: 12,
            margin: 16,
            alignItems: "center",
            opacity: sending ? 0.6 : 1,
          }}
          onPress={() => {
            console.log("ShareModal - Gönder butonuna basıldı");
            console.log("ShareModal - selectedFriend:", selectedFriend);
            handleSend();
          }}
          disabled={!selectedFriend || sending}
        >
          <Text
            style={{
              color: selectedFriend ? colors.background : colors.textSecondary,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Gönder
          </Text>
        </TouchableOpacity>
        {sent && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 24,
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <View
              style={{
                backgroundColor: "#2ecc40",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 24,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                Gönderildi
              </Text>
            </View>
          </View>
        )}
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
