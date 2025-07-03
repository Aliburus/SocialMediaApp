import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConversationMessages } from "../services/api";
import { StackNavigationProp } from "@react-navigation/stack";

const DMChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { user } = (route.params as any) || {};
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id || userObj?.id) {
        const data = await getConversationMessages(
          userObj._id || userObj.id,
          user._id || user.id
        );
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg._id,
            fromMe:
              (msg.sender._id || msg.sender) === (userObj._id || userObj.id),
            text: msg.text,
          }))
        );
      }
    })();
  }, [user]);

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
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.fromMe
                  ? [styles.myMessage, { backgroundColor: colors.primary }]
                  : [styles.theirMessage, { backgroundColor: colors.surface }],
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
            </View>
          )}
          contentContainerStyle={styles.messagesList}
          inverted
        />
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
        />
        <TouchableOpacity>
          <Ionicons name="send" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
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
