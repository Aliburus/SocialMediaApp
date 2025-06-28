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

const { width } = Dimensions.get("window");

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post } = route.params as { post: any };

  const mockComments = [
    {
      id: "1",
      user: {
        username: "alice_wonder",
        avatar:
          "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      text: "Amazing shot! 📸",
      timestamp: "2h",
      likes: 12,
    },
    {
      id: "2",
      user: {
        username: "bob_photographer",
        avatar:
          "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      text: "Love the colors in this photo! Where was this taken?",
      timestamp: "1h",
      likes: 8,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            <View>
              <View style={styles.usernameContainer}>
                <Text style={styles.username}>{post.user.username}</Text>
                {post.user.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                )}
              </View>
              {post.location && (
                <Text style={styles.location}>{post.location}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        <Image source={{ uri: post.image }} style={styles.postImage} />

        {/* Post Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons
                name={post.isLiked ? "heart" : "heart-outline"}
                size={28}
                color={post.isLiked ? "#E91E63" : "#000"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={26} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={styles.likes}>{post.likes.toLocaleString()} likes</Text>
          <View style={styles.captionContainer}>
            <Text style={styles.username}>{post.user.username}</Text>
            <Text style={styles.caption}> {post.caption}</Text>
          </View>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {mockComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Image
                source={{ uri: comment.user.avatar }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentText}>
                  <Text style={styles.commentUsername}>
                    {comment.user.username}
                  </Text>
                  <Text style={styles.commentMessage}> {comment.text}</Text>
                </View>
                <View style={styles.commentActions}>
                  <Text style={styles.commentTimestamp}>
                    {comment.timestamp}
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.commentAction}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.commentLikes}>
                      {comment.likes} likes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="heart-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <Image
          source={{
            uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
          }}
          style={styles.inputAvatar}
        />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity>
          <Text style={styles.postButton}>Post</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
    color: "#666",
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
    color: "#666",
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
    color: "#333",
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
    color: "#333",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#666",
    marginRight: 16,
  },
  commentAction: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginRight: 16,
  },
  commentLikes: {
    fontSize: 12,
    color: "#666",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "white",
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
    color: "#333",
  },
  postButton: {
    color: "#E91E63",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default PostDetailScreen;
