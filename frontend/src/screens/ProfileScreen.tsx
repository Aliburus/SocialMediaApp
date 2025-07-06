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
import { mockUsers, mockPosts } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserPosts, getProfile, getSavedPosts } from "../services/api";
import PostCard from "../components/PostCard";

const { width } = Dimensions.get("window");
const imageSize = (width - 6) / 3;

const mockReels = mockPosts.slice(0, 6); // örnek için aynı postlar
const mockSaved = mockPosts.slice(3, 9); // örnek için farklı postlar
const mockTagged = mockPosts.slice(6, 12); // örnek için farklı postlar

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

  const translateX = useRef(new Animated.Value(0)).current;

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
            if (activeTab === "reels") setActiveTab("grid");
            else if (activeTab === "saved") setActiveTab("reels");
            else if (activeTab === "tagged") setActiveTab("saved");
          } else if (gestureState.dx < -50) {
            // Sola kaydırma - sonraki tab
            if (activeTab === "grid") setActiveTab("reels");
            else if (activeTab === "reels") setActiveTab("saved");
            else if (activeTab === "saved") setActiveTab("tagged");
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

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchUserPosts();
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
      console.log("Profile tab pressed - refreshing...");
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
      onPress={() => navigation.navigate("PostDetail", { post: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={[styles.postImage, { backgroundColor: colors.background }]}
      />
    </TouchableOpacity>
  );

  let tabData = userPosts.filter((p) => !p.archived);
  if (activeTab === "reels") tabData = mockReels.filter((p) => !p.archived);
  if (activeTab === "saved") tabData = savedPosts.filter((p) => !p.archived);
  if (activeTab === "tagged") tabData = mockTagged.filter((p) => !p.archived);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const userReels = userPosts.filter((p) => p.type === "reel" || p.isReel);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <Animated.View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <FlatList
          data={activeTab === "reels" ? userReels : tabData}
          keyExtractor={(item) => item._id || item.id}
          numColumns={3}
          renderItem={renderPostItem}
          contentContainerStyle={{ padding: 2 }}
          scrollEnabled={true}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
                  <Image
                    source={{ uri: profile?.avatar || "" }}
                    style={[
                      styles.profileImage,
                      { backgroundColor: colors.background },
                    ]}
                  />
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {userPosts.filter((p) => !p.archived).length}
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

              {/* Story Highlights */}
              <View
                style={[
                  styles.highlightsContainer,
                  { borderBottomColor: colors.border },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={styles.addHighlight}
                    onPress={() => navigation.navigate("AddStory")}
                  >
                    <View
                      style={[
                        styles.addHighlightCircle,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="add"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.highlightText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      New
                    </Text>
                  </TouchableOpacity>
                  {stories &&
                    stories.length > 0 &&
                    stories.map((story: any) => (
                      <TouchableOpacity
                        key={story._id || story.id}
                        style={styles.addHighlight}
                      >
                        <Image
                          source={{ uri: story.image }}
                          style={styles.profileImage}
                        />
                        <Text
                          style={[
                            styles.highlightText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {story.user?.username || "Story"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
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
                  ? "Henüz reels yok"
                  : activeTab === "saved"
                  ? "Henüz kayıtlı gönderi yok"
                  : "Henüz gönderi yok"}
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
  highlightsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addHighlight: {
    alignItems: "center",
    marginRight: 16,
  },
  addHighlightCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
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
});

export default ProfileScreen;
