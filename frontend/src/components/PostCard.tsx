import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "../types";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showShareModal, setShowShareModal] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: post.image }} style={styles.postImage} />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? "#E91E63" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Likes and Caption */}
      <View style={styles.content}>
        <Text style={styles.likes}>{likesCount.toLocaleString()} likes</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.username}>{post.user.username}</Text>
          <Text style={styles.caption}> {post.caption}</Text>
        </View>
        {post.comments > 0 && (
          <TouchableOpacity onPress={onComment}>
            <Text style={styles.viewComments}>
              View all {post.comments} comments
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>

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
    backgroundColor: "white",
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
  content: {
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
  viewComments: {
    color: "#666",
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    color: "#666",
    fontSize: 12,
    textTransform: "uppercase",
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
