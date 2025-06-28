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
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import PostCard from "../components/PostCard";
import StoryItem from "../components/StoryItem";
import { mockPosts, mockStories } from "../data/mockData";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Kendi hikaye elemanı
  const renderMyStory = () => {
    const currentUser = require("../data/mockData").mockUsers[0];
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
              source={{ uri: currentUser.avatar }}
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
        <Text style={{ fontSize: 12, textAlign: "center", color: "#333" }}>
          Hikayen
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStory = ({ item }: { item: any }) => (
    <StoryItem
      story={item}
      onPress={() => navigation.navigate("Story", { story: item })}
    />
  );

  const renderPost = ({ item }: { item: any }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
      onLike={() => console.log("Like pressed")}
      onComment={() => navigation.navigate("Comment")}
      onShare={() => console.log("Share pressed")}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SocialApp</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="heart-outline" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("DMList")}
          >
            <Ionicons name="paper-plane-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={mockPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <FlatList
              data={mockStories}
              renderItem={renderStory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesList}
              ListHeaderComponent={renderMyStory()}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  storiesContainer: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  storiesList: {
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
