import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  InteractionManager,
  PanResponder,
} from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import PostCard from "../components/PostCard";
import StoryItem from "../components/StoryItem";
import { useTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import {
  getAllPosts,
  getStories,
  getProfile,
  getUserPosts,
} from "../services/api";
import { ShareModal } from "../components/ShareModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [stories, setStories] = React.useState<any[]>([]);
  const [myAvatar, setMyAvatar] = React.useState<string>("");
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
  const [followingIds, setFollowingIds] = React.useState<string[]>([]);
  const [myPosts, setMyPosts] = React.useState<any[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const flatListRef = React.useRef<FlatList<any> | null>(null);

  // PanResponder ile sağdan sola swipe hareketini algıla
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Sadece yatay kaydırma için
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Sola doğru kaydırma (dx negatif ve belirli bir mesafeden fazla)
        if (gestureState.dx < -50) {
          navigation.navigate("DMList", { animation: "slide_from_right" });
        }
      },
    })
  ).current;

  const fetchPosts = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      const data = await getAllPosts(userId);
      setPosts(data);
    } catch (err) {
      console.log("[POSTLAR] Hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      const data = await getStories(userId);
      console.log("[STORY API] Gelen storyler:", data);
      setStories(data);
    } catch (err) {
      console.log("[STORY] Hata:", err);
    }
  };

  const fetchMyAvatar = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (userId) {
        const profile = await getProfile(userId);
        setMyAvatar(profile.avatar || "");
      }
    } catch {}
  };

  const fetchMyFollowing = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (userId) {
        const profile = await getProfile(userId);
        setFollowingIds(
          (profile.following || []).map((id: any) => id.toString())
        );
      }
    } catch {}
  };

  const fetchMyPosts = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (userId) {
        const data = await getUserPosts(userId);
        setMyPosts(data);
      }
    } catch (err) {
      console.log("[KENDİ POSTLARIM] Hata:", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
      fetchStories();
      fetchMyAvatar();
      fetchMyFollowing();
      (async () => {
        await fetchMyPosts();
      })();
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        setUserId(userObj?._id || userObj?.id || null);
      })();
    }, [])
  );

  // navigation focus olduğunda postları tekrar fetch et
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPosts();
      fetchMyPosts();
    });
    return unsubscribe;
  }, [navigation]);

  // Story ekleme veya Story ekranından çıkınca story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchStories();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(async () => {
      await fetchPosts();
      setActiveUserId(null);
      setRefreshing(false);
    });
  };

  // Post ve story'leri sadece takip edilenlerden filtrele
  const filteredPosts = React.useMemo(() => {
    const safeMyPosts = myPosts || [];
    const followingPosts = posts
      .filter((post) => followingIds.includes(post.user._id || post.user.id))
      .filter((post) => !post.archived);
    // Kendi postlarını ekle, tekrar olmasın
    const myUniquePosts = safeMyPosts.filter(
      (post) =>
        !followingPosts.some(
          (fp) => (fp._id || fp.id) === (post._id || post.id)
        ) && !post.archived
    );
    if (followingPosts.length === 0 && safeMyPosts.length > 0) {
      return safeMyPosts.filter((p) => !p.archived);
    }
    if (followingPosts.length > 0 && safeMyPosts.length > 0) {
      return [...followingPosts, ...myUniquePosts];
    }
    return followingPosts;
  }, [posts, followingIds, myPosts]);

  const filteredStories = React.useMemo(() => {
    if (!userId) return [];
    return stories.filter(
      (story) =>
        followingIds.includes(story.user._id || story.user.id) ||
        (story.user._id || story.user.id) === userId
    );
  }, [stories, followingIds, userId]);

  // Story'lerin izlenmişlik durumunu kontrol et
  const viewedUserIds = React.useMemo(() => {
    const ids = new Set();
    filteredStories.forEach((story) => {
      if (story.isViewed) ids.add(story.user._id || story.user.id);
    });
    return ids;
  }, [filteredStories]);

  // Kendi hikaye elemanı (her zaman + ikonlu ve tıklanabilir)
  const renderMyStory = () => (
    <TouchableOpacity
      style={styles.myStoryContainer}
      onPress={() => navigation.navigate("AddStory")}
      activeOpacity={0.8}
    >
      <View style={styles.myStoryImageContainer}>
        <View
          style={[
            styles.storyImageWrapper,
            { backgroundColor: colors.surface },
          ]}
        >
          <Image
            source={{
              uri:
                myAvatar ||
                "https://ui-avatars.com/api/?name=User&background=007AFF&color=fff",
            }}
            style={styles.myStoryImage}
          />
          <View style={styles.addStoryIcon}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </View>
      </View>
      <Text
        style={[styles.storyUsername, { color: colors.text }]}
        numberOfLines={1}
      >
        Hikayen
      </Text>
    </TouchableOpacity>
  );

  // Story'leri kullanıcıya göre grupla (sadece takip edilenler)
  const groupedStories = React.useMemo(() => {
    const map = new Map();
    filteredStories.forEach((story) => {
      const userId = story.user._id || story.user.id;
      if (!map.has(userId)) map.set(userId, []);
      map.get(userId).push(story);
    });
    return Array.from(map.values()).map((userStories) => userStories[0]);
  }, [filteredStories]);

  // StoryScreen açıksa story barı gösterme
  const isStoryOpen = navigation
    .getState()
    .routes.some((r: any) => r.name === "Story");

  const handleStoryPress = (item: any) => {
    const userStories = stories.filter(
      (s) => (s.user._id || s.user.id) === (item.user._id || item.user.id)
    );
    setActiveUserId(item.user._id || item.user.id);
    navigation.navigate("Story", {
      stories: userStories,
      activeUserId: item.user._id || item.user.id,
    });
  };

  // Story barını ListHeaderComponent olarak ekle
  const renderStoriesBar = () => (
    <View
      style={[
        styles.storiesSection,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <FlatList
        data={groupedStories}
        renderItem={({ item }) =>
          item.user ? (
            <StoryItem
              story={item}
              isActive={activeUserId === (item.user._id || item.user.id)}
              isViewed={viewedUserIds.has(item.user._id || item.user.id)}
              onPress={() => handleStoryPress(item)}
            />
          ) : null
        }
        keyExtractor={(item) => item._id || item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={renderMyStory()}
        contentContainerStyle={styles.storiesContent}
        style={styles.storiesList}
      />
      {/* {groupedStories.length === 0 && (
        <Text style={{ color: colors.textSecondary, padding: 16, textAlign: "center" }}>
          Henüz hiç hikaye yok.
        </Text>
      )} */}
    </View>
  );

  // Header'ı ayrı bir fonksiyon olarak tanımla
  const renderTopBar = () => (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: 6, // Status bar'a daha yakınlaştır
      }}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>
            SocialApp
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("DMList")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="paper-plane-outline"
              size={26}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // FlatList'in ListHeaderComponent'ine header ve story barı birlikte ekle
  const renderListHeader = () => (
    <>
      {renderTopBar()}
      {renderStoriesBar()}
    </>
  );

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const renderPost = ({ item }: { item: any }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
      onLike={() => console.log("Like pressed")}
      onComment={() =>
        navigation.navigate("Comment", { postId: item._id || item.id })
      }
      onShare={() => setShowShareModal(true)}
      onDelete={() => handleDeletePost(item._id || item.id)}
    />
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        {...panResponder.panHandlers}
      >
        {/* Posts List with Stories Header */}
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Yükleniyor...
            </Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <>
            {renderListHeader()}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 32,
                backgroundColor: colors.background,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                Gösterilecek gönderi yok
              </Text>
            </View>
          </>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListHeaderComponent={!isStoryOpen ? renderListHeader : undefined}
            style={styles.postsList}
            contentContainerStyle={styles.postsContent}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={10}
            removeClippedSubviews={false}
          />
        )}

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 6, // Daha az boşluk
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 2,
  },

  // Stories Section Styles - Optimized spacing
  storiesSection: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  storiesList: {
    flexGrow: 0,
  },
  storiesContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },

  // My Story Styles - Reduced sizes
  myStoryContainer: {
    alignItems: "center",
    marginRight: 8,
    width: 64,
  },
  myStoryImageContainer: {
    marginBottom: 4,
  },
  storyImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  myStoryImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  addStoryIcon: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  storyUsername: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 64,
  },

  // Posts List - No extra spacing
  postsList: {
    flex: 1,
  },
  postsContent: {
    flexGrow: 1,
  },
});

export default HomeScreen;
