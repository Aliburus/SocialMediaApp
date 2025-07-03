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
import {
  toggleLike,
  savePost,
  getComments,
  deletePost,
  archivePost,
} from "../services/api";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
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

// Tarihi güzel formatta gösteren fonksiyon
const timeAgo = (date: string | Date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) {
    return "Az önce";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} dakika önce`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} saat önce`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} gün önce`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ay önce`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} yıl önce`;
  }
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onDelete,
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
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const navigation = useNavigation<any>();

  // Like işlemi için debounce
  const likeTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const savedByArr = Array.isArray((post as any).savedBy)
    ? (post as any).savedBy
    : [];

  const captionText = post.caption || post.description || "";

  useEffect(() => {
    const checkLiked = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id && Array.isArray(post.likes)) {
        setIsLiked((post.likes as any[]).includes(userObj._id));
      }
    };
    checkLiked();
  }, [post.likes]);

  useEffect(() => {
    const checkSaved = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (userId) {
        const saved = savedByArr.includes(userId);
        setIsSaved(saved);
      }
    };
    checkSaved();
  }, [post.savedBy]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const postId = post._id || post.id;
        const commentList = await getComments(postId);
        setComments(commentList);
      } catch (err) {
        setComments([]);
      }
    };
    fetchComments();
  }, [post]);

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
      const postId = post._id || post.id;
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

  const handleSave = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      const postId = post._id || post.id;
      console.log(
        "[PostCard/handleSave] userId:",
        userId,
        typeof userId,
        "postId:",
        postId,
        typeof postId
      );
      if (!userId || !postId) return;
      const res = await savePost(userId, postId);
      setIsSaved((res.savedBy || []).includes(userId));
      console.log(
        "[PostCard/handleSave] response.savedBy:",
        res.savedBy,
        "isSaved:",
        (res.savedBy || []).includes(userId)
      );
    } catch (err) {
      console.log("[PostCard/handleSave] HATA:", err);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
    onShare?.();
  };

  const handleDelete = async () => {
    setShowOptionsModal(false);
    try {
      await deletePost(post._id || post.id);
      if (onDelete) onDelete();
    } catch (err) {
      alert("Silme işlemi başarısız!");
    }
  };

  const handleArchive = async () => {
    setShowOptionsModal(false);
    try {
      await archivePost(post._id || post.id);
      if (onDelete) onDelete();
    } catch (err) {
      alert("Arşivleme işlemi başarısız!");
    }
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
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("UserProfile", { user: post.user })
            }
            style={styles.userInfo}
          >
            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            <View>
              <View style={styles.usernameContainer}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {post.user.username}
                </Text>
                {post.user.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
                )}
              </View>
              {post.location && (
                <Text
                  style={[styles.location, { color: colors.textSecondary }]}
                >
                  {post.location}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setShowOptionsModal(true)}
          style={styles.saveButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image
          source={{ uri: post.image }}
          style={[styles.postImage, { backgroundColor: colors.background }]}
        />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={26}
              color={isLiked ? "#FF3040" : colors.text}
            />
            <Text style={[styles.actionCount, { color: colors.text }]}>
              {typeof likesCount === "number"
                ? likesCount
                : Array.isArray(likesCount as any)
                ? (likesCount as any).length
                : 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            <Text style={[styles.actionCount, { color: colors.text }]}>
              {post.comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons
              name="paper-plane-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isSaved ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Post Info */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
        <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 15 }}>
          {typeof likesCount === "number"
            ? likesCount + " beğeni"
            : Array.isArray(likesCount as any)
            ? (likesCount as any).length + " beğeni"
            : "0 beğeni"}
        </Text>
        {(post.caption || post.description) && (
          <View style={{ marginTop: 2 }}>
            <Text
              style={{ color: colors.text, flexWrap: "wrap" }}
              numberOfLines={showFullCaption ? undefined : 2}
              ellipsizeMode={showFullCaption ? undefined : "tail"}
            >
              <Text style={{ fontWeight: "bold" }}>
                {post.user?.username || ""}{" "}
              </Text>
              {captionText}
            </Text>
            {!showFullCaption && captionText.length > 80 && (
              <TouchableOpacity onPress={() => setShowFullCaption(true)}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  devamını gör
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Yorumlar (en fazla 2 tane) */}
        {comments.length > 0 && (
          <View style={{ marginTop: 2 }}>
            {comments.slice(0, 2).map((comment) => (
              <View
                key={comment._id || comment.id}
                style={{ flexDirection: "row", flexWrap: "wrap" }}
              >
                <Text
                  style={{ fontWeight: "bold", color: colors.text }}
                  onPress={() =>
                    navigation.navigate("UserProfile", { user: comment.user })
                  }
                >
                  {comment.user?.username}
                </Text>
                <Text style={{ color: colors.text }}> {comment.text}</Text>
              </View>
            ))}
            {comments.length > 2 && (
              <TouchableOpacity onPress={onComment}>
                <Text style={{ color: colors.textSecondary }}>
                  Tüm yorumları görüntüle ({comments.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Paylaşım tarihi */}
        {(post.createdAt || post.timestamp) && (
          <Text
            style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}
          >
            {timeAgo(post.createdAt || post.timestamp)}
          </Text>
        )}
      </View>

      {/* Silme işlemi için modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={[styles.optionsModal, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.optionButton}
            >
              <Text style={[styles.optionText, { color: "red" }]}>Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchive}
              style={styles.optionButton}
            >
              <Text style={[styles.optionText, { color: "blue" }]}>
                Arşivle
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get("window").height * 0.9,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
    fontSize: 15,
    marginRight: 4,
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  saveButton: {
    padding: 6,
  },
  postImage: {
    width: width,
    height: Dimensions.get("window").height * 0.9 - 200, // Header ve actions için alan bırak
    resizeMode: "cover",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  actionCount: {
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 4,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  captionUsername: {
    fontWeight: "600",
    fontSize: 15,
    marginRight: 6,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  friendStatus: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  sendButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsModal: {
    minWidth: 120,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PostCard;
