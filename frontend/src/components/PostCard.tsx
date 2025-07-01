import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "../types";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toggleLike } from "../services/api";

const { width } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

// Mock arkadaş listesi
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
  {
    id: "3",
    username: "mehmet_kaya",
    avatar: "https://picsum.photos/200/200?random=3",
    isOnline: true,
  },
  {
    id: "4",
    username: "fatma_ozturk",
    avatar: "https://picsum.photos/200/200?random=4",
    isOnline: true,
  },
  {
    id: "5",
    username: "ali_celik",
    avatar: "https://picsum.photos/200/200?random=5",
    isOnline: false,
  },
  {
    id: "6",
    username: "zeynep_arslan",
    avatar: "https://picsum.photos/200/200?random=6",
    isOnline: true,
  },
  {
    id: "7",
    username: "can_yildiz",
    avatar: "https://picsum.photos/200/200?random=7",
    isOnline: false,
  },
  {
    id: "8",
    username: "elif_sahin",
    avatar: "https://picsum.photos/200/200?random=8",
    isOnline: true,
  },
];

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    typeof post.likes === "number"
      ? post.likes
      : Array.isArray(post.likes as any)
      ? (post.likes as any).length
      : 0
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [likeLocked, setLikeLocked] = useState(false);

  // Like işlemi için debounce
  const likeTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkLiked = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id && Array.isArray(post.likes)) {
        setIsLiked(post.likes.includes(userObj._id));
      }
    };
    checkLiked();
  }, [post.likes]);

  const handleLike = async () => {
    if (likeLocked) return;
    setLikeLocked(true);
    const prevLiked = isLiked;
    const prevLikes = likesCount;
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id) {
        alert("Lütfen giriş yapın.");
        setLikeLocked(false);
        return;
      }
      const postId = (post as any)._id || post.id;
      // Optimistic UI: sadece bir kez artır/azalt, 0'ın altına düşmesin
      if (!isLiked) setLikesCount((c: number) => c + 1);
      else setLikesCount((c: number) => (c > 0 ? c - 1 : 0));
      setIsLiked((prev: any) => !prev);
      const updatedPost = await toggleLike(postId, userObj._id);
      setLikesCount(
        Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0
      );
      setIsLiked(
        Array.isArray(updatedPost.likes)
          ? updatedPost.likes.includes(userObj._id)
          : false
      );
      onLike?.();
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevLikes);
    } finally {
      setLikeLocked(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
    onShare?.();
  };

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View>
            <View style={styles.usernameContainer}>
              <Text style={[styles.username, { color: colors.text }]}>
                {post.user.username}
              </Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
              )}
            </View>
            {post.location && (
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {post.location}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: post.image }} style={styles.postImage} />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? "#FF3040" : colors.text}
              style={{ marginRight: 2 }}
              onPress={handleLike}
            />
            <Text
              style={{
                color: colors.text,
                fontWeight: "bold",
                marginRight: 16,
                fontSize: 18,
              }}
            >
              {typeof likesCount === "number"
                ? likesCount
                : Array.isArray(likesCount as any)
                ? (likesCount as any).length
                : 0}
            </Text>
            <TouchableOpacity onPress={onComment}>
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={colors.text}
                style={{ marginRight: 2 }}
              />
            </TouchableOpacity>
            <Text
              style={{
                color: colors.text,
                fontWeight: "bold",
                marginRight: 16,
                fontSize: 18,
              }}
            >
              {post.comments}
            </Text>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={colors.text}
                style={{ marginRight: 16 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Ionicons name="bookmark-outline" size={26} color={colors.text} />
      </View>

      {/* Kullanıcı adı ve caption sadece caption varsa gösterilecek */}
      {post.caption ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Text style={{ fontWeight: "bold", color: colors.text }}>
            {post.user?.username || ""}
          </Text>
          <Text style={{ color: colors.text }}>{post.caption}</Text>
        </View>
      ) : null}

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
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
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
    fontSize: 16,
    marginRight: 4,
  },
  location: {
    fontSize: 12,
    marginTop: 2,
  },
  postImage: {
    width: width,
    height: width,
    resizeMode: "cover",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: "row",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 16,
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  shareOption: {
    alignItems: "center",
    flex: 1,
  },
  shareOptionIcon: {
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  friendsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 16,
    color: "#333",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  friendAvatarContainer: {
    position: "relative",
    marginRight: 12,
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
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  friendStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  sendButton: {
    padding: 8,
  },
});

export default PostCard;
