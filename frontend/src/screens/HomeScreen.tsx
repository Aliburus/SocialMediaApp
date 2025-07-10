import React, { useMemo } from "react";
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
import LoadingSpinner from "../components/LoadingSpinner";

const HomeScreen: React.FC<{
  unreadMessageCount?: number;
  unreadNotifCount?: number;
}> = (props) => {
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
  // const [isMuted, setIsMuted] = React.useState(false);
  const flatListRef = React.useRef<FlatList<any> | null>(null);
  const userInfoRef = React.useRef<any>(null);
  const [flatListKey, setFlatListKey] = React.useState(0);

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

  const [shareStory, setShareStory] = React.useState<any>(null);

  // Kullanıcı bilgisini bir kere al
  React.useEffect(() => {
    const getUserInfo = async () => {
      if (!userInfoRef.current) {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        userInfoRef.current = userObj;
        setUserId(userObj?._id || userObj?.id || null);
      }
    };
    getUserInfo();
  }, []);

  // userId yüklendiğinde veri yükle
  const loadAllData = async () => {
    if (!userId) return;
    try {
      const [postsData, storiesData, profileData] = await Promise.all([
        getAllPosts(userId),
        getStories(userId),
        getProfile(userId),
      ]);

      // Postları arşivlenmemiş olanlardan filtrele ve sırala
      const filteredPosts = postsData.filter((post: any) => !post.archived);
      const sortedPosts = filteredPosts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPosts(sortedPosts);

      // Stories işleme
      const updatedStories = storiesData.map((story: any) => ({
        ...story,
        isViewed: story.isViewed || false,
      }));
      setStories(updatedStories);

      // Profile işleme
      setMyAvatar(profileData.avatar || "");
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      // Yeni post paylaşıldıysa en üste git
      const route = navigation
        .getState()
        .routes.find((r: any) => r.name === "Home");
      if (route?.params?.scrollToTop && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 500);
      }

      // Story'ler yenilenecekse
      if (route?.params?.refreshStories && userId) {
        getStories(userId).then((newStories) => {
          const updatedStories = newStories.map((story: any) => ({
            ...story,
            isViewed: story.isViewed || false,
          }));
          setStories(updatedStories);
        });
      }
    }, [])
  );

  // Tab'a basıldığında refresh
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      setRefreshing(true);
      if (userId) {
        Promise.all([
          getAllPosts(userId),
          getStories(userId),
          getProfile(userId),
          getUserPosts(userId, userId),
        ]).finally(() => {
          setRefreshing(false);
        });
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // navigation focus olduğunda postları tekrar fetch et
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", (e: any) => {
      if (userId) {
        getAllPosts(userId);
        getProfile(userId);
        getUserPosts(userId, userId);

        // Story'ler yenilenecekse
        if (e.target?.includes("Story") || e.target?.includes("Home")) {
          getStories(userId).then((newStories) => {
            const updatedStories = newStories.map((story: any) => ({
              ...story,
              isViewed: story.isViewed || false,
            }));
            setStories(updatedStories);
          });
        }
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // Story ekleme veya Story ekranından çıkınca story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (userId) {
        getStories(userId);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // StoryScreen'den çıkıldığında story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (e.target.includes("Story") && userId) {
        // StoryScreen'den çıkıldığında story'leri yeniden fetch et
        setTimeout(() => {
          getStories(userId);
        }, 100);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // StoryScreen'den focus olduğunda story'leri güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // StoryScreen'den döndüğünde story'leri yenile
      if (userId) {
        getStories(userId);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // StoryScreen'den çıkıldığında story'lerin görünme durumunu güncelle
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (e.target.includes("Story") && userId) {
        // StoryScreen'den çıkıldığında story'leri yeniden fetch et
        setTimeout(() => {
          getStories(userId);
        }, 100);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  // Takip işlemi sonrası postları anında güncellemek için event listener ekle
  React.useEffect(() => {
    const subscription = navigation.addListener("focus", () => {
      if (userId) {
        loadAllData();
      }
    });

    // Custom event: Takip değiştiğinde postları güncelle
    const handleFollowChange = () => {
      if (userId) {
        loadAllData();
      }
    };
    // window objesine event ekle (React Native'de global event için)
    // @ts-ignore
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.__onFollowChange = handleFollowChange;
    }
    return () => {
      subscription();
      // @ts-ignore
      if (typeof window !== "undefined") {
        // @ts-ignore
        window.__onFollowChange = undefined;
      }
    };
  }, [navigation, userId]);

  // HomeScreen'e geri dönince FlatList'i ve postları yeniden render et
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Postları ve FlatList'i yeniden tetikle
      setDisplayedPosts([...posts]);
    });
    return unsubscribe;
  }, [navigation, posts]);

  const onRefresh = async () => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(async () => {
      if (userId) {
        await loadAllData();
      }
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

    const filteredPosts = posts.filter((post) => !post.archived);
    const newPosts = filteredPosts.slice(startIndex, endIndex);

    if (newPosts.length > 0) {
      setDisplayedPosts((prev) => [...prev, ...newPosts]);
      setCurrentPage(nextPage);
      setHasMorePosts(endIndex < filteredPosts.length);
    } else {
      setHasMorePosts(false);
    }

    setLoadingMore(false);
  };

  // Postları filtrele ve sırala
  React.useEffect(() => {
    const allPosts = posts.filter((post) => !post.archived);
    const sortedPosts = allPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setDisplayedPosts(sortedPosts.slice(0, POSTS_PER_PAGE));
    setCurrentPage(1);
    setHasMorePosts(sortedPosts.length > POSTS_PER_PAGE);
  }, [posts]);

  const filteredStories = React.useMemo(() => {
    if (!userId) return [];
    // Şimdilik tüm story'leri göster
    return stories;
  }, [stories, userId]);

  // Story'lerin izlenmişlik durumunu kontrol et
  const viewedUserIds = React.useMemo(() => {
    const ids = new Set();
    stories.forEach((story) => {
      if (story.isViewed) ids.add(story.user._id || story.user.id);
    });
    return ids;
  }, [stories]);

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
              uri: myAvatar?.startsWith("http")
                ? myAvatar
                : myAvatar
                ? `${require("../services/api").default.defaults.baseURL?.replace(
                    /\/api$/,
                    ""
                  )}${myAvatar}`
                : "https://ui-avatars.com/api/?name=User&background=007AFF&color=fff",
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
    stories.forEach((story) => {
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
  }, [stories, userId]);

  // StoryScreen açıksa story barı gösterme
  const isStoryOpen = navigation
    .getState()
    .routes.some((r: any) => r.name === "Story");

  const handleStoryPress = async (item: any) => {
    // O kullanıcının story'lerini göster
    const userStories = stories.filter(
      (s) => (s.user._id || s.user.id) === (item.user._id || item.user.id)
    );

    // Görülmemiş story'lerden başlaması için sırala
    const sortedStories = userStories.sort((a, b) => {
      // Görülmemiş story'ler önce gelsin
      if (!a.isViewed && b.isViewed) return -1;
      if (a.isViewed && !b.isViewed) return 1;
      // Aynı görülme durumundaysa tarihe göre sırala
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    setActiveUserId(item.user._id || item.user.id);
    navigation.navigate("Story", {
      stories: sortedStories,
      activeUserId: item.user._id || item.user.id,
    });
  };

  const handleStoryLongPress = (item: any) => {
    setShareStory(item);
    setShowShareModal(true);
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
              isViewed={item.isViewed}
              totalStories={item.totalStories}
              viewedStories={item.viewedStories}
              onPress={() => handleStoryPress(item)}
              onLongPress={() => handleStoryLongPress(item)}
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
    </View>
  );

  // FlatList'in ListHeaderComponent'ine story barı ekle
  const renderListHeader = () => <>{renderStoriesBar()}</>;

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    setDisplayedPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const handleArchivePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    setDisplayedPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const handleLikeUpdate = (
    postId: string,
    isLiked: boolean,
    likesCount: number
  ) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
          ? {
              ...post,
              likes: isLiked
                ? [...(Array.isArray(post.likes) ? post.likes : []), userId]
                : (Array.isArray(post.likes) ? post.likes : []).filter(
                    (id: string) => id !== userId
                  ),
            }
          : post
      )
    );
    setDisplayedPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
          ? {
              ...post,
              likes: isLiked
                ? [...(Array.isArray(post.likes) ? post.likes : []), userId]
                : (Array.isArray(post.likes) ? post.likes : []).filter(
                    (id: string) => id !== userId
                  ),
            }
          : post
      )
    );
  };

  const handleSaveUpdate = (postId: string, isSaved: boolean) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
          ? {
              ...post,
              savedBy: isSaved
                ? [...(Array.isArray(post.savedBy) ? post.savedBy : []), userId]
                : (Array.isArray(post.savedBy) ? post.savedBy : []).filter(
                    (id: string) => id !== userId
                  ),
            }
          : post
      )
    );
    setDisplayedPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
          ? {
              ...post,
              savedBy: isSaved
                ? [...(Array.isArray(post.savedBy) ? post.savedBy : []), userId]
                : (Array.isArray(post.savedBy) ? post.savedBy : []).filter(
                    (id: string) => id !== userId
                  ),
            }
          : post
      )
    );
  };

  const renderPost = ({ item }: { item: any }) => {
    return (
      <PostCard
        post={item}
        onPress={() => {
          if (item.video) {
            navigation.navigate("VideoDetail", {
              post: item,
              onLikeUpdate: handleLikeUpdate,
              onSaveUpdate: handleSaveUpdate,
            });
          } else {
            navigation.navigate("PostDetail", { post: item });
          }
        }}
        onComment={() =>
          navigation.navigate("Comment", { postId: item._id || item.id })
        }
        onShare={() => setShowShareModal(true)}
        onDelete={() => handleDeletePost(item._id || item.id)}
        onArchive={() => handleArchivePost(item._id || item.id)}
      />
    );
  };

  React.useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      setFlatListKey((k) => k + 1);
    });
    const unsubscribeBlur = navigation.addListener("blur", () => {
      setFlatListKey((k) => k + 1);
    });
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

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
          <LoadingSpinner />
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
            key={flatListKey}
            ref={flatListRef}
            data={displayedPosts}
            renderItem={renderPost}
            keyExtractor={(item) => {
              const id = item._id?.toString() || item.id?.toString();
              return id;
            }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={renderListHeader()}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <LoadingSpinner size="small" />
                </View>
              ) : null
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
            {...panResponder.panHandlers}
          />
        )}

        {/* Ses Kontrol İkonu */}
        {/* <TouchableOpacity
          style={styles.muteButton}
          onPress={handleToggleMute}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity> */}

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareStory(null);
          }}
          story={shareStory}
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
  muteButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 0,
    zIndex: 100,
  },
});

export default HomeScreen;
