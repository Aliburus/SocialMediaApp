import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  InteractionManager,
  Alert,
  Switch,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { acceptFollowRequest, rejectFollowRequest } from "../services/api";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../services/notificationApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Swipeable } from "react-native-gesture-handler";
import { useUser } from "../context/UserContext";
import FollowButton from "../components/FollowButton";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";

type RootStackParamList = {
  UserProfile: { user: any };
  PostDetail: { post: any };
  // diğer ekranlar...
};

function NotificationsScreen({
  setUnreadNotifCount,
}: {
  setUnreadNotifCount?: (n: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [followEnabled, setFollowEnabled] = useState(true);
  const { user, refreshUser } = useUser();

  // Bildirimleri getir fonksiyonu
  const fetchNotifications = async (uid: string) => {
    console.log("fetchNotifications çağrıldı, uid:", uid);
    setLoading(true);
    setError(null);
    try {
      console.log("getNotifications API çağrısı yapılıyor...");
      const notifs = await getNotifications(uid);
      console.log("getNotifications sonucu:", notifs);
      setNotifications(notifs);
      const followed = (notifs as any[])
        .filter(
          (n: any) =>
            n.type === "follow" &&
            n.status === "accepted" &&
            Array.isArray(n.user?.followers) &&
            n.user.followers.some(
              (f: any) => String(f._id || f) === String(uid)
            )
        )
        .map((n: any) => String(n.user?._id || n.user?.id))
        .filter(Boolean);
      setFollowedIds(followed);
      await refreshUser();
      console.log("fetchNotifications başarıyla tamamlandı");

      // Bildirimleri okundu yap ve count'u sıfırla
      await markAllNotificationsAsRead(uid);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      if (setUnreadNotifCount) setUnreadNotifCount(0);
    } catch (err) {
      console.error("[NOTIFICATIONS_SCREEN] Bildirim getirme hatası:", err);
      setError("Bildirimler yüklenemedi");
    }
    setLoading(false);
  };

  // Kullanıcıyı al
  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        setUserId(userObj?._id || userObj?.id || null);
      } catch (err) {
        setUserId(null);
      }
    })();
  }, []);

  // userId değiştiğinde bildirimleri getir
  React.useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
      refreshUser();
    }
  }, [userId]);

  // Pull to refresh fonksiyonu
  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    InteractionManager.runAfterInteractions(async () => {
      await fetchNotifications(userId);
      setRefreshing(false);
    });
  };

  const handleAccept = async (notifId: string, requesterId: string) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) return;
      await acceptFollowRequest(userId, requesterId);

      // Sadece local state'i güncelle, tekrar fetch etme
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notifId
            ? {
                ...notif,
                status: "accepted",
                type: "follow",
                text: `${
                  notif.user?.username || notif.from?.username
                } seni takip etmeye başladı`,
              }
            : notif
        )
      );
    } catch (err) {
      console.error("Accept follow request error:", err);
    }
  };

  const handleReject = async (notifId: string, requesterId: string) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) return;
      await rejectFollowRequest(userId, requesterId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
    } catch (err) {
      // Hata yönetimi eklenebilir
    }
  };

  const handleMarkAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notifId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      // Backend'de bildirimi sil
      await fetch(`${process.env.BACKEND_URL}/api/notifications/${notifId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Frontend'den kaldır
      setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
    } catch (error) {
      console.error("[NOTIFICATIONS] Bildirim silme hatası:", error);
      // Hata olsa bile frontend'den kaldır
      setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    // Profil sayfasına git
    const goToProfile = () => {
      const userParam = item.user?._id
        ? { ...item.user, id: item.user._id }
        : item.user;
      navigation.navigate("UserProfile", { user: userParam });
    };

    // Gönderi sayfasına git
    const goToPost = () => {
      try {
        if (item.post && item.post._id) {
          navigation.navigate("PostDetail", { post: item.post });
        }
      } catch (error) {
        console.error("[NOTIFICATIONS] Gönderi sayfasına gitme hatası:", error);
      }
    };

    // Grup bildirimi için kullanıcı avatarları
    const renderUserAvatars = () => {
      if (item.users && item.users.length > 0) {
        return (
          <View style={{ flexDirection: "row", marginRight: 8 }}>
            {item.users.slice(0, 3).map((user: any, index: number) => (
              <TouchableOpacity
                key={user._id || user.id}
                onPress={goToProfile}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.background,
                  marginLeft: index > 0 ? -8 : 0,
                  zIndex: 3 - index,
                }}
              >
                <Image
                  source={{
                    uri: user.avatar?.startsWith("http")
                      ? user.avatar
                      : user.avatar
                      ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                          user.avatar
                        }`
                      : "https://ui-avatars.com/api/?name=User",
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      }
      return null;
    };

    const getNotificationIcon = () => {
      switch (item.type) {
        case "like":
          return <Ionicons name="heart" size={24} color="#FF3040" />;
        case "comment":
          return <Ionicons name="chatbubble" size={24} color="#4F8EF7" />;
        case "follow":
          return <Ionicons name="person-add" size={24} color="#4F8EF7" />;
        case "mention":
          return <Ionicons name="at" size={24} color="#FF9500" />;
        default:
          return (
            <Ionicons
              name="notifications"
              size={24}
              color={colors.textSecondary}
            />
          );
      }
    };

    return (
      <View
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.isRead ? colors.background : colors.surface,
          },
        ]}
      >
        {/* Profil fotoğrafı - tıklanabilir */}
        <TouchableOpacity onPress={goToProfile}>
          {renderUserAvatars() || (
            <Image
              source={{
                uri: (item.user?.avatar || item.from?.avatar)?.startsWith(
                  "http"
                )
                  ? item.user?.avatar || item.from?.avatar
                  : item.user?.avatar || item.from?.avatar
                  ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                      item.user?.avatar || item.from?.avatar
                    }`
                  : "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.avatar}
              onLoad={() =>
                console.log("NotificationsScreen: Avatar loaded successfully")
              }
              onError={(error) =>
                console.log("NotificationsScreen: Avatar load error:", error)
              }
            />
          )}
        </TouchableOpacity>

        {/* Bildirim içeriği - tıklanabilir */}
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={() => handleMarkAsRead(item.id)}
        >
          <View style={styles.notificationText}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.user?.username || item.from?.username}
            </Text>
            <Text
              style={[
                styles.notificationMessage,
                { color: colors.textSecondary },
              ]}
            >
              {" "}
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </TouchableOpacity>

        <View style={styles.notificationIcon}>{getNotificationIcon()}</View>

        {/* Gönderi thumbnail - tıklanabilir */}
        {item.post && item.post.image && (
          <TouchableOpacity onPress={goToPost}>
            <Image
              source={{ uri: item.post.image }}
              style={styles.postThumbnail}
            />
          </TouchableOpacity>
        )}

        {/* Takip isteği için onayla/reddet butonları veya merkezi FollowButton */}
        {item.type === "follow_request" && item.status !== "accepted" ? (
          <View style={{ flexDirection: "row", marginLeft: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                marginRight: 6,
              }}
              onPress={() =>
                handleAccept(item.id, item.user?._id || item.from?._id)
              }
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() =>
                handleReject(item.id, item.user?._id || item.from?._id)
              }
            >
              <Text style={{ color: colors.text, fontWeight: "bold" }}>
                Reddet
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {item.type === "follow_request" && item.status === "accepted" && (
          <FollowButton
            currentUserId={userId || ""}
            targetUserId={item.user?._id || item.from?._id}
            username={item.user?.username || item.from?.username}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    );
  };

  // Swipeable sağdan sola kaydırınca silme (DMListScreen ile aynı yapı)
  const renderRightActions = (item: any) => (
    <TouchableOpacity
      style={{
        justifyContent: "center",
        alignItems: "center",
        width: 64,
        height: "100%",
        backgroundColor: "red",
      }}
      onPress={() => handleDeleteNotification(item.id)}
    >
      <Ionicons name="trash-outline" size={28} color="#fff" />
    </TouchableOpacity>
  );

  // Bildirim item'ı için Swipeable ile sarmalanmış render fonksiyonu (DMListScreen ile aynı yapı)
  const renderItem = ({ item }: { item: any }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      onSwipeableOpen={() => handleDeleteNotification(item.id)}
    >
      {renderNotificationItem({ item })}
    </Swipeable>
  );

  const renderNotif = ({ item }: { item: any }) => {
    // DEBUG: following dizisini logla
    if (user && Array.isArray(user.following)) {
      console.log(
        "Kendi following dizisi:",
        user.following.map((id: any) => String(id))
      );
    }
    const itemUserId = String(
      item.user?._id || item.user?.id || item.from?._id || item.from?.id
    );
    const isFollowed =
      user &&
      Array.isArray(user.following) &&
      user.following.map((id: any) => String(id)).includes(itemUserId);
    const goToProfile = () => {
      const userParam = item.user?._id
        ? { ...item.user, id: item.user._id }
        : item.user;
      navigation.navigate("UserProfile", { user: userParam });
    };

    // Grup bildirimi için kullanıcı avatarları
    const renderUserAvatars = () => {
      if (item.users && item.users.length > 0) {
        return (
          <View style={{ flexDirection: "row", marginRight: 8 }}>
            {item.users.slice(0, 3).map((user: any, index: number) => (
              <TouchableOpacity
                key={user._id || user.id}
                onPress={goToProfile}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.background,
                  marginLeft: index > 0 ? -8 : 0,
                  zIndex: 3 - index,
                }}
              >
                <Image
                  source={{
                    uri: user.avatar?.startsWith("http")
                      ? user.avatar
                      : user.avatar
                      ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                          user.avatar
                        }`
                      : "https://ui-avatars.com/api/?name=User",
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      }
      return null;
    };
    if (
      (item.type === "follow" || item.type === "follow_request") &&
      item.status === "pending"
    ) {
      return (
        <TouchableOpacity
          onPress={goToProfile}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Image
            source={{
              uri:
                item.user?.avatar || item.from?.avatar
                  ? item.user?.avatar || item.from?.avatar
                  : "https://ui-avatars.com/api/?name=User",
            }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text }}>
              <Text style={{ fontWeight: "bold" }}>
                {item.user?.username || item.from?.username}
              </Text>{" "}
              seni takip etmek istiyor
            </Text>
            <FollowButton
              currentUserId={userId || ""}
              targetUserId={item.user?._id || item.user?.id}
              username={item.user?.username}
              style={{ marginTop: 8, marginLeft: 0 }}
            />
          </View>
        </TouchableOpacity>
      );
    }
    if (item.type === "follow" && item.status === "accepted") {
      let followType: "unfollow" | "follow_back" | "follow" = "follow_back";
      if (isFollowed) {
        followType = "unfollow";
      } else if (
        user &&
        Array.isArray(user.followers) &&
        user.followers.map((id: any) => String(id)).includes(itemUserId)
      ) {
        followType = "follow_back";
      } else {
        followType = "follow";
      }
      return (
        <TouchableOpacity
          onPress={goToProfile}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          {renderUserAvatars() || (
            <Image
              source={{
                uri:
                  item.user?.avatar || item.from?.avatar
                    ? item.user?.avatar || item.from?.avatar
                    : "https://ui-avatars.com/api/?name=User",
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: 12,
              }}
            />
          )}
          <Text style={{ color: colors.text, flex: 1 }}>
            <Text style={{ fontWeight: "bold" }}>
              {item.user?.username || item.from?.username}
            </Text>{" "}
            seni takip etmeye başladı
          </Text>
          <FollowButton
            currentUserId={userId || ""}
            targetUserId={item.user?._id || item.user?.id}
            username={item.user?.username}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      );
    }
    return renderNotificationItem({ item });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
          Bildirimler
        </Text>
      </View>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 32,
            color: colors.error,
          }}
        >
          {error}
        </Text>
      ) : notifications.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 32,
            color: colors.textSecondary,
          }}
        >
          Hiç bildirimin yok.
        </Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  unreadNotification: {
    // backgroundColor will be set dynamically
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
    fontSize: 16,
  },
  notificationMessage: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  notificationIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  postThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  text: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});

export default NotificationsScreen;
