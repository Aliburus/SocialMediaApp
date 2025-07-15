import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { Post } from "../types";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "../context/ToastContext";
import {
  toggleLike,
  savePost,
  getComments,
  deletePost,
  archivePost,
} from "../services/api";
import api from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { ShareModal } from "./ShareModal";
import { Video, ResizeMode } from "expo-av";
import { timeAgo } from "../utils/validate";

const { width } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  isMuted?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onLikeUpdate?: (postId: string, isLiked: boolean, likesCount: number) => void;
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
  isMuted: globalMute,
  onPress,
  onLike,
  onComment,
  onShare,
  onDelete,
  onArchive,
  onLikeUpdate,
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
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [likeLocked, setLikeLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigation = useNavigation<any>();
  const [imageLoading, setImageLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(globalMute ?? true);
  const { showToast } = useToast();

  // Pinch-to-zoom için state'ler
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isZoomed, setIsZoomed] = useState(false);

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
      setCurrentUser(userObj);
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

  useEffect(() => {
    return () => {
      setVideoLoading(true);
      setVideoMuted(globalMute ?? true);
    };
  }, []);

  const handleLike = async () => {
    if (likeLocked) return;
    setLikeLocked(true);
    const prevLiked = isLiked;
    const prevLikes = likesCount;
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id) {
        alert("Please login.");
        setLikeLocked(false);
        return;
      }
      const postId = post._id || post.id;
      // Optimistic UI: sadece bir kez artır/azalt, 0'ın altına düşmesin
      let newLiked = !isLiked;
      let newLikesCount = newLiked
        ? likesCount + 1
        : Math.max(0, likesCount - 1);
      setIsLiked(newLiked);
      setLikesCount(newLikesCount);
      if (onLikeUpdate) onLikeUpdate(postId, newLiked, newLikesCount);
      const updatedPost = await toggleLike(postId, userObj._id);
      const finalLikesCount = Array.isArray(updatedPost.likes)
        ? updatedPost.likes.length
        : 0;
      const finalIsLiked = Array.isArray(updatedPost.likes)
        ? updatedPost.likes.includes(userObj._id)
        : false;
      setLikesCount(finalLikesCount);
      setIsLiked(finalIsLiked);
      if (onLikeUpdate) onLikeUpdate(postId, finalIsLiked, finalLikesCount);
      // Davranış takibi
      try {
        await api.post("/explore/track", {
          contentId: postId,
          behaviorType: !prevLiked ? "like" : "view",
        });
      } catch (trackError) {}
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

      if (!userId || !postId) return;
      const res = await savePost(userId, postId);
      setIsSaved((res.savedBy || []).includes(userId));

      // Davranış takibi
      try {
        await api.post("/explore/track", {
          contentId: postId,
          behaviorType: "save",
        });
      } catch (trackError) {
        console.error("Davranış takibi hatası:", trackError);
      }
    } catch (err) {
      console.log("[PostCard/handleSave] HATA:", err);
    }
  };

  const handleShare = () => {
    setSharePost(post);
    setShowShareModal(true);
  };

  const handleDelete = async () => {
    setShowOptionsModal(false);
    try {
      await deletePost(post._id || post.id);
      if (onDelete) onDelete();
    } catch (err) {
      showToast("Delete failed!", "error");
    }
  };

  const handleArchive = async () => {
    setShowOptionsModal(false);
    try {
      await archivePost(post._id || post.id);
      if (onArchive) onArchive();
      if (onDelete) onDelete();
    } catch (err) {
      showToast("Archive failed!", "error");
    }
  };

  const handleCopyLink = () => {
    setShowOptionsModal(false);
    // Post linkini kopyala
    const postLink = `https://instagram.com/p/${post._id || post.id}`;
    showToast("🔗 Link copied!", "success");
  };

  const handleToggleVideoMute = () => {
    setVideoMuted((prev) => !prev);
  };

  // Pinch gesture handler - daha hassas
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  // Pinch gesture için minimum scale değişimi
  const minScaleChange = 0.005;

  // Pan gesture handler (zoom sırasında kaydırma için)
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Pan bırakıldığında pozisyonu sıfırla
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Bırakıldığında normal haline dön
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      setIsZoomed(false);
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
        <Text style={[styles.friendStatus]}>
          {item.isOnline ? "Online" : "Offline"}
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
            <Image
              source={{
                uri: post.user.avatar?.startsWith("http")
                  ? post.user.avatar
                  : post.user.avatar
                  ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                      post.user.avatar
                    }`
                  : "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.avatar}
            />
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

      {/* Image veya Video */}
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
      >
        <Animated.View
          style={{
            transform: [
              { scale: scale },
              { translateX: translateX },
              { translateY: translateY },
            ],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (post.video) {
                navigation.navigate("VideoDetail", { post });
              } else {
                onPress?.();
              }
            }}
            activeOpacity={0.9}
          >
            {post.video ? (
              <View
                style={[
                  styles.postImage,
                  { backgroundColor: colors.background },
                ]}
              >
                <Video
                  source={{
                    uri: post.video.startsWith("http")
                      ? post.video
                      : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                          post.video
                        }`,
                  }}
                  style={styles.postImage}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                  shouldPlay
                  isMuted={videoMuted}
                  onLoadStart={() => setVideoLoading(true)}
                  onLoad={() => setVideoLoading(false)}
                  onError={() => setVideoLoading(false)}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && status.didJustFinish) {
                      // Video 1 kere oynadıktan sonra durur
                    }
                  }}
                />
                {videoLoading && (
                  <ActivityIndicator
                    style={styles.loadingIndicator}
                    size="large"
                    color={colors.primary}
                  />
                )}
                {/* Video sağ alt ses butonu */}
                <TouchableOpacity
                  style={styles.videoMuteButton}
                  onPress={handleToggleVideoMute}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={videoMuted ? "volume-mute" : "volume-high"}
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{
                  uri: post.image.startsWith("http")
                    ? post.image
                    : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                        post.image
                      }`,
                }}
                style={[
                  styles.postImage,
                  { backgroundColor: colors.background },
                ]}
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            )}
            {imageLoading && !post.video && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PinchGestureHandler>

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
              {typeof post.comments === "number"
                ? post.comments
                : Array.isArray(post.comments)
                ? (post.comments as any[]).length
                : Array.isArray(comments)
                ? comments.length
                : 0}
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
        <TouchableOpacity
          onPress={() => {
            handleSave();
          }}
          style={styles.actionButton}
        >
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
            ? likesCount + " likes"
            : Array.isArray(likesCount as any)
            ? (likesCount as any).length + " likes"
            : "0 likes"}
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
                  see more
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
                  View all comments ({comments.length})
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

      {/* Seçenekler modal */}
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
            {currentUser && post.user.username === currentUser.username ? (
              // Kullanıcının kendi postu - sil ve arşiv seçenekleri
              <>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.optionButton}
                >
                  <Text style={[styles.optionText, { color: "red" }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleArchive}
                  style={styles.optionButton}
                >
                  <Text style={[styles.optionText, { color: "blue" }]}>
                    Archive
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Başkasının postu - sadece bağlantı kopyala
              <TouchableOpacity
                onPress={handleCopyLink}
                style={styles.optionButton}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Copy Link
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <ShareModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSharePost(null);
        }}
        post={sharePost}
      />
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
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  videoMuteButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 20,
  },
});

export default PostCard;
