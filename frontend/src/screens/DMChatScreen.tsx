import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsSeen,
  getUnreadMessageCount,
} from "../services/messageApi";
import socketService from "../services/socketService";
import { StackNavigationProp } from "@react-navigation/stack";
import LoadingSpinner from "../components/LoadingSpinner";

// Story'nin süresinin bitip bitmediğini kontrol eden fonksiyon
const isStoryExpired = (storyTimestamp: string | Date) => {
  const storyDate = new Date(storyTimestamp);
  const now = new Date();
  const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
  console.log("Story timestamp:", storyTimestamp);
  console.log("Story date:", storyDate);
  console.log("Now:", now);
  console.log("Hours diff:", hoursDiff);
  console.log("Is expired:", hoursDiff >= 24);
  return hoursDiff >= 24; // 24 saat sonra story süresi biter
};

const DMChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { user } = (route.params as any) || {};
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [otherUserTyping, setOtherUserTyping] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id || userObj?.id) {
        const currentUserId = userObj._id || userObj.id;
        setCurrentUserId(currentUserId);

        // Socket.io bağlantısı
        socketService.connect(currentUserId);

        const data = await getConversationMessages(
          currentUserId,
          user._id || user.id
        );

        setConversationId(data.conversationId);

        setMessages(
          data.messages.map((msg: any) => ({
            id: msg._id,
            fromMe: (msg.sender._id || msg.sender) === currentUserId,
            text: msg.text,
            createdAt: msg.createdAt,
            post: msg.post,
            story: msg.story,
            read: msg.read,
            seenAt: msg.seenAt,
          }))
        );

        // Sohbet açıldığında mesajları görüldü olarak işaretle
        if (data.conversationId) {
          try {
            await markMessagesAsSeen(currentUserId, data.conversationId);
            // Socket üzerinden de bildir
            socketService.markMessagesAsSeen(
              currentUserId,
              data.conversationId
            );
            // Okunmamış mesaj sayısını anında güncelle
            if (typeof setUnreadMessageCount === "function") {
              const unreadData = await getUnreadMessageCount(currentUserId);
              setUnreadMessageCount(unreadData.unreadCount || 0);
            }
            console.log("Mesajlar görüldü olarak işaretlendi");
          } catch (error) {
            console.error("Mesajları görüldü olarak işaretleme hatası:", error);
          }
        }
      }
      setLoading(false);
    })();

    // Socket.io event listeners
    socketService.onNewMessage((data) => {
      if (data.senderId === (user._id || user.id)) {
        // Gelen mesajı veritabanından al
        const fetchNewMessage = async () => {
          try {
            if (!currentUserId) return;
            const data = await getConversationMessages(
              currentUserId,
              user._id || user.id
            );
            if (data.messages.length > 0) {
              const latestMessage = data.messages[0]; // En son mesaj
              setMessages((prev) => {
                // Mesaj zaten var mı kontrol et
                const exists = prev.find((msg) => msg.id === latestMessage._id);
                if (!exists) {
                  return [
                    {
                      id: latestMessage._id,
                      fromMe: false,
                      text: latestMessage.text,
                      createdAt: latestMessage.createdAt,
                    },
                    ...prev,
                  ];
                }
                return prev;
              });
            }
          } catch (error) {
            console.error("Yeni mesaj getirme hatası:", error);
          }
        };
        fetchNewMessage();
      }
    });

    socketService.onUserTyping((data) => {
      if (data.senderId === (user._id || user.id)) {
        setOtherUserTyping(true);
      }
    });

    socketService.onUserStoppedTyping((data) => {
      if (data.senderId === (user._id || user.id)) {
        setOtherUserTyping(false);
      }
    });

    // Mesajların görüldüğünü dinle
    socketService.onMessagesSeen((data) => {
      if (data.conversationId === conversationId) {
        // Mesajları güncelle
        setMessages((prev) =>
          prev.map((msg) =>
            !msg.fromMe && !msg.read
              ? { ...msg, read: true, seenAt: new Date() }
              : msg
          )
        );
      }
    });

    return () => {
      // Cleanup
      socketService.off("new_message");
      socketService.off("message_sent");
      socketService.off("user_typing");
      socketService.off("user_stopped_typing");
      socketService.off("messages_seen");
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUserId || !conversationId)
      return;

    try {
      setSending(true);
      const messageText = newMessage.trim();
      const receiverId = user._id || user.id;

      // Önce API ile mesajı veritabanına kaydet
      const sentMessage = await sendMessage({
        senderId: currentUserId,
        receiverId: receiverId,
        text: messageText,
      });

      // Socket.io ile mesaj gönder
      socketService.sendMessage(
        currentUserId,
        receiverId,
        messageText,
        conversationId
      );

      // Mesajı listeye ekle (gerçek ID ile)
      setMessages((prev) => [
        {
          id: sentMessage._id,
          fromMe: true,
          text: messageText,
          createdAt: sentMessage.createdAt,
        },
        ...prev,
      ]);

      setNewMessage("");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    } finally {
      setSending(false);
    }
  };

  // Yazıyor... durumu için
  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!currentUserId) return;

    const receiverId = user._id || user.id;

    if (text.trim() && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(currentUserId, receiverId);
    } else if (!text.trim() && isTyping) {
      setIsTyping(false);
      socketService.stopTyping(currentUserId, receiverId);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Enhanced Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={() => navigation.navigate("UserProfile", { user })}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  user?.avatar ||
                  "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
              }}
              style={styles.avatar}
            />
            <View
              style={[styles.onlineIndicator, { backgroundColor: "#4CAF50" }]}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {user?.username || "kullanici"}
            </Text>
            <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
              Aktif
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("ChatHistory", { user })}
          style={styles.infoButton}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={48}
                color={colors.textSecondary}
              />
            </View>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              Henüz mesaj yok
            </Text>
            <Text
              style={[
                styles.emptyStateSubtext,
                { color: colors.textSecondary },
              ]}
            >
              İlk mesajınızı gönderin
            </Text>
          </View>
        ) : (
          <>
            {otherUserTyping && (
              <View
                style={[
                  styles.typingIndicator,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.typingDots}>
                  <View
                    style={[
                      styles.typingDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.typingDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.typingDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.typingText, { color: colors.textSecondary }]}
                >
                  {user?.username || "Kullanıcı"} yazıyor...
                </Text>
              </View>
            )}

            <FlatList
              data={messages.filter((msg) => {
                if (msg.story) {
                  console.log(
                    "Story object:",
                    JSON.stringify(msg.story, null, 2)
                  );
                  const expired = isStoryExpired(msg.story.createdAt);
                  const archived = msg.story.archived === true;
                  console.log(
                    "Message has story, expired:",
                    expired,
                    "archived:",
                    archived
                  );
                  return !expired && !archived;
                }
                return true;
              })}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const lastMyMessageIndex = messages.findIndex((m) => m.fromMe);
                const isLastMyMessage =
                  item.fromMe && index === lastMyMessageIndex;

                return (
                  <View
                    style={[
                      styles.messageContainer,
                      item.fromMe
                        ? styles.myMessageContainer
                        : styles.theirMessageContainer,
                    ]}
                  >
                    {!item.fromMe && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("UserProfile", { user })
                        }
                        style={styles.messageAvatarContainer}
                      >
                        <Image
                          source={{
                            uri:
                              user?.avatar ||
                              "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
                          }}
                          style={styles.messageAvatar}
                        />
                      </TouchableOpacity>
                    )}

                    <View
                      style={[
                        styles.messageBubble,
                        item.fromMe
                          ? [
                              styles.myMessage,
                              { backgroundColor: colors.primary },
                            ]
                          : [
                              styles.theirMessage,
                              { backgroundColor: colors.surface },
                            ],
                      ]}
                    >
                      {/* Enhanced Post sharing */}
                      {item.post && (
                        <TouchableOpacity
                          style={[
                            styles.postContainer,
                            {
                              backgroundColor: item.fromMe
                                ? "rgba(255,255,255,0.05)"
                                : colors.background,
                              borderColor: item.fromMe
                                ? "rgba(255,255,255,0.1)"
                                : colors.border,
                            },
                          ]}
                          onPress={() =>
                            navigation.navigate("PostDetail", {
                              post: item.post,
                            })
                          }
                        >
                          <View style={styles.postHeader}>
                            <Image
                              source={{
                                uri:
                                  item.post.user?.avatar ||
                                  "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
                              }}
                              style={styles.postAvatar}
                            />
                            <View style={styles.postHeaderText}>
                              <Text
                                style={[
                                  styles.postUsername,
                                  {
                                    color: item.fromMe
                                      ? "#ffffff"
                                      : colors.text,
                                  },
                                ]}
                              >
                                {item.post.user?.username || "kullanici"}
                              </Text>
                              <Text
                                style={[
                                  styles.postTime,
                                  {
                                    color: item.fromMe
                                      ? "rgba(255,255,255,0.7)"
                                      : colors.textSecondary,
                                  },
                                ]}
                              >
                                2s
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.postMoreButton}>
                              <Ionicons
                                name="ellipsis-horizontal"
                                size={16}
                                color={
                                  item.fromMe
                                    ? "rgba(255,255,255,0.8)"
                                    : colors.textSecondary
                                }
                              />
                            </TouchableOpacity>
                          </View>

                          <Image
                            source={{
                              uri:
                                item.post.image ||
                                "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
                            }}
                            style={styles.postImage}
                          />

                          <View style={styles.postActions}>
                            <View style={styles.postActionsLeft}>
                              <TouchableOpacity style={styles.postActionButton}>
                                <Ionicons
                                  name="heart-outline"
                                  size={20}
                                  color={item.fromMe ? "#ffffff" : colors.text}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.postActionButton}>
                                <Ionicons
                                  name="chatbubble-outline"
                                  size={20}
                                  color={item.fromMe ? "#ffffff" : colors.text}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.postActionButton}>
                                <Ionicons
                                  name="paper-plane-outline"
                                  size={20}
                                  color={item.fromMe ? "#ffffff" : colors.text}
                                />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity>
                              <Ionicons
                                name="bookmark-outline"
                                size={20}
                                color={item.fromMe ? "#ffffff" : colors.text}
                              />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.postFooter}>
                            <Text
                              style={[
                                styles.postLikes,
                                {
                                  color: item.fromMe ? "#ffffff" : colors.text,
                                },
                              ]}
                            >
                              142 beğenme
                            </Text>
                            {item.post.caption && (
                              <Text
                                style={[
                                  styles.postCaption,
                                  {
                                    color: item.fromMe
                                      ? "rgba(255,255,255,0.9)"
                                      : colors.text,
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                <Text style={styles.postCaptionUsername}>
                                  {item.post.user?.username || "kullanici"}{" "}
                                </Text>
                                {item.post.caption || "Güzel bir gönderi"}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Enhanced Story sharing */}
                      {item.story &&
                        (item.story.archived ||
                        isStoryExpired(item.story.createdAt) ? (
                          <View
                            style={[
                              styles.storyContainer,
                              {
                                backgroundColor: colors.border,
                                borderColor: colors.border,
                                opacity: 0.7,
                                padding: 16,
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 80,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: colors.textSecondary,
                                fontSize: 14,
                                textAlign: "center",
                              }}
                            >
                              Gönderi yüklenemiyor veya silindi
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.storyContainer,
                              {
                                backgroundColor: item.fromMe
                                  ? "rgba(255,255,255,0.05)"
                                  : colors.background,
                                borderColor: item.fromMe
                                  ? "rgba(255,255,255,0.1)"
                                  : colors.border,
                              },
                            ]}
                            onPress={() =>
                              navigation.navigate("StoryScreen", {
                                story: item.story,
                              })
                            }
                          >
                            <View style={styles.storyHeader}>
                              <View
                                style={[
                                  styles.storyAvatarRing,
                                  {
                                    borderColor: colors.primary,
                                    borderWidth: 2,
                                  },
                                ]}
                              >
                                <Image
                                  source={{
                                    uri:
                                      item.story.user?.avatar ||
                                      "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
                                  }}
                                  style={styles.storyAvatar}
                                />
                              </View>
                              <View style={styles.storyHeaderText}>
                                <Text
                                  style={[
                                    styles.storyUsername,
                                    {
                                      color: item.fromMe
                                        ? "#ffffff"
                                        : colors.text,
                                    },
                                  ]}
                                >
                                  {item.story.user?.username || "kullanici"}
                                </Text>
                                <Text
                                  style={[
                                    styles.storyTime,
                                    {
                                      color: item.fromMe
                                        ? "rgba(255,255,255,0.7)"
                                        : colors.textSecondary,
                                    },
                                  ]}
                                >
                                  5dk
                                </Text>
                              </View>
                            </View>

                            <View style={styles.storyImageWrapper}>
                              <View style={styles.storyProgressBar}>
                                <View
                                  style={[
                                    styles.storyProgress,
                                    { backgroundColor: colors.primary },
                                  ]}
                                />
                              </View>
                              <Image
                                source={{
                                  uri:
                                    item.story.image ||
                                    "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
                                }}
                                style={styles.storyImage}
                              />
                              <View style={styles.storyOverlay}>
                                <View style={styles.storyPlayIcon}>
                                  <Ionicons
                                    name="play"
                                    size={12}
                                    color="#fff"
                                  />
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}

                      {/* Enhanced Message text */}
                      {item.text && (
                        <Text
                          style={[
                            styles.messageText,
                            {
                              color: item.fromMe
                                ? colors.background
                                : colors.text,
                            },
                          ]}
                        >
                          {item.text}
                        </Text>
                      )}

                      {/* Enhanced Message time */}
                      <Text
                        style={[
                          styles.messageTime,
                          {
                            color: item.fromMe
                              ? "rgba(255,255,255,0.7)"
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString(
                              "tr-TR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </Text>

                      {/* Enhanced Seen indicator */}
                      {isLastMyMessage && item.seenAt && (
                        <View style={styles.seenContainer}>
                          <Ionicons
                            name="checkmark-done"
                            size={14}
                            color="rgba(255,255,255,0.8)"
                          />
                          <Text style={styles.seenText}>Görüldü</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.messagesList}
              inverted
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {/* Enhanced Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[styles.inputContainer, { backgroundColor: colors.surface }]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.textSecondary}
              value={newMessage}
              onChangeText={handleTyping}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              style={[
                styles.sendButton,
                {
                  backgroundColor: newMessage.trim()
                    ? colors.primary
                    : colors.surface,
                  opacity: !newMessage.trim() || sending ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="send"
                size={18}
                color={
                  newMessage.trim() ? colors.background : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.8,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
  },
  typingDots: {
    flexDirection: "row",
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 8,
  },
  theirMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 8,
  },
  postContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  postHeaderText: {
    flex: 1,
  },
  postUsername: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  postTime: {
    fontSize: 11,
    marginTop: 1,
  },
  postMoreButton: {
    padding: 4,
  },
  postImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#000",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postActionButton: {
    marginRight: 16,
    padding: 4,
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postLikes: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  postCaptionUsername: {
    fontWeight: "700",
  },
  storyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  storyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storyAvatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  storyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  storyHeaderText: {
    flex: 1,
  },
  storyUsername: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  storyTime: {
    fontSize: 11,
    marginTop: 1,
  },
  storyImageWrapper: {
    position: "relative",
  },
  storyProgressBar: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    zIndex: 2,
  },
  storyProgress: {
    height: "100%",
    width: "60%",
    borderRadius: 1,
  },
  storyImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#000",
  },
  storyOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  storyPlayIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  storyImageContainer: {
    position: "relative",
  },
  storyGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  storyPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    opacity: 0.8,
  },
  seenContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  seenText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    marginLeft: 2,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default DMChatScreen;
