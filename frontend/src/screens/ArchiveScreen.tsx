import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  getUserPosts,
  archivePost,
  getArchivedStories,
  unarchiveStory,
  getAllPosts,
} from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const tabList = ["posts", "stories", "reels"];

const ArchiveScreen: React.FC = () => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<"posts" | "stories" | "reels">("posts");
  const [archivedPosts, setArchivedPosts] = useState<any[]>([]);
  const [archivedStories, setArchivedStories] = useState<any[]>([]);
  const [archivedReels, setArchivedReels] = useState<any[]>([]);
  const { width } = Dimensions.get("window");
  const imageSize = (width - 6) / 3;

  const scrollViewRef = useRef<ScrollView>(null);
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
          const currentIndex = tabList.indexOf(tab);
          if (gestureState.dx > 50 && currentIndex > 0) {
            setTab(tabList[currentIndex - 1] as any);
          } else if (
            gestureState.dx < -50 &&
            currentIndex < tabList.length - 1
          ) {
            setTab(tabList[currentIndex + 1] as any);
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [tab]
  );

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        const userId = userObj?._id || userObj?.id;
        if (!userId) return;

        // Postlar
        const allPosts = await getAllPosts();
        const archivedPostsData = allPosts.filter(
          (p: any) => p.archived && !p.isReel
        );
        setArchivedPosts(
          archivedPostsData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

        // Reels
        const archivedReelsData = allPosts.filter(
          (p: any) => p.archived && (p.type === "reel" || p.isReel)
        );
        setArchivedReels(
          archivedReelsData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

        // Storyler
        const archivedStoriesData = await getArchivedStories(userId);
        setArchivedStories(
          archivedStoriesData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      })();
    }, [])
  );

  let data: any[] = [];
  if (tab === "posts") data = archivedPosts;
  if (tab === "stories") data = archivedStories;
  if (tab === "reels") data = archivedReels;

  const navigation = useNavigation() as any;

  // Story'nin 24 saat geçip geçmediğini kontrol et
  const isStoryWithin24Hours = (story: any) => {
    if (!story.createdAt) {
      console.log("Story createdAt yok:", story);
      return false;
    }
    const storyDate = new Date(story.createdAt);
    const now = new Date();
    const diffInHours =
      (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    console.log(
      "Story:",
      story.username || "Unknown",
      "Tarih:",
      storyDate,
      "Saat farkı:",
      diffInHours,
      "24 saat içinde:",
      diffInHours < 24
    );
    return diffInHours < 24;
  };

  React.useEffect(() => {
    translateX.setValue(0);
    // PanResponder gesture değerlerini sıfırla
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [tab]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "bold",
            flex: 1,
          }}
        >
          Arşiv
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => setTab("posts")}
          style={[
            styles.tab,
            tab === "posts" && {
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            },
          ]}
        >
          <Text
            style={{ color: tab === "posts" ? colors.primary : colors.text }}
          >
            Postlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("stories")}
          style={[
            styles.tab,
            tab === "stories" && {
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            },
          ]}
        >
          <Text
            style={{ color: tab === "stories" ? colors.primary : colors.text }}
          >
            Hikayeler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("reels")}
          style={[
            styles.tab,
            tab === "reels" && {
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            },
          ]}
        >
          <Text
            style={{ color: tab === "reels" ? colors.primary : colors.text }}
          >
            Reels
          </Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id || item._id}
          numColumns={3}
          contentContainerStyle={{ padding: 2 }}
          scrollEnabled={true}
          renderItem={({ item }) => (
            <View style={{ flex: 1 / 3, aspectRatio: 1, padding: 2 }}>
              <TouchableOpacity
                onPress={() =>
                  tab === "stories"
                    ? navigation.navigate("Story", {
                        stories: [item],
                        fromArchive: true,
                      })
                    : navigation.navigate("PostDetail", {
                        post: item,
                        fromArchive: true,
                      })
                }
              >
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    borderRadius: 8,
                    backgroundColor: colors.background,
                  }}
                />
              </TouchableOpacity>
              {tab !== "stories" && (
                <TouchableOpacity
                  style={{
                    marginTop: 4,
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    paddingVertical: 4,
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    if (tab === "posts") {
                      await archivePost(item._id || item.id, false);
                      setArchivedPosts((prev) =>
                        prev.filter(
                          (p) => (p._id || p.id) !== (item._id || item.id)
                        )
                      );
                    } else if (tab === "reels") {
                      await archivePost(item._id || item.id, false);
                      setArchivedReels((prev) =>
                        prev.filter(
                          (r) => (r._id || r.id) !== (item._id || item.id)
                        )
                      );
                    }
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 13 }}>
                    Arşivden Çıkar
                  </Text>
                </TouchableOpacity>
              )}
              {tab === "stories" && isStoryWithin24Hours(item) && (
                <TouchableOpacity
                  style={{
                    marginTop: 4,
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    paddingVertical: 4,
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    const userStr = await AsyncStorage.getItem("user");
                    const userObj = userStr ? JSON.parse(userStr) : null;
                    const userId = userObj?._id || userObj?.id;
                    await unarchiveStory(item._id || item.id, userId);
                    setArchivedStories((prev) =>
                      prev.filter(
                        (s) => (s._id || s.id) !== (item._id || item.id)
                      )
                    );
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 13 }}>
                    Arşivden Çıkar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 32,
              }}
            >
              Arşiv boş
            </Text>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
});

export default ArchiveScreen;
