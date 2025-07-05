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
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg._id,
            fromMe: (msg.sender._id || msg.sender) === currentUserId,
            text: msg.text,
            createdAt: msg.createdAt,
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
      const sentMessage = await sendMessage(
        currentUserId,
        receiverId,
        messageText
      );

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
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.fromMe
                      ? [styles.myMessage, { backgroundColor: colors.primary }]
                      : [
                          styles.theirMessage,
                          { backgroundColor: colors.surface },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: item.fromMe ? colors.background : colors.text },
                    ]}
                  >
                    {item.text}
                  </Text>
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
                      ? new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
              )}
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
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
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
});

export default DMChatScreen;
