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
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { getComments, toggleLike, savePost } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";

const { width, height } = Dimensions.get("window");

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

  useEffect(() => {
    if (reel) {
      setLikesCount(Array.isArray(reel.likes) ? reel.likes.length : 0);
      checkIfLiked();
      checkIfSaved();
      fetchComments();
    }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reel</Text>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Reel Header */}
        <View style={styles.reelHeader}>
          <View style={styles.userInfo}>
            <Image source={{ uri: reel.user?.avatar }} style={styles.avatar} />
            <View>
              <View style={styles.usernameContainer}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {reel.user?.username}
                </Text>
                {reel.user?.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
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
        <Video
          source={{
            uri:
              reel?.video ||
              reel?.media ||
              "https://www.w3schools.com/html/mov_bbb.mp4",
          }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
        />

        {/* Reel Actions */}
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

        {/* Reel Info */}
        <View style={styles.reelInfo}>
          <Text style={[styles.likes, { color: colors.text }]}>
            {likesCount} beğeni
          </Text>

          {/* Açıklama metni varsa göster */}
          {reel.caption && (
            <Text style={[styles.caption, { color: colors.text }]}>
              {reel.caption}
            </Text>
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
                    style={[styles.commentPreviewText, { color: colors.text }]}
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
          { backgroundColor: colors.background, borderTopColor: colors.border },
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
          placeholder="Yorum ekle..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity>
          <Text style={[styles.postButton, { color: colors.primary }]}>
            Gönder
          </Text>
        </TouchableOpacity>
      </View>

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
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
  },
  postButton: {
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ReelDetailScreen;
