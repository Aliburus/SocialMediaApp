import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { getComments, toggleLike, savePost, deletePost } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";
import api from "../services/api";
import LoadingOverlay from "../components/LoadingOverlay";
import { timeAgo } from "../utils/validate";

const { width, height } = Dimensions.get("window");

const ReelDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reel: initialReel } = route.params as { reel: any };
  const { colors } = useTheme();

  const [reel, setReel] = useState<any>(initialReel);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLocked, setLikeLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reel) {
      setLikesCount(Array.isArray(reel.likes) ? reel.likes.length : 0);
      checkIfLiked();
      checkIfSaved();
      fetchComments();
    }
    // Kullanıcı id'sini al
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUserId(userObj?._id || userObj?.id || null);
    })();
  }, [reel]);

  const checkIfSaved = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id && Array.isArray(reel.savedBy)) {
        setIsSaved(reel.savedBy.includes(userObj._id));
      }
    } catch (err) {
      console.error("Kayıtlı durumu kontrol edilemedi:", err);
    }
  };

  const checkIfLiked = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id && Array.isArray(reel.likes)) {
        setIsLiked(reel.likes.includes(userObj._id));
      }
    } catch (err) {
      console.error("Beğeni durumu kontrol edilemedi:", err);
    }
  };

  const fetchComments = async () => {
    try {
      const reelId = reel._id || reel.id;
      const commentList = await getComments(reelId);
      setComments(commentList);
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
    }
  };

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

      const reelId = reel._id || reel.id;
      if (!isLiked) setLikesCount((c: number) => c + 1);
      else setLikesCount((c: number) => (c > 0 ? c - 1 : 0));
      setIsLiked((prev: any) => !prev);

      const updatedReel = await toggleLike(reelId, userObj._id);
      setLikesCount(
        Array.isArray(updatedReel.likes) ? updatedReel.likes.length : 0
      );
      setIsLiked(
        Array.isArray(updatedReel.likes)
          ? updatedReel.likes.includes(userObj._id)
          : false
      );
      setReel(updatedReel);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevLikes);
      alert("Beğeni işlemi başarısız oldu.");
    } finally {
      setLikeLocked(false);
    }
  };

  const handleComment = () => {
    navigation.navigate("Comment", { postId: reel._id || reel.id });
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

      const reelId = reel._id || reel.id;
      await savePost(userObj._id, reelId);

      // Kayıtlı durumunu tersine çevir
      setIsSaved(!isSaved);
    } catch (err) {
      alert("Kaydetme işlemi başarısız oldu.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(reel._id || reel.id);
      setIsDeleting(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { refreshPosts: true } }],
      });
    } catch (err) {
      setIsDeleting(false);
      alert("Silme işlemi başarısız!");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reel</Text>
          <TouchableOpacity>
            <Ionicons
              name="paper-plane-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Reel Header */}
          <View style={styles.reelHeader}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: reel.user?.avatar }}
                style={styles.avatar}
              />
              <View>
                <View style={styles.usernameContainer}>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {reel.user?.username}
                  </Text>
                  {reel.user?.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#1DA1F2"
                    />
                  )}
                </View>
                {reel.location && (
                  <Text
                    style={[styles.location, { color: colors.textSecondary }]}
                  >
                    {reel.location}
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

          {/* Reel Video */}
          {reel.video ? (
            <Video
              source={{
                uri: reel.video.startsWith("http")
                  ? reel.video
                  : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                      reel.video
                    }`,
              }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          ) : (
            <Image
              source={{
                uri: reel.image.startsWith("http")
                  ? reel.image
                  : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                      reel.image
                    }`,
              }}
              style={styles.video}
            />
          )}

          {/* Silme butonu sadece kendi reels'in ise göster */}
          {reel.user?._id === currentUserId && (
            <TouchableOpacity
              style={{ marginTop: 16, alignSelf: "center" }}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={28} color="#FF3040" />
              <Text style={{ color: "#FF3040", fontWeight: "bold" }}>Sil</Text>
            </TouchableOpacity>
          )}

          {/* Reel Actions */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLike}
              >
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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
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

          {/* Reel Info */}
          <View style={styles.reelInfo}>
            <Text style={[styles.likes, { color: colors.text }]}>
              {likesCount} likes
            </Text>

            {/* Açıklama metni varsa göster, çok uzunsa devamını gör butonu */}
            {(reel.caption || reel.description) && (
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
                    {reel.user?.username || ""}{" "}
                  </Text>
                  {reel.caption || reel.description}
                </Text>
                {!showFullCaption &&
                  (reel.caption || reel.description)?.length > 80 && (
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
              <View style={styles.commentsPreview}>
                {comments.slice(0, 2).map((comment) => (
                  <View
                    key={comment._id || comment.id}
                    style={styles.commentPreviewItem}
                  >
                    <Text
                      style={[
                        styles.commentPreviewUsername,
                        { color: colors.text },
                      ]}
                    >
                      {comment.user?.username}
                    </Text>
                    <Text
                      style={[
                        styles.commentPreviewText,
                        { color: colors.text },
                      ]}
                    >
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
              {reel.createdAt ? timeAgo(reel.createdAt) : reel.timestamp}
            </Text>
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View
          style={[
            styles.commentInputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.commentInput, { color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="send" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
      {isDeleting && <LoadingOverlay visible={true} message="Deleting..." />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  reelHeader: {
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
  video: {
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
  reelInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likes: {
    fontWeight: "600",
    fontSize: 16,
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
  commentsPreview: {
    marginTop: 4,
  },
  commentPreviewItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  commentPreviewUsername: {
    fontWeight: "600",
    fontSize: 14,
  },
  commentPreviewText: {
    fontSize: 14,
  },
  viewAllComments: {
    fontSize: 14,
    marginTop: 4,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 6,
  },
});

export default ReelDetailScreen;
