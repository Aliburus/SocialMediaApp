import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import {
  searchUsers as searchUsersApi,
  sendFollowRequest,
  cancelFollowRequest,
} from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import FollowButton from "../components/FollowButton";

const { width } = Dimensions.get("window");
const imageSize = (width - 6) / 3;

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const searchInputRef = useRef<TextInput>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [requestSentMap, setRequestSentMap] = useState<{
    [userId: string]: boolean;
  }>({});
  const [loadingMap, setLoadingMap] = useState<{ [userId: string]: boolean }>(
    {}
  );
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Boş array kullan
  const posts: any[] = [];

  // Tab'a basıldığında refresh
  useFocusEffect(
    React.useCallback(() => {
      // Search screen'e focus olduğunda refresh
      setSearchQuery("");
      setSearchResults([]);
    }, [])
  );

  // Tab'a basıldığında refresh
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      setRefreshing(true);
      setSearchQuery("");
      setSearchResults([]);
      setTimeout(() => setRefreshing(false), 500);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUserId(userObj?._id || userObj?.id || "");
    })();
  }, []);

  // Arama sonuçları değiştiğinde requestSentMap'i güncelle
  useEffect(() => {
    if (!currentUserId) return;
    const newMap: { [userId: string]: boolean } = {};
    searchResults.forEach((u) => {
      const userId = u._id || u.id;
      newMap[userId] =
        u.pendingFollowRequests?.includes(currentUserId) || false;
    });
    setRequestSentMap(newMap);
  }, [searchResults, currentUserId]);

  // Arama fonksiyonu
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setLoading(true);
      try {
        const results = await searchUsersApi(query);
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
      }
      setLoading(false);
    } else {
      setSearchResults([]);
    }
  };

  const filteredUsers: any[] = [];

  const renderUserItem = ({ item }: { item: any }) => {
    if (!item || !item.username) return null;
    const userId = item._id || item.id;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <Image
          source={{
            uri: item.avatar || "https://ui-avatars.com/api/?name=User",
          }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <View style={styles.usernameContainer}>
            <Text style={[styles.username, { color: colors.text }]}>
              {" "}
              {item.username || "Kullanıcı"}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
            )}
          </View>
        </View>
        {userId !== currentUserId && (
          <FollowButton
            currentUserId={currentUserId}
            targetUserId={userId}
            username={item.username}
            style={styles.followButton}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, flex: 1 },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate("UserSearchScreen")}
          >
            <View pointerEvents="none">
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {/* Sadece postlar listelensin */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        key={"posts-3-cols"}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          setSearchQuery("");
          setSearchResults([]);
          setTimeout(() => setRefreshing(false), 500);
        }}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              Henüz post yok
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  usersList: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  fullName: {
    fontSize: 14,
    marginTop: 2,
  },
  followersCount: {
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    fontWeight: "600",
    fontSize: 14,
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

export default SearchScreen;
