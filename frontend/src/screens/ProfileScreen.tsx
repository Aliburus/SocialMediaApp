import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  RefreshControl,
  PanResponder,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserPosts, getProfile, getSavedPosts } from "../services/api";
import api from "../services/api";
import { getStories } from "../services/storyApi";
import PostCard from "../components/PostCard";
import StoryItem from "../components/StoryItem";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";

const { width } = Dimensions.get("window");
const imageSize = (width - 6) / 3;
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "grid" | "reels" | "saved" | "tagged"
  >("grid");
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const translateX = useRef(new Animated.Value(0)).current;

  const PAGE_SIZE = 15;
  const [displayedData, setDisplayedData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 10,
        onPanResponderMove: Animated.event([null, { dx: translateX }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50) {
            // Sağa kaydırma - önceki tab
            if (activeTab === "grid") setActiveTab("saved");
            else if (activeTab === "saved") setActiveTab("reels");
            else if (activeTab === "reels") setActiveTab("grid");
          } else if (gestureState.dx < -50) {
            // Sola kaydırma - sonraki tab
            if (activeTab === "grid") setActiveTab("reels");
            else if (activeTab === "reels") setActiveTab("saved");
            else if (activeTab === "saved") setActiveTab("grid");
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [activeTab]
  );

  const fetchUserData = async () => {
    setLoading(true);
    const userStr = await AsyncStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const userId = userObj?._id || userObj?.id;
    try {
      const profileData = await getProfile(userId);

      setProfile(profileData);
      setFollowersCount(profileData.followersCount || 0);
      setFollowingCount(profileData.followingCount || 0);
    } catch (err) {
      setProfile(null);
    }
    setLoading(false);
  };

  // fetchStories fonksiyonunu profile değiştikçe o profile ait storyleri çekecek şekilde güncelle
  const fetchStories = async (profileId?: string) => {
    if (!profileId) return setStories([]);
    try {
      const userStories = await getStories(profileId);
      setStories(userStories || []);
    } catch {
      setStories([]);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchStories();
  }, []);

  // profile değiştiğinde stories dizisini sıfırla ve sadece o profile ait storyleri getir
  useEffect(() => {
    setStories([]);
    if (profile?._id || profile?.id) {
      fetchStories(profile._id || profile.id);
    }
  }, [profile]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchUserPosts();
      fetchStories();
      const fetchSaved = async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        const userId = userObj?._id || userObj?.id;
        if (userId) {
          const posts = await getSavedPosts(userId);
          setSavedPosts(posts);
        }
      };
      if (activeTab === "saved") {
        fetchSaved();
      }
    }, [activeTab])
  );

  // Tab'a basıldığında refresh
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchUserPosts();
    }, [])
  );

  // Tab'a basıldığında refresh
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      setRefreshing(true);
      Promise.all([fetchUserData(), fetchUserPosts()]).finally(() => {
        setRefreshing(false);
      });
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserPosts = async () => {
    setLoading(true);
    const userStr = await AsyncStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const userId = userObj?._id || userObj?.id;
    const endpoint = `/posts/user/${userId}`;
    try {
      const posts = await getUserPosts(userId, userId); // currentUserId parametresi eklendi
      // En yeniden eskiye doğru sırala
      const sortedPosts = posts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserPosts(sortedPosts);
    } catch (err: any) {
      console.log(
        "[PROFILE] Profilde post çekme hatası:",
        err,
        err?.response?.data
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "saved") {
      const fetchSaved = async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        const userId = userObj?._id || userObj?.id;
        if (userId) {
          const posts = await getSavedPosts(userId);
          setSavedPosts(posts);
        }
      };
      fetchSaved();
    }
  }, [activeTab]);

  const handleDeletePost = (postId: string) => {
    setUserPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => {
        if (item.video) {
          navigation.navigate("VideoDetail", { post: item });
        } else {
          navigation.navigate("PostDetail", { post: item });
        }
      }}
    >
      {item.type === "reel" && item.video ? (
        <Image
          source={{
            uri: item.thumbnail
              ? item.thumbnail.startsWith("http")
                ? item.thumbnail
                : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                    item.thumbnail
                  }`
              : item.image && item.image.startsWith("http")
              ? item.image
              : item.image
              ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.image}`
              : `https://picsum.photos/seed/${item._id || item.id}/300/300`,
          }}
          style={[styles.postImage, { backgroundColor: colors.background }]}
        />
      ) : (
        <Image
          source={{
            uri:
              item.image && item.image.startsWith("http")
                ? item.image
                : item.image
                ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.image}`
                : `https://picsum.photos/seed/${item._id || item.id}/300/300`,
          }}
          style={[styles.postImage, { backgroundColor: colors.background }]}
        />
      )}
    </TouchableOpacity>
  );

  let tabData = userPosts.filter((p) => !p.archived);
  if (activeTab === "grid")
    tabData = userPosts.filter((p) => p.type === "post" && !p.archived);
  if (activeTab === "reels")
    tabData = userPosts.filter((p) => p.type === "reel" && !p.archived);
  if (activeTab === "saved") tabData = savedPosts.filter((p) => !p.archived);
  if (activeTab === "tagged")
    tabData = userPosts.filter((p) => p.type === "tagged");

  useEffect(() => {
    setPage(1);
    setDisplayedData(tabData.slice(0, PAGE_SIZE));
    setHasMore(tabData.length > PAGE_SIZE);
  }, [activeTab, userPosts, savedPosts]);

  const loadMore = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    const newData = tabData.slice(0, nextPage * PAGE_SIZE);
    setDisplayedData(newData);
    setPage(nextPage);
    setHasMore(tabData.length > nextPage * PAGE_SIZE);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `just now`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString("en-US");
  };

  // FlatList optimizasyonu için getItemLayout fonksiyonu ekle
  const ITEM_HEIGHT = 180; // Ortalama bir grid post yüksekliği

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <Animated.View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <FlatList
          data={displayedData}
          keyExtractor={(item) => item._id || item.id}
          numColumns={3}
          renderItem={renderPostItem}
          contentContainerStyle={{ padding: 2 }}
          scrollEnabled={true}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          initialNumToRender={9}
          maxToRenderPerBatch={12}
          windowSize={15}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity>
                  <Ionicons
                    name="person-add-outline"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <View style={styles.usernameContainer}>
                  <Text style={[styles.headerUsername, { color: colors.text }]}>
                    {profile?.username || ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Settings")}
                >
                  <Ionicons name="menu-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.profileHeader}>
                  {Array.isArray(stories) && stories.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        // Sadece o profile ait storyleri filtrele
                        const filteredStories = stories.filter(
                          (s: any) =>
                            (s.user?._id || s.user?.id) ===
                            (profile?._id || profile?.id)
                        );
                        if (filteredStories.length === 0) return;
                        const sortedStories = filteredStories.sort((a, b) => {
                          if (!a.isViewed && b.isViewed) return -1;
                          if (a.isViewed && !b.isViewed) return 1;
                          return (
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                          );
                        });
                        navigation.navigate("Story", {
                          userId: profile?._id || profile?.id,
                          stories: sortedStories,
                        });
                      }}
                      activeOpacity={0.8}
                      disabled={
                        stories.filter(
                          (s: any) =>
                            (s.user?._id || s.user?.id) ===
                            (profile?._id || profile?.id)
                        ).length === 0
                      }
                    >
                      {(stories || []).some((s: any) => !s.isViewed) ? (
                        <LinearGradient
                          colors={[
                            "#f09433",
                            "#e6683c",
                            "#dc2743",
                            "#cc2366",
                            "#bc1888",
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            source={{
                              uri: profile?.avatar?.startsWith("http")
                                ? profile.avatar
                                : profile?.avatar
                                ? `${api.defaults.baseURL?.replace(
                                    /\/api$/,
                                    ""
                                  )}${profile.avatar}`
                                : DEFAULT_AVATAR,
                            }}
                            style={{
                              width: 84,
                              height: 84,
                              borderRadius: 42,
                              backgroundColor: "#fff",
                            }}
                          />
                        </LinearGradient>
                      ) : (
                        <View
                          style={{
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            borderWidth: 3,
                            borderColor: "#bbb",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#fff",
                          }}
                        >
                          <Image
                            source={{
                              uri: profile?.avatar?.startsWith("http")
                                ? profile.avatar
                                : profile?.avatar
                                ? `${api.defaults.baseURL?.replace(
                                    /\/api$/,
                                    ""
                                  )}${profile.avatar}`
                                : DEFAULT_AVATAR,
                            }}
                            style={{
                              width: 84,
                              height: 84,
                              borderRadius: 42,
                              backgroundColor: "#fff",
                            }}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 45,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.background,
                      }}
                    >
                      <Image
                        source={{
                          uri: profile?.avatar?.startsWith("http")
                            ? profile.avatar
                            : profile?.avatar
                            ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                                profile.avatar
                              }`
                            : DEFAULT_AVATAR,
                        }}
                        style={{
                          width: 84,
                          height: 84,
                          borderRadius: 42,
                          backgroundColor: colors.background,
                        }}
                      />
                    </View>
                  )}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {Array.isArray(userPosts)
                          ? userPosts.filter((p) => !p.archived).length
                          : 0}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Posts
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.statItem}
                      onPress={() => navigation.navigate("Followers" as never)}
                    >
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {followersCount}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Followers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statItem}
                      onPress={() => navigation.navigate("Following" as never)}
                    >
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {followingCount}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Following
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bioContainer}>
                  <Text style={[styles.fullName, { color: colors.text }]}>
                    {profile?.name || ""}
                  </Text>
                  {profile?.bio && (
                    <Text style={[styles.bio, { color: colors.text }]}>
                      {profile.bio}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => navigation.navigate("EditProfile" as never)}
                >
                  <Text style={[styles.editButtonText, { color: colors.text }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View
                style={[
                  styles.tabsContainer,
                  { borderBottomColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "grid" && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setActiveTab("grid")}
                >
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={
                      activeTab === "grid"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "reels" && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setActiveTab("reels")}
                >
                  <Ionicons
                    name="play-outline"
                    size={24}
                    color={
                      activeTab === "reels"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "saved" && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setActiveTab("saved")}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={24}
                    color={
                      activeTab === "saved"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                {activeTab === "reels"
                  ? "No reels yet"
                  : activeTab === "saved"
                  ? "No saved posts yet"
                  : "No posts yet"}
              </Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 4,
  },
  profileInfo: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  postsContainer: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 0,
    backgroundColor: "#eee",
  },
  postImage: {
    width: imageSize,
    height: imageSize,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  privateAccountTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  privateAccountText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default ProfileScreen;
