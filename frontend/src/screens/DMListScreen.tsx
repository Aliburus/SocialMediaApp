import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getUserConversations,
  getUserFriends,
  markMessagesAsSeen,
  deleteConversation,
} from "../services/api";
import socketService from "../services/socketService";
import { Swipeable } from "react-native-gesture-handler";
import { getUnreadMessageCount } from "../services/messageApi";
import LoadingSpinner from "../components/LoadingSpinner";

const DMListScreen: React.FC<{
  setUnreadMessageCount?: (n: number) => void;
  unreadMessageCount?: number;
}> = ({ setUnreadMessageCount, unreadMessageCount }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [dmList, setDmList] = React.useState<any[]>([]);
  const [showFriendsModal, setShowFriendsModal] = React.useState(false);
  const [friendSearch, setFriendSearch] = React.useState("");
  const [friends, setFriends] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const filteredFriends = friends.filter((u) => {
    const q = friendSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q))
    );
  });

  const loadConversations = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id || userObj?.id) {
        const userId = userObj._id || userObj.id;
        setCurrentUserId(userId);

        // Önce conversation'ları yükle
        const list = await getUserConversations(userId);
        setDmList(list);

        // Okunmamış sohbetler için backend'e okundu bilgisini gönder
        (list as any[]).forEach(async (dm: any) => {
          if (dm.unreadCount > 0 && dm.conversationId) {
            try {
              await markMessagesAsSeen(userId, dm.conversationId);
            } catch (e) {
              console.log("Mesajları okundu işaretleme hatası:", e);
            }
          }
        });

        // Sonra okunmamış mesaj sayısını getir (ayrı thread'de)
        setTimeout(async () => {
          try {
            const unreadData = await getUnreadMessageCount(userId);
            setUnreadCount(unreadData.unreadCount || 0);
          } catch (error) {
            console.error("Okunmamış mesaj sayısı getirme hatası:", error);
          }
        }, 500); // 500ms geciktir
      }
    } catch (error) {
      console.error("DM listesi yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadConversations();

    // Socket event listener'ları
    if (currentUserId) {
      socketService.onUnreadCountUpdate((data) => {
        if (data.userId === currentUserId) {
          setUnreadCount(data.unreadCount);
        }
      });
    }

    return () => {
      socketService.off("unread_count_update");
    };
  }, [currentUserId]);

  // Ekran odaklandığında listeyi yenile ve count'ları sıfırla
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        loadConversations();
        setUnreadCount(0);
        if (setUnreadMessageCount) setUnreadMessageCount(0);
      }
    }, [currentUserId])
  );

  React.useEffect(() => {
    if (showFriendsModal) {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id || userObj?.id) {
          const list = await getUserFriends(userObj._id || userObj.id);
          console.log("[DMListScreen] getUserFriends list:", list);
          setFriends(list);
        }
      })();
    }
  }, [showFriendsModal]);

  React.useEffect(() => {
    console.log("[DMListScreen] friends state:", friends);
  }, [friends]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUserId) return;
    try {
      await deleteConversation(currentUserId, conversationId);
      // Listeyi güncelle
      await loadConversations();
    } catch (e) {
      console.log("DM silme hatası:", e);
    }
  };

  const renderRightActions = (item: any) => (
    <TouchableOpacity
      style={{
        justifyContent: "center",
        alignItems: "center",
        width: 64,
        height: "100%",
        backgroundColor: "red",
      }}
      onPress={() => handleDeleteConversation(item.id)}
    >
      <Ionicons name="trash-outline" size={28} color="#fff" />
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => {
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        onSwipeableOpen={() => handleDeleteConversation(item.id)}
      >
        <TouchableOpacity
          style={[styles.dmItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate("DMChat", { user: item.user })}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.user?.avatar }} style={styles.avatar} />
            {/* Okunmamış mesaj sayısı için kırmızı nokta */}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.dmInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.user?.username || "Bilinmeyen Kullanıcı"}
            </Text>
            <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
              {item.lastMessage}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {item.time ? new Date(item.time).toLocaleDateString() : ""}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        setShowFriendsModal(false);
        setTimeout(() => {
          navigation.navigate("DMChat", { user: item });
        }, 0);
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      <Image
        source={{ uri: item.avatar }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
        }}
      />
      <Text style={{ color: colors.text, fontSize: 16 }}>{item.username}</Text>
    </TouchableOpacity>
  );

  React.useEffect(() => {
    if (typeof unreadMessageCount === "number") {
      setUnreadCount(unreadMessageCount);
    }
  }, [unreadMessageCount]);

  React.useEffect(() => {
    // dmList değiştiğinde kaç farklı sohbette unreadCount > 0 varsa onu bildir
    if (setUnreadMessageCount) {
      const unreadConversations = dmList.filter(
        (dm) => dm.unreadCount > 0
      ).length;
      setUnreadMessageCount(unreadConversations);
    }
  }, [dmList]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      {/* Üst bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, flex: 1, textAlign: "left" },
          ]}
        >
          Direct
        </Text>
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={() => setShowFriendsModal(true)}
        >
          <Ionicons name="create-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* DM Listesi */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={dmList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id || item._id || item.username}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 8,
              backgroundColor: colors.background,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {/* Arkadaşlar Modalı */}
      {showFriendsModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              width: "90%",
              maxHeight: "80%",
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  color: colors.text,
                  fontSize: 16,
                  height: 40,
                }}
                placeholder="Arkadaş ara..."
                placeholderTextColor={colors.textSecondary}
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
              <TouchableOpacity
                onPress={() => setShowFriendsModal(false)}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id || item._id || item.username}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 24,
                  }}
                >
                  Arkadaş bulunamadı
                </Text>
              }
            />
          </View>
        </View>
      )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 8,
  },
  dmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  dmInfo: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  unreadText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default DMListScreen;
