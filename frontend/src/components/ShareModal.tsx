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
import { getProfile } from "../services/api";
import api from "../services/api";

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
  const [following, setFollowing] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedFriends, setSelectedFriends] = React.useState<any[]>([]);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      (async () => {
        setLoading(true);
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id || userObj?.id) {
          const profile = await getProfile(userObj._id || userObj.id);
          if (
            profile.following &&
            profile.following.length > 0 &&
            typeof profile.following[0] === "string"
          ) {
            // Sadece id geliyorsa, her biri için getProfile çağır
            const users = await Promise.all(
              profile.following.map(async (id: string) => {
                try {
                  return await getProfile(id);
                } catch {
                  return null;
                }
              })
            );
            setFollowing(users.filter(Boolean));
          } else {
            setFollowing(profile.following || []);
          }
        }
        setLoading(false);
      })();
      setSelectedFriends([]);
      setSent(false);
    }
  }, [visible, post, story]);

  React.useEffect(() => {}, [following]);

  const filteredFollowing = following.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q))
    );
  });

  const handleSelectFriend = (item: any) => {
    if (
      selectedFriends.some((f) => (f._id || f.id) === (item._id || item.id))
    ) {
      setSelectedFriends(
        selectedFriends.filter((f) => (f._id || f.id) !== (item._id || item.id))
      );
    } else {
      setSelectedFriends([...selectedFriends, item]);
    }
  };

  const handleSend = async () => {
    if (!selectedFriends.length) {
      return;
    }
    try {
      setSending(true);
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id && !userObj?.id) {
        return;
      }
      const senderId = userObj._id || userObj.id;
      for (const friend of selectedFriends) {
        const receiverId = friend._id || friend.id;
        let payload: any = { senderId, receiverId };
        if (post) payload.postId = post._id || post.id;
        if (story) payload.storyId = story._id || story.id;
        if (!post && !story) payload.text = "Share";
        await sendMessage(payload);
      }
      setSent(true);
      setSending(false);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    } catch (err) {
      setSending(false);
      Alert.alert("Error", "Message could not be sent");
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    const isSelected = selectedFriends.some(
      (f) => (f._id || f.id) === (item._id || item.id)
    );
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { backgroundColor: colors.surface },
          isSelected
            ? {
                borderColor: colors.primary,
                borderWidth: 2,
                backgroundColor: colors.primary + "10",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }
            : {},
        ]}
        onPress={() => handleSelectFriend(item)}
        disabled={sending}
      >
        <View style={styles.friendAvatarContainer}>
          <Image
            source={{
              uri: item.avatar?.startsWith("http")
                ? item.avatar
                : item.avatar
                ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.avatar}`
                : "https://ui-avatars.com/api/?name=User",
            }}
            style={styles.friendAvatar}
          />
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
            {item.isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.primary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
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
            Share{" "}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.friendsSection}>
          <Text style={[styles.friendsSectionTitle, { color: colors.text }]}>
            {" "}
            Friends{" "}
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
            placeholder="Search friends..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredFollowing}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id || item._id || item.username}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 24,
                  }}
                >
                  Loading...
                </Text>
              ) : (
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 24,
                  }}
                >
                  No following found
                </Text>
              )
            }
          />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: selectedFriends.length
              ? colors.primary
              : colors.surface,
            padding: 16,
            borderRadius: 12,
            margin: 16,
            alignItems: "center",
            opacity: sending ? 0.6 : 1,
          }}
          onPress={handleSend}
          disabled={!selectedFriends.length || sending}
        >
          <Text
            style={{
              color: selectedFriends.length
                ? colors.background
                : colors.textSecondary,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Send
          </Text>
        </TouchableOpacity>
        {sent && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1000,
            }}
          >
            <View
              style={{
                backgroundColor: "#2ecc40",
                paddingHorizontal: 32,
                paddingVertical: 20,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#fff"
                style={{ marginRight: 12 }}
              />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                Sent
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  friendAvatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4cd137",
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 13,
    color: "#888",
  },
  checkmarkContainer: {
    marginLeft: 8,
    padding: 4,
  },
  sendButton: {
    padding: 8,
  },
});
