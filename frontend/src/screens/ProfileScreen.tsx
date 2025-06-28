import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { mockUsers, mockPosts } from "../data/mockData";

const { width } = Dimensions.get("window");
const imageSize = (width - 6) / 3;

const mockReels = mockPosts.slice(0, 6); // örnek için aynı postlar
const mockSaved = mockPosts.slice(3, 9); // örnek için farklı postlar
const mockTagged = mockPosts.slice(6, 12); // örnek için farklı postlar

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const currentUser = mockUsers[0]; // Simulate current user
  const userPosts = mockPosts.filter((post) => post.user.id === currentUser.id);
  const [activeTab, setActiveTab] = useState<
    "grid" | "reels" | "saved" | "tagged"
  >("grid");
  const insets = useSafeAreaInsets();

  const renderPostItem = ({ item }: { item: any }) => {
    if (activeTab === "reels") {
      return (
        <TouchableOpacity
          style={styles.postItem}
          onPress={() => navigation.navigate("ReelDetail", { reel: item })}
        >
          <Image source={{ uri: item.image }} style={styles.postImage} />
        </TouchableOpacity>
      );
    }
    if (activeTab === "saved") {
      return (
        <TouchableOpacity
          style={styles.postItem}
          onPress={() => navigation.navigate("SavedDetail", { post: item })}
        >
          <Image source={{ uri: item.image }} style={styles.postImage} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.postItem}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </TouchableOpacity>
    );
  };

  let tabData = userPosts;
  if (activeTab === "reels") tabData = mockReels;
  if (activeTab === "saved") tabData = mockSaved;
  if (activeTab === "tagged") tabData = mockTagged;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white" }}
      edges={["top", "bottom"]}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="person-add-outline" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.usernameContainer}>
            <Text style={styles.headerUsername}>{currentUser.username}</Text>
            {currentUser.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" />
            )}
          </View>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.profileImage}
            />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigation.navigate("Followers" as never)}
              >
                <Text style={styles.statNumber}>
                  {currentUser.followersCount.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigation.navigate("Following" as never)}
              >
                <Text style={styles.statNumber}>
                  {currentUser.followingCount.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioContainer}>
            <Text style={styles.fullName}>{currentUser.fullName}</Text>
            {currentUser.bio && (
              <Text style={styles.bio}>{currentUser.bio}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile" as never)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Story Highlights */}
        <View style={styles.highlightsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.addHighlight}
              onPress={() => navigation.navigate("AddStory")}
            >
              <View style={styles.addHighlightCircle}>
                <Ionicons name="add" size={24} color="#666" />
              </View>
              <Text style={styles.highlightText}>New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "grid" && styles.activeTab]}
            onPress={() => setActiveTab("grid")}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={activeTab === "grid" ? "#E91E63" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reels" && styles.activeTab]}
            onPress={() => setActiveTab("reels")}
          >
            <Ionicons
              name="play-outline"
              size={24}
              color={activeTab === "reels" ? "#E91E63" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "saved" && styles.activeTab]}
            onPress={() => setActiveTab("saved")}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeTab === "saved" ? "#E91E63" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "tagged" && styles.activeTab]}
            onPress={() => setActiveTab("tagged")}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={activeTab === "tagged" ? "#E91E63" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.postsContainer}>
          <FlatList
            data={tabData}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.postsList}
          />
        </View>
      </ScrollView>
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
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: "#333",
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
    color: "#333",
  },
  highlightsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
    color: "#666",
  },
  postsContainer: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#E91E63",
  },
  postsList: {
    padding: 1,
  },
  postItem: {
    margin: 1,
  },
  postImage: {
    width: imageSize,
    height: imageSize,
  },
});

export default ProfileScreen;
