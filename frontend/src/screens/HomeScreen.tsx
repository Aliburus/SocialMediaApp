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
  viewStory,
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

  // Pagination için state'ler
  const [displayedPosts, setDisplayedPosts] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMorePosts, setHasMorePosts] = React.useState(true);
  const POSTS_PER_PAGE = 15;

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
      // En yeniden eskiye doğru sırala
      const sortedData = data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPosts(sortedData);

      // İlk 15 postu göster
      setDisplayedPosts(sortedData.slice(0, POSTS_PER_PAGE));
      setCurrentPage(1);
      setHasMorePosts(sortedData.length > POSTS_PER_PAGE);
    } catch (err) {
      // Hata yönetimi
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

      // Story'lerin görüldü durumunu kontrol et
      const updatedStories = data.map((story: any) => ({
        ...story,
        isViewed: story.isViewed || false,
      }));

      setStories(updatedStories);
    } catch (err) {
      // Hata yönetimi
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
        const data = await getUserPosts(userId, userId); // currentUserId parametresi eklendi
        setMyPosts(data);
      }
    } catch (err) {
      // Hata yönetimi
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

      // Yeni post paylaşıldıysa en üste git
      const route = navigation
        .getState()
        .routes.find((r: any) => r.name === "Home");
      if (route?.params?.scrollToTop && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 500);
      }
    }, [])
  );

  // Tab'a basıldığında refresh
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      console.log("Home tab pressed - refreshing...");
      setRefreshing(true);
      Promise.all([
        fetchPosts(),
        fetchStories(),
        fetchMyAvatar(),
        fetchMyFollowing(),
        fetchMyPosts(),
      ]).finally(() => {
        setRefreshing(false);
      });
    });
    return unsubscribe;
  }, [navigation]);

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

  // StoryScreen'den çıkıldığında story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (e.target.includes("Story")) {
        // StoryScreen'den çıkıldığında story'leri yeniden fetch et
        setTimeout(() => {
          fetchStories();
        }, 100);
      }
    });
    return unsubscribe;
  }, [navigation]);

  // StoryScreen'den focus olduğunda story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // StoryScreen'den döndüğünde story'leri yenile
      fetchStories();
    });
    return unsubscribe;
  }, [navigation]);

  // StoryScreen'den çıkıldığında story'lerin görünme durumunu güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (e.target.includes("Story")) {
        // StoryScreen'den çıkıldığında story'leri yeniden fetch et
        setTimeout(() => {
          fetchStories();
        }, 100);
      }
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

  // Daha fazla post yükle
  const loadMorePosts = async () => {
    if (loadingMore || !hasMorePosts) return;

    setLoadingMore(true);

    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;

    const newPosts = posts.slice(startIndex, endIndex);

    if (newPosts.length > 0) {
      setDisplayedPosts((prev) => [...prev, ...newPosts]);
      setCurrentPage(nextPage);
      setHasMorePosts(endIndex < posts.length);
    } else {
      setHasMorePosts(false);
    }

    setLoadingMore(false);
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
    let allPosts = [];
    if (followingPosts.length === 0 && safeMyPosts.length > 0) {
      allPosts = safeMyPosts.filter((p) => !p.archived);
    } else if (followingPosts.length > 0 && safeMyPosts.length > 0) {
      allPosts = [...followingPosts, ...myUniquePosts];
    } else {
      allPosts = followingPosts;
    }

    // Postları tarihe göre sırala (en yeni en üstte)
    const sortedPosts = allPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Filtrelenmiş postları güncelle ve ilk 15'ini göster
    if (sortedPosts.length !== posts.length) {
      setDisplayedPosts(sortedPosts.slice(0, POSTS_PER_PAGE));
      setCurrentPage(1);
      setHasMorePosts(sortedPosts.length > POSTS_PER_PAGE);
    }

    return sortedPosts;
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

  // Story'leri kullanıcıya göre grupla (kendi story'nim her zaman ilk başta)
  const groupedStories = React.useMemo(() => {
    const map = new Map();
    filteredStories.forEach((story) => {
      const userId = story.user._id || story.user.id;
      if (!map.has(userId)) map.set(userId, []);
      map.get(userId).push(story);
    });

    const allStories = Array.from(map.values()).map((userStories) => {
      // Tüm story'ler görüldüyse isViewed true olsun
      const allViewed = userStories.every((s: any) => s.isViewed);
      return {
        ...userStories[0],
        isViewed: allViewed,
        totalStories: userStories.length,
        viewedStories: userStories.filter((s: any) => s.isViewed).length,
      };
    });

    // Kendi story'ni her zaman ilk başta göster
    const myStories = allStories.filter(
      (story) => (story.user._id || story.user.id) === userId
    );
    const otherStories = allStories.filter(
      (story) => (story.user._id || story.user.id) !== userId
    );

    return [...myStories, ...otherStories];
  }, [filteredStories, userId]);

  // StoryScreen açıksa story barı gösterme
  const isStoryOpen = navigation
    .getState()
    .routes.some((r: any) => r.name === "Story");

  const handleStoryPress = async (item: any) => {
    // Tüm görülmemiş story'leri topla
    const allUnviewedStories = stories.filter((s) => !s.isViewed);

    // Eğer görülmemiş story varsa, onları göster
    if (allUnviewedStories.length > 0) {
      setActiveUserId(item.user._id || item.user.id);
      navigation.navigate("Story", {
        stories: allUnviewedStories,
        activeUserId: item.user._id || item.user.id,
      });
    } else {
      // Görülmemiş story yoksa sadece o kullanıcının story'lerini göster
      const userStories = stories.filter(
        (s) => (s.user._id || s.user.id) === (item.user._id || item.user.id)
      );
      setActiveUserId(item.user._id || item.user.id);
      navigation.navigate("Story", {
        stories: userStories,
        activeUserId: item.user._id || item.user.id,
      });
    }
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
      {groupedStories.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {renderMyStory()}
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Henüz hiç hikaye yok.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedStories}
          renderItem={({ item }) =>
            item.user ? (
              <StoryItem
                story={item}
                isActive={activeUserId === (item.user._id || item.user.id)}
                isViewed={item.isViewed}
                totalStories={item.totalStories}
                viewedStories={item.viewedStories}
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
      )}
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

  const handleArchivePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const renderPost = ({ item }: { item: any }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
      onComment={() =>
        navigation.navigate("Comment", { postId: item._id || item.id })
      }
      onShare={() => setShowShareModal(true)}
      onDelete={() => handleDeletePost(item._id || item.id)}
      onArchive={() => handleArchivePost(item._id || item.id)}
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
        ) : displayedPosts.length === 0 ? (
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
            data={displayedPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={!isStoryOpen ? renderListHeader : undefined}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <Text
                    style={[
                      styles.loadingText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Daha fazla yükleniyor...
                  </Text>
                </View>
              ) : null
            }
            style={styles.postsList}
            contentContainerStyle={[
              styles.postsContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
});

export default HomeScreen;
