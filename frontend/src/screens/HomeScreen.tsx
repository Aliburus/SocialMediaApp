import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
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
      const data = await getStories();
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

  // Kendi hikaye elemanı
  const renderMyStory = () => {
    return (
      <TouchableOpacity
        style={{ alignItems: "center", marginRight: 16, width: 70 }}
        onPress={() => navigation.navigate("AddStory")}
      >
        <View style={{ marginBottom: 4 }}>
          <View
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={{
                uri: myAvatar || "https://ui-avatars.com/api/?name=User",
              }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#0095f6",
                borderWidth: 2,
                borderColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 12, textAlign: "center", color: colors.text }}>
          Hikayen
        </Text>
      </TouchableOpacity>
    );
  };

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

  // Story barı için padding ve margin azaltıldı
  const storyBarStyle = {
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: 0,
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
  };

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        style={isDark ? "light" : "dark"}
      />
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}
          >
            SocialApp
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons name="heart-outline" size={28} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={() => navigation.navigate("DMList")}
            >
              <Ionicons
                name="paper-plane-outline"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 16 }}>
              <ThemeToggle size={28} />
            </View>
          </View>
        </View>
      </SafeAreaView>
      {!isStoryOpen && (
        <FlatList
          data={groupedStories}
          renderItem={({ item }) => (
            <StoryItem
              story={item}
              isActive={activeUserId === (item.user._id || item.user.id)}
              onPress={() => handleStoryPress(item)}
            />
          )}
          keyExtractor={(item) => item.user._id || item.user.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.storiesList, storyBarStyle]}
          ListHeaderComponent={renderMyStory()}
        />
      )}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id || item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
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
  storiesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  storiesList: {
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
