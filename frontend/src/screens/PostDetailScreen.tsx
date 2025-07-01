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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { getPostById, getComments, toggleLike } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";

const { width } = Dimensions.get("window");

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { post: initialPost } = route.params as { post: any };
  const { colors } = useTheme();
  const [post, setPost] = React.useState<any>(initialPost);
  const [comments, setComments] = React.useState<any[]>([]);
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(0);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [likeLocked, setLikeLocked] = React.useState(false);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
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
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
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
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={[styles.likes, { color: colors.text }]}>
            {likesCount} likes
          </Text>
          <View style={styles.captionContainer}>
            <Text style={[styles.username, { color: colors.text }]}>
              {post.user.username}
            </Text>
            <Text style={[styles.caption, { color: colors.text }]}>
              {" "}
              {post.caption}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {post.timestamp}
          </Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            Comments
          </Text>
          {comments.map((comment) => (
            <View key={comment._id || comment.id} style={styles.commentItem}>
              <Image
                source={{ uri: comment.user.avatar }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentText}>
                  <Text
                    style={[styles.commentUsername, { color: colors.text }]}
                  >
                    {comment.user.username}
                  </Text>
                  <Text style={[styles.commentMessage, { color: colors.text }]}>
                    {" "}
                    {comment.text}
                  </Text>
                </View>
                <View style={styles.commentActions}>
                  <Text
                    style={[
                      styles.commentTimestamp,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {/* Zamanı hesaplamak için timeAgo fonksiyonu eklenebilir */}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}
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
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity>
          <Text style={[styles.postButton, { color: colors.primary }]}>
            Post
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
  },
  timestamp: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 14,
  },
  commentMessage: {
    fontSize: 14,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentTimestamp: {
    fontSize: 12,
    marginRight: 16,
  },
  commentAction: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 16,
  },
  commentLikes: {
    fontSize: 12,
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

export default PostDetailScreen;
