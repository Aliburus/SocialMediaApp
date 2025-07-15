import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import {
  getPostById,
  toggleLike,
  savePost,
  getComments,
} from "../services/api";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";
import { timeAgo } from "../utils/validate";

const { width, height } = Dimensions.get("window");

const SavedDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savedPosts, initialIndex = 0 } = route.params as {
    savedPosts: any[];
    initialIndex: number;
  };
  const { colors } = useTheme();

  const [posts, setPosts] = useState<any[]>(savedPosts || []);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentPost, setCurrentPost] = useState<any>(
    savedPosts?.[initialIndex] || null
  );
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLocked, setLikeLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(true); // Kaydedilen sayfada olduğumuz için true
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (currentPost) {
        setLikesCount(
          Array.isArray(currentPost.likes) ? currentPost.likes.length : 0
        );
        checkIfLiked();
        fetchComments();
      }
    });
  }, [currentPost]);

  const fetchComments = async () => {
    try {
      const postId = currentPost._id || currentPost.id;
      const commentList = await getComments(postId);
      setComments(commentList);
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
    }
  };

  const checkIfLiked = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id && Array.isArray(currentPost.likes)) {
        setIsLiked(currentPost.likes.includes(userObj._id));
      }
    } catch (err) {
      console.error("Beğeni durumu kontrol edilemedi:", err);
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
        Alert.alert("Hata", "Lütfen giriş yapın.");
        setLikeLocked(false);
        return;
      }

      const postId = currentPost._id || currentPost.id;
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

      // Posts array'ini güncelle
      const updatedPosts = [...posts];
      updatedPosts[currentIndex] = updatedPost;
      setPosts(updatedPosts);
      setCurrentPost(updatedPost);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevLikes);
      Alert.alert("Hata", "Beğeni işlemi başarısız oldu.");
    } finally {
      setLikeLocked(false);
    }
  };

  const handleSave = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id) {
        Alert.alert("Hata", "Lütfen giriş yapın.");
        return;
      }

      const postId = currentPost._id || currentPost.id;
      await savePost(userObj._id, postId);
      setIsSaved(false); // Sadece butonun görünümünü değiştir
    } catch (err) {
      Alert.alert("Hata", "Kaydetme işlemi başarısız oldu.");
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    return (
      <View
        style={[styles.postContainer, { backgroundColor: colors.background }]}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image source={{ uri: item.user?.avatar }} style={styles.avatar} />
            <View>
              <View style={styles.usernameContainer}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {item.user?.username}
                </Text>
                {item.user?.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                )}
              </View>
              {item.location && (
                <Text
                  style={[styles.location, { color: colors.textSecondary }]}
                >
                  {item.location}
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

        {/* Post Image */}
        {item.video ? (
          <Image
            source={{
              uri: item.video.startsWith("http")
                ? item.video
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.video}`,
            }}
            style={styles.postImage}
          />
        ) : (
          <Image
            source={{
              uri: item.image.startsWith("http")
                ? item.image
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.image}`,
            }}
            style={styles.postImage}
          />
        )}

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
              onPress={() =>
                navigation.navigate("Comment", { postId: item._id || item.id })
              }
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
              color={isSaved ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={[styles.likes, { color: colors.text }]}>
            {likesCount} likes
          </Text>

          {/* Açıklama metni varsa göster */}
          {(item.description || item.caption) && (
            <Text style={[styles.caption, { color: colors.text }]}>
              {item.description || item.caption}
            </Text>
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
                    {comment.user?.username}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    {" "}
                    {comment.text}
                  </Text>
                </View>
              ))}
              {comments.length > 2 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Comment", {
                      postId: item._id || item.id,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.viewAllComments,
                      { color: colors.textSecondary },
                    ]}
                  >
                    View all comments ({comments.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.createdAt && (
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {timeAgo(item.createdAt)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      setCurrentPost(posts[newIndex]);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Header'ı ayrı bir fonksiyon olarak tanımla
  const renderTopBar = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Saved ({posts.length})
      </Text>
      <TouchableOpacity>
        <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        ListHeaderComponent={renderTopBar}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
      />

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
  postContainer: {
    height: height,
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

export default SavedDetailScreen;
