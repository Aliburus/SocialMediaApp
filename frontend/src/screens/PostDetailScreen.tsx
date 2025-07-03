import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import {
  getPostById,
  getComments,
  toggleLike,
  savePost,
  deletePost,
  archivePost,
} from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";

const { width } = Dimensions.get("window");

// Tarihi güzel formatta gösteren fonksiyon
const timeAgo = (date: string | Date) => {
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

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { post: initialPost, fromArchive } = route.params as {
    post: any;
    fromArchive?: boolean;
  };
  const { colors } = useTheme();
  const [post, setPost] = React.useState<any>(initialPost);
  const [comments, setComments] = React.useState<any[]>([]);
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(0);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [likeLocked, setLikeLocked] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showFullCaption, setShowFullCaption] = React.useState(false);
  const [showOptionsModal, setShowOptionsModal] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const freshPost = await getPostById(initialPost._id || initialPost.id);
        setPost(freshPost);
        setLikesCount(
          Array.isArray(freshPost.likes) ? freshPost.likes.length : 0
        );
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id && Array.isArray(freshPost.likes)) {
          setIsLiked(freshPost.likes.includes(userObj._id));
        }
        // Post'un kayıtlı olup olmadığını kontrol et
        if (userObj?._id && Array.isArray(freshPost.savedBy)) {
          setIsSaved(freshPost.savedBy.includes(userObj._id));
        }
        const commentList = await getComments(
          initialPost._id || initialPost.id
        );
        setComments(commentList);
      } catch (err) {
        // log
      }
    };
    fetchData();
  }, [initialPost]);

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
      setPost(updatedPost);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevLikes);
    } finally {
      setLikeLocked(false);
    }
  };

  const handleComment = () => {
    navigation.navigate("Comment", { postId: post._id || post.id });
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleSave = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id) {
        alert("Lütfen giriş yapın.");
        return;
      }

      const postId = post._id || post.id;
      await savePost(userObj._id, postId);

      // Kayıtlı durumunu tersine çevir
      setIsSaved(!isSaved);

      // Post'u güncelle
      const updatedPost = await getPostById(postId);
      setPost(updatedPost);
    } catch (err) {
      alert("Kaydetme işlemi başarısız oldu.");
    }
  };

  const handleDelete = async () => {
    setShowOptionsModal(false);
    try {
      await deletePost(post._id || post.id);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (err) {
      alert("Silme işlemi başarısız!");
    }
  };

  const handleArchive = async () => {
    setShowOptionsModal(false);
    try {
      await archivePost(post._id || post.id);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (err) {
      alert("Arşivleme işlemi başarısız!");
    }
  };

  const handleUnarchive = async () => {
    setShowOptionsModal(false);
    try {
      await archivePost(post._id || post.id, false);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (err) {
      alert("Arşivden çıkarma işlemi başarısız!");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
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
                <Text
                  style={[styles.location, { color: colors.textSecondary }]}
                >
                  {post.location}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Post Image */}
        <Image source={{ uri: post.image }} style={styles.postImage} />

        {/* Post Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#FF3040" : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleComment}
            >
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={26}
              color={isSaved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={[styles.likes, { color: colors.text }]}>
            {likesCount} beğeni
          </Text>

          {/* Açıklama metni varsa göster, çok uzunsa devamını gör butonu */}
          {(post.caption || post.description) && (
            <View style={{ marginTop: 2 }}>
              <Text
                style={[
                  styles.caption,
                  { color: colors.text, flexWrap: "wrap" },
                ]}
                numberOfLines={showFullCaption ? undefined : 2}
                ellipsizeMode={showFullCaption ? undefined : "tail"}
              >
                <Text style={{ fontWeight: "bold" }}>
                  {post.user?.username || ""}{" "}
                </Text>
                {post.caption || post.description}
              </Text>
              {!showFullCaption &&
                (post.caption || post.description)?.length > 80 && (
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
            <View style={styles.commentsPreview}>
              {comments.slice(0, 2).map((comment) => (
                <View
                  key={comment._id || comment.id}
                  style={styles.commentItem}
                >
                  <Text
                    style={[styles.commentUsername, { color: colors.text }]}
                  >
                    {comment.user.username}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    {" "}
                    {comment.text}
                  </Text>
                </View>
              ))}
              {comments.length > 2 && (
                <TouchableOpacity onPress={handleComment}>
                  <Text
                    style={[
                      styles.viewAllComments,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tüm yorumları görüntüle ({comments.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {post.createdAt ? timeAgo(post.createdAt) : post.timestamp}
          </Text>
        </View>
      </ScrollView>

      {/* Comment Input */}
      {!fromArchive && (
        <View
          style={[
            styles.commentInputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Image
            source={{
              uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
            }}
            style={styles.inputAvatar}
          />
          <TextInput
            style={[
              styles.commentInput,
              { color: colors.text, backgroundColor: colors.surface },
            ]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity>
            <Text style={[styles.postButton, { color: colors.primary }]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              paddingVertical: 18,
              paddingHorizontal: 28,
              minWidth: 220,
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={handleDelete}
              style={{ paddingVertical: 10, width: "100%" }}
            >
              <Text
                style={{
                  color: colors.error,
                  fontWeight: "bold",
                  fontSize: 17,
                  textAlign: "center",
                }}
              >
                Sil
              </Text>
            </TouchableOpacity>
            {post.archived ? (
              <TouchableOpacity
                onPress={handleUnarchive}
                style={{ paddingVertical: 10, width: "100%" }}
              >
                <Text
                  style={{
                    color: "#2196F3",
                    fontWeight: "bold",
                    fontSize: 17,
                    textAlign: "center",
                  }}
                >
                  Arşivden Çıkar
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleArchive}
                style={{ paddingVertical: 10, width: "100%" }}
              >
                <Text
                  style={{
                    color: "#2196F3",
                    fontWeight: "bold",
                    fontSize: 17,
                    textAlign: "center",
                  }}
                >
                  Arşivle
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
              style={{ paddingVertical: 10, width: "100%" }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  postHeader: {
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
  actionButton: {
    marginRight: 16,
  },
  postInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likes: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  captionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  caption: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    textTransform: "uppercase",
  },

  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
  },
  postButton: {
    fontWeight: "600",
    fontSize: 16,
  },
  commentsPreview: {
    marginTop: 4,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
  },
  viewAllComments: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default PostDetailScreen;
