import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { getComments, addComment, toggleCommentLike } from "../services/api";
import { useToast } from "../context/ToastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../services/api";

const timeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
  if (diff < 1) return "now";
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const CommentScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const postId =
    route.params?.post?._id || route.params?.post?.id || route.params?.postId;
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeLoading, setLikeLoading] = useState<{
    [commentId: string]: boolean;
  }>({});
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (err) {
      setComments([]);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
    // Kullanıcı bilgisini al
    const getUser = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(userObj);
    };
    getUser();
  }, [fetchComments]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (!userObj?._id) {
        showToast("You must be logged in to comment", "warning");
        setSending(false);
        return;
      }
      await addComment(postId, userObj._id, input.trim());
      setInput("");
      fetchComments();
    } catch (err: any) {
      let msg = "Comment could not be added";
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      showToast(msg, "error");
    }
    setSending(false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser?._id) {
      alert("You must be logged in to like a comment.");
      return;
    }

    // Optimistic UI
    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id !== commentId) return comment;
        const liked = comment.likes?.includes(currentUser._id);
        let newLikes;
        if (liked) {
          newLikes = comment.likes.filter(
            (id: string) => id !== currentUser._id
          );
        } else {
          newLikes = [...(comment.likes || []), currentUser._id];
        }
        return { ...comment, likes: newLikes };
      })
    );
    setLikeLoading((prev) => ({ ...prev, [commentId]: true }));
    try {
      const updatedComment = await toggleCommentLike(
        commentId,
        currentUser._id
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId ? updatedComment : comment
        )
      );
    } catch (err) {
      // Hata olursa eski haline döndür
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id !== commentId) return comment;
          const liked = comment.likes?.includes(currentUser._id);
          let newLikes;
          if (liked) {
            newLikes = [...(comment.likes || []), currentUser._id];
          } else {
            newLikes = comment.likes.filter(
              (id: string) => id !== currentUser._id
            );
          }
          return { ...comment, likes: newLikes };
        })
      );
      alert("Like operation failed!");
    } finally {
      setLikeLoading((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.commentRow}>
      <TouchableOpacity
        onPress={() => navigation.navigate("UserProfile", { user: item.user })}
      >
        <Image
          source={{
            uri: item.user.avatar?.startsWith("http")
              ? item.user.avatar
              : item.user.avatar
              ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                  item.user.avatar
                }`
              : "https://ui-avatars.com/api/?name=User",
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("UserProfile", { user: item.user })
            }
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              {item.user.username}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {"  "}
              {timeAgo(item.createdAt)}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {item.text}
        </Text>
        {/* <View style={{ flexDirection: "row", marginTop: 2 }}>
          <TouchableOpacity><Text style={[styles.reply, { color: colors.textSecondary }]}>Reply</Text></TouchableOpacity>
        </View> */}
      </View>
      <TouchableOpacity
        style={styles.likeBtn}
        onPress={() => handleLikeComment(item._id)}
        disabled={likeLoading[item._id]}
      >
        <Ionicons
          name={
            item.likes?.includes(currentUser?._id) ? "heart" : "heart-outline"
          }
          size={20}
          color={
            item.likes?.includes(currentUser?._id)
              ? "#FF3040"
              : colors.textSecondary
          }
        />
        {item.likes?.length > 0 && (
          <Text style={[styles.likeCount, { color: colors.textSecondary }]}>
            {item.likes.length}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.headerBar}>
        <View style={styles.headerBarLine} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Comments</Text>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 32 }}
          />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id || item.id}
            renderItem={renderItem}
            style={{ width: "100%" }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            editable={!sending}
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending || !input.trim()}
          >
            <Ionicons name="send" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  headerBar: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  headerBarLine: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4446",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    marginLeft: 16,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2223",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
    fontSize: 15,
  },
  time: {
    fontSize: 12,
    marginLeft: 4,
  },
  commentText: {
    fontSize: 15,
    marginTop: 2,
  },
  likeBtn: {
    marginLeft: 8,
    marginTop: 2,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
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
  likeCount: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default CommentScreen;
