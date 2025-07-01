import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import PostCard from "../components/PostCard";
import StoryItem from "../components/StoryItem";
import { mockPosts, mockStories } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { StatusBar } from "expo-status-bar";
import { getAllPosts, getStories, getProfile } from "../services/api";
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

  const fetchPosts = async () => {
    try {
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      console.log("[POSTLAR] Hata:", err);
    }
  };

  const fetchStories = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      const data = await getStories(userId);
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

  React.useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchMyAvatar();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

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

  // Story'leri kullanıcıya göre grupla
  const groupedStories = React.useMemo(() => {
    const map = new Map();
    stories.forEach((story) => {
      const userId = story.user._id || story.user.id;
      if (!map.has(userId)) map.set(userId, []);
      map.get(userId).push(story);
    });
    return Array.from(map.values()).map((userStories) => userStories[0]);
  }, [stories]);

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
        renderItem={({ item }) => (
          <StoryItem
            story={item}
            isActive={activeUserId === (item.user._id || item.user.id)}
            isViewed={viewedUserIds.has(item.user._id || item.user.id)}
            onPress={() => handleStoryPress(item)}
          />
        )}
        keyExtractor={(item) => item.user._id || item.user.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={renderMyStory()}
        contentContainerStyle={styles.storiesContent}
        style={styles.storiesList}
      />
    </View>
  );

  const renderPost = ({ item }: { item: any }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
      onLike={() => console.log("Like pressed")}
      onComment={() =>
        navigation.navigate("Comment", { postId: item._id || item.id })
      }
      onShare={() => setShowShareModal(true)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        style={isDark ? "light" : "dark"}
      />

      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.background }}
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

            <View style={styles.themeToggleContainer}>
              <ThemeToggle size={26} />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Posts List with Stories Header */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id || item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={!isStoryOpen ? renderStoriesBar : undefined}
        style={styles.postsList}
        contentContainerStyle={styles.postsContent}
        pagingEnabled
        snapToInterval={Dimensions.get("window").height}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: Dimensions.get("window").height,
          offset: Dimensions.get("window").height * index,
          index,
        })}
      />

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </View>
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
    paddingVertical: 14,
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
  themeToggleContainer: {
    marginLeft: 4,
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
