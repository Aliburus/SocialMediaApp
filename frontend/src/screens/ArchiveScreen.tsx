import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { getUserPosts, getStories, archivePost } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const ArchiveScreen: React.FC = () => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<"posts" | "stories" | "reels">("posts");
  const [archivedPosts, setArchivedPosts] = useState<any[]>([]);
  const [archivedStories, setArchivedStories] = useState<any[]>([]);
  const [archivedReels, setArchivedReels] = useState<any[]>([]);
  const { width } = Dimensions.get("window");
  const imageSize = (width - 6) / 3;

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        const userId = userObj?._id || userObj?.id;
        // Postlar
        const posts = await getUserPosts(userId);
        setArchivedPosts(
          posts.filter((p: any) => p.archived && (!p.type || p.type === "post"))
        );
        setArchivedReels(
          posts.filter(
            (p: any) => p.archived && (p.type === "reel" || p.isReel)
          )
        );
        // Storyler
        const stories = await getStories(userId);
        setArchivedStories(stories.filter((s: any) => s.archived));
      })();
    }, [])
  );

  let data: any[] = [];
  if (tab === "posts") data = archivedPosts;
  if (tab === "stories") data = archivedStories;
  if (tab === "reels") data = archivedReels;

  const navigation = useNavigation() as any;

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
      <FlatList
        data={data}
        keyExtractor={(item) => item.id || item._id}
        numColumns={3}
        contentContainerStyle={{ padding: 2 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 / 3, aspectRatio: 1, padding: 2 }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("PostDetail", {
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
            <TouchableOpacity
              style={{
                marginTop: 4,
                backgroundColor: colors.primary,
                borderRadius: 6,
                paddingVertical: 4,
                alignItems: "center",
              }}
              onPress={async () => {
                await archivePost(item._id || item.id, false);
                if (tab === "posts") {
                  setArchivedPosts((prev) =>
                    prev.filter(
                      (p) => (p._id || p.id) !== (item._id || item.id)
                    )
                  );
                } else if (tab === "stories") {
                  setArchivedStories((prev) =>
                    prev.filter(
                      (s) => (s._id || s.id) !== (item._id || item.id)
                    )
                  );
                } else if (tab === "reels") {
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
