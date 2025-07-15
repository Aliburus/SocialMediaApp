import React, { useState, useEffect } from "react";
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
import api from "../services/api";
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
import { timeAgo } from "../utils/validate";

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
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [allConversations, setAllConversations] = React.useState<any[]>([]);
  const ITEMS_PER_PAGE = 10;
  const ITEM_HEIGHT = 80; // Ortalama bir DM satırı yüksekliği
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"followers" | "following">(
    "followers"
  );
  const [followers, setFollowers] = React.useState<any[]>([]);
  const [following, setFollowing] = React.useState<any[]>([]);
  const [followerSearch, setFollowerSearch] = React.useState("");
  const [followingSearch, setFollowingSearch] = React.useState("");

  const filteredDmList = dmList.filter((dm) => {
    const q = search.toLowerCase();
    return (
      (dm.user?.username && dm.user.username.toLowerCase().includes(q)) ||
      (dm.user?.fullName && dm.user.fullName.toLowerCase().includes(q)) ||
      (dm.user?.name && dm.user.name.toLowerCase().includes(q))
    );
  });

  const loadConversations = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id || userObj?.id) {
        const userId = userObj._id || userObj.id;
        setCurrentUserId(userId);

        // Conversation'ları yükle
        const list = await getUserConversations(userId);
        console.log("DMList gelen veri:", list);

        if (isInitial) {
          // İlk yüklemede 2 sayfa göster
          const initialItems = list.slice(0, ITEMS_PER_PAGE * 2);
          setDmList(initialItems);
          setAllConversations(list);
          setHasMore(list.length > ITEMS_PER_PAGE * 2);
          setPage(3); // Sonraki sayfa 3 olacak
        } else {
          // Daha fazla yükle
          const currentItems = dmList;
          const nextItems = list.slice(
            (page - 1) * ITEMS_PER_PAGE,
            page * ITEMS_PER_PAGE
          );
          setDmList([...currentItems, ...nextItems]);
          setHasMore(list.length > page * ITEMS_PER_PAGE);
          setPage(page + 1);
        }

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
        }, 500);
      }
    } catch (error) {
      console.error("DM listesi yükleme hatası:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreConversations = () => {
    if (!loadingMore && hasMore) {
      loadConversations(false);
    }
  };

  React.useEffect(() => {
    loadConversations();

    // Socket event listener'ları
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

  // Modal açıldığında hem followers hem following çek
  React.useEffect(() => {
    if (showFriendsModal) {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id || userObj?.id) {
          const userId = userObj._id || userObj.id;
          // getProfile ile çek
          const profileRes = await api.get(`/users/profile/${userId}`);
          // followers ve following id dizisi geliyor, her biri için profil çek
          const followerObjs = await Promise.all(
            (profileRes.data.followers || []).map(async (fid: string) => {
              try {
                const f = await api.get(`/users/profile/${fid}`);
                return f.data;
              } catch {
                return null;
              }
            })
          );
          setFollowers(followerObjs.filter(Boolean));
          const followingObjs = await Promise.all(
            (profileRes.data.following || []).map(async (fid: string) => {
              try {
                const f = await api.get(`/users/profile/${fid}`);
                return f.data;
              } catch {
                return null;
              }
            })
          );
          setFollowing(followingObjs.filter(Boolean));
        }
      })();
    }
  }, [showFriendsModal]);

  const filteredFollowers = followers.filter((u) => {
    const q = followerSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });
  const filteredFollowing = following.filter((u) => {
    const q = followingSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  React.useEffect(() => {}, [friends]);

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
            <Image
              source={{
                uri: item.user?.avatar?.startsWith("http")
                  ? item.user.avatar
                  : item.user?.avatar
                  ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                      item.user.avatar
                    }`
                  : "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.avatar}
            />
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
              {item.user?.username || "Unknown User"}
            </Text>
            <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
              {item.lastMessage}
            </Text>
            {item.lastMessageType === "story" && item.lastMessageStory && (
              <View style={styles.storyIndicator}>
                <Ionicons name="camera" size={12} color="#E91E63" />
                <Text style={styles.storyText}>Story</Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {item.time ? timeAgo(item.time) : ""}
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
        backgroundColor: colors.background,
      }}
    >
      <Image
        source={{
          uri:
            item.avatar &&
            typeof item.avatar === "string" &&
            item.avatar.length > 0
              ? item.avatar.startsWith("http")
                ? item.avatar
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.avatar}`
              : "https://ui-avatars.com/api/?name=User",
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
          backgroundColor: "#000",
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
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreConversations}
            onEndReachedThreshold={0.2}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={20}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            ListFooterComponent={
              loadingMore ? (
                <View
                  style={{ paddingVertical: 20, alignItems: "center", flex: 1 }}
                >
                  <LoadingSpinner size="small" />
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
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
            {/* Tabs */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: activeTab === "followers" ? 2 : 0,
                  borderBottomColor: colors.primary,
                }}
                onPress={() => setActiveTab("followers")}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: activeTab === "followers" ? "bold" : "normal",
                  }}
                >
                  Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: activeTab === "following" ? 2 : 0,
                  borderBottomColor: colors.primary,
                }}
                onPress={() => setActiveTab("following")}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: activeTab === "following" ? "bold" : "normal",
                  }}
                >
                  Following
                </Text>
              </TouchableOpacity>
            </View>
            {/* Search input for tab */}
            {activeTab === "followers" ? (
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  color: colors.text,
                  fontSize: 16,
                  height: 40,
                  marginBottom: 8,
                }}
                placeholder="Search followers..."
                placeholderTextColor={colors.textSecondary}
                value={followerSearch}
                onChangeText={setFollowerSearch}
              />
            ) : (
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  color: colors.text,
                  fontSize: 16,
                  height: 40,
                  marginBottom: 8,
                }}
                placeholder="Search following..."
                placeholderTextColor={colors.textSecondary}
                value={followingSearch}
                onChangeText={setFollowingSearch}
              />
            )}
            {/* List for tab */}
            <FlatList
              data={
                activeTab === "followers"
                  ? filteredFollowers
                  : filteredFollowing
              }
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
                  {activeTab === "followers"
                    ? "No followers found"
                    : "No following found"}
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
  storyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  storyText: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "600",
  },
});

export default DMListScreen;
