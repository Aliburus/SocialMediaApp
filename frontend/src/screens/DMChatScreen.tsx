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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConversationMessages, sendMessage } from "../services/api";
import socketService from "../services/socketService";
import { StackNavigationProp } from "@react-navigation/stack";

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

  React.useEffect(() => {
    (async () => {
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
        console.log("DMChatScreen - Gelen mesajlar:", data.messages);
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg._id,
            fromMe: (msg.sender._id || msg.sender) === currentUserId,
            text: msg.text,
            createdAt: msg.createdAt,
            post: msg.post,
            story: msg.story,
          }))
        );
      }
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

    socketService.onMessageSent((data) => {
      // Mesaj gönderildi onayı
      console.log("Mesaj gönderildi:", data);
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

    return () => {
      // Cleanup
      socketService.off("new_message");
      socketService.off("message_sent");
      socketService.off("user_typing");
      socketService.off("user_stopped_typing");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Üst bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("UserProfile", { user })}
        >
          <Image
            source={{
              uri: user?.avatar || "https://placehold.co/100x100/000/fff",
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={[styles.username, { color: colors.text }]}>
          {user?.username || "kullanici"}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ChatHistory", { user })}
          style={styles.infoButton}
        >
          <Ionicons
            name="information-circle-outline"
            size={26}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Mesajlar */}
        {messages.length === 0 ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
              Henüz mesaj yok
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
                <Text
                  style={[styles.typingText, { color: colors.textSecondary }]}
                >
                  {user?.username || "Kullanıcı"} yazıyor...
                </Text>
              </View>
            )}
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                console.log("[DMChatScreen] Render edilen mesaj:", item);
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
                        style={styles.avatarContainer}
                      >
                        <Image
                          source={{
                            uri:
                              user?.avatar ||
                              "https://placehold.co/100x100/000/fff",
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
                      {/* Post paylaşımı ise detaylı kart */}
                      {item.post && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: "transparent",
                          }}
                          onPress={() =>
                            navigation.navigate("PostDetail", {
                              post: item.post,
                            })
                          }
                        >
                          {/* Üstte küçük avatar ve username yatay, sol üstte */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 6,
                              marginLeft: 2,
                            }}
                          >
                            <Image
                              source={{
                                uri:
                                  item.post.user?.avatar ||
                                  "https://placehold.co/100x100/000/fff",
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                marginRight: 8,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: colors.text,
                              }}
                            >
                              {item.post.user?.username || "Kullanıcı"}
                            </Text>
                          </View>
                          {/* Ortada büyük görsel */}
                          <Image
                            source={{ uri: item.post.image }}
                            style={{
                              width: 220,
                              height: 220,
                              borderRadius: 8,
                              alignSelf: "flex-start",
                              backgroundColor: "#111",
                            }}
                          />
                        </TouchableOpacity>
                      )}

                      {/* Story paylaşımı ise detaylı kart */}
                      {item.story && (
                        <TouchableOpacity
                          style={[
                            styles.shareCard,
                            {
                              backgroundColor: item.fromMe
                                ? colors.background
                                : colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() =>
                            navigation.navigate("StoryScreen", {
                              story: item.story,
                            })
                          }
                        >
                          <View style={styles.shareCardHeader}>
                            <Image
                              source={{
                                uri:
                                  item.story.user?.avatar ||
                                  "https://placehold.co/100x100/000/fff",
                              }}
                              style={styles.shareCardAvatar}
                            />
                            <Text
                              style={[
                                styles.shareCardUsername,
                                {
                                  color: item.fromMe
                                    ? colors.background
                                    : colors.text,
                                },
                              ]}
                            >
                              {item.story.user?.username || "Kullanıcı"}
                            </Text>
                            <Ionicons
                              name="camera"
                              size={16}
                              color={
                                item.fromMe ? colors.background : colors.primary
                              }
                              style={{ marginLeft: 8 }}
                            />
                          </View>
                          <View style={{ position: "relative" }}>
                            <Image
                              source={{ uri: item.story.image }}
                              style={styles.shareCardImage}
                            />
                            <View
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 40,
                                backgroundColor: "rgba(0,0,0,0.3)",
                              }}
                            />
                          </View>
                          <Text
                            style={[
                              styles.shareCardDescription,
                              {
                                color: item.fromMe
                                  ? colors.background
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            Hikaye
                          </Text>
                        </TouchableOpacity>
                      )}
                      {/* Normal mesaj metni */}
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
                      <Text
                        style={[
                          styles.messageTime,
                          {
                            color: item.fromMe
                              ? colors.background
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
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.messagesList}
              inverted
            />
          </>
        )}

        {/* Mesaj yazma kutusu */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surface },
            ]}
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
            style={{ opacity: !newMessage.trim() || sending ? 0.5 : 1 }}
          >
            <Ionicons
              name="send"
              size={24}
              color={newMessage.trim() ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 10,
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
  },
  infoButton: {
    marginLeft: 8,
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  typingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  shareCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
  },
  shareCardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  shareCardUsername: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  shareCardImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  shareCardDescription: {
    fontSize: 12,
    padding: 12,
    paddingTop: 8,
    lineHeight: 16,
  },
  shareCardModern: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    maxWidth: 260,
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: "center",
  },
  shareCardModernHeader: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  shareCardModernAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 6,
  },
  shareCardModernUsername: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  shareCardModernImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 8,
    backgroundColor: "#111",
  },
  shareCardModernFooter: {
    backgroundColor: "#333",
    paddingVertical: 8,
    alignItems: "center",
  },
  shareCardModernFooterText: {
    color: "#bbb",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

export default DMChatScreen;
