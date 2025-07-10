import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import api, { searchUsers as searchUsersApi } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import FollowButton from "../components/FollowButton";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { Video, ResizeMode } from "expo-av";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 2;
const ITEM_HEIGHT = ITEM_WIDTH * 1.3; // oranı koru
const SEARCH_INPUT_HEIGHT = 80;
const ROWS_ON_SCREEN = Math.floor((height - SEARCH_INPUT_HEIGHT) / ITEM_HEIGHT);
const PAGE_SIZE = 2 * ROWS_ON_SCREEN * 3;

interface Post {
  _id: string;
  image: string;
  description: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  likes: string[];
  comments: any[];
  createdAt: string;
  type: string; // 'reel' veya 'image'
  video?: string; // Sadece 'reel' tipinde olabilir
}

const ExploreScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Arama için
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const navigation = useNavigation<NavigationProp<any>>();

  const loadExploreFeed = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await api.get(`/explore/feed?page=${pageNum}&limit=20`);

      if (response.data.success) {
        if (refresh || pageNum === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts((prev) => [...prev, ...response.data.posts]);
        }
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Keşfet feed yükleme hatası:", error);
      Alert.alert("Hata", "İçerikler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const trackUserBehavior = async (
    contentId: string,
    behaviorType: string,
    duration = 0
  ) => {
    try {
      await api.post("/explore/track", {
        contentId,
        behaviorType,
        duration,
      });
    } catch (error) {
      console.error("Davranış kaydetme hatası:", error);
    }
  };

  const handlePostPress = (post: Post) => {
    trackUserBehavior(post._id, "view");
    // Post detay sayfasına git
  };

  const handlePostLike = async (post: Post) => {
    trackUserBehavior(post._id, "like");
  };

  const handlePostComment = (post: Post) => {
    trackUserBehavior(post._id, "comment");
  };

  const handlePostSave = (post: Post) => {
    trackUserBehavior(post._id, "save");
  };

  const handleRefresh = () => {
    loadExploreFeed(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setDisplayedPosts(posts.slice(0, nextPage * PAGE_SIZE));
      setPage(nextPage);
      if (posts.length <= nextPage * PAGE_SIZE) setHasMore(false);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    if (item.type !== "reel") return null;
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.8}
      >
        {item.video ? (
          <Video
            source={{
              uri: item.video.startsWith("http")
                ? item.video
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.video}`,
            }}
            style={styles.postImage}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
          />
        ) : (
          <Image
            source={{
              uri: item.image.startsWith("http")
                ? item.image
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.image}`,
            }}
            style={styles.postImage}
          />
        )}
        <View style={styles.postOverlay}>
          <View style={styles.postStats}>
            <Text style={[styles.statText, { color: colors.text }]}>
              ❤️ {item.likes?.length || 0}
            </Text>
            <Text style={[styles.statText, { color: colors.text }]}>
              💬 {item.comments?.length || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  useEffect(() => {
    if (!currentUserId) return;
    loadExploreFeed();
  }, [currentUserId]);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUserId(userObj?._id || userObj?.id || "");
    })();
  }, []);

  useEffect(() => {
    setDisplayedPosts(posts.slice(0, PAGE_SIZE));
    setPage(1);
  }, [posts]);

  const renderUserItem = ({ item }: { item: any }) => {
    if (!item || !item.username) return null;
    const userId = item._id || item.id;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <Image
          source={{
            uri: item.avatar || "https://ui-avatars.com/api/?name=User",
          }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <View style={styles.usernameContainer}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.username || "Kullanıcı"}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
            )}
          </View>
        </View>
        {userId !== currentUserId && (
          <FollowButton
            currentUserId={currentUserId}
            targetUserId={userId}
            username={item.username}
            style={styles.followButton}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Arama inputu üstte, sadece tıklanabilir */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, marginTop: 10 },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TouchableOpacity
          style={{ flex: 1, zIndex: 10 }}
          onPress={() => navigation.navigate("UserSearchScreen")}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Kullanıcı ara..."
            value={""}
            editable={false}
            placeholderTextColor={colors.textSecondary}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>
      {/* Reels listesi inputun altında */}
      <FlatList
        data={displayedPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="videocam-outline"
              size={64}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 4,
                },
              ]}
            >
              Şu anda keşfedecek yeni reels yok!
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: colors.textSecondary, fontSize: 14 },
              ]}
            >
              Yakında yeni içerikler burada olacak.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  row: {
    justifyContent: "space-between",
  },
  postItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginBottom: 2,
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#1DA1F2",
    borderColor: "#1DA1F2",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  usersList: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
  },
  followButton: {
    marginLeft: 10,
  },
  emptyStateText: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
  },
});

export default ExploreScreen;
