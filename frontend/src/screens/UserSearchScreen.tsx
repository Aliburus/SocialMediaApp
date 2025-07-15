import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { searchUsers as searchUsersApi } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = useState("");

  React.useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUserId(userObj?._id || userObj?.id || "");
    })();
  }, []);

  // Pagination için state'ler
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const RESULTS_PER_PAGE = 15;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setLoading(true);
      try {
        const results = await searchUsersApi(query);
        setSearchResults(results);

        // İlk 15 sonucu göster
        setDisplayedResults(results.slice(0, RESULTS_PER_PAGE));
        setCurrentPage(1);
        setHasMoreResults(results.length > RESULTS_PER_PAGE);

        if (results.length > 0 && currentUserId) {
          results.forEach((user: any) => {
            api.post("/explore/track", {
              contentId: user._id || user.id,
              behaviorType: "search",
            });
          });
        }
      } catch (err) {
        setSearchResults([]);
        setDisplayedResults([]);
        setHasMoreResults(false);
      }
      setLoading(false);
    } else {
      setSearchResults([]);
      setDisplayedResults([]);
      setHasMoreResults(false);
    }
  };

  // Daha fazla sonuç yükle
  const loadMoreResults = async () => {
    if (loadingMore || !hasMoreResults) return;

    setLoadingMore(true);

    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;

    const newResults = searchResults.slice(startIndex, endIndex);

    if (newResults.length > 0) {
      setDisplayedResults((prev) => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMoreResults(endIndex < searchResults.length);
    } else {
      setHasMoreResults(false);
    }

    setLoadingMore(false);
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate("UserProfile", { user: item })}
    >
      <Image
        source={{
          uri: item.avatar?.startsWith("http")
            ? item.avatar
            : item.avatar
            ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${item.avatar}`
            : "https://ui-avatars.com/api/?name=User",
        }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, { color: colors.text }]}>
            {" "}
            {item.username || "Kullanıcı"}{" "}
          </Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <TextInput
        style={{
          color: colors.text,
          backgroundColor: colors.surface,
          borderRadius: 25,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 16,
          marginHorizontal: 16,
          marginTop: 16,
        }}
        placeholder="Search user..."
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus
      />
      {searchQuery.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Type above to search for users
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id || item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <LoadingSpinner size="small" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    backgroundColor: undefined,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
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
    fontWeight: "500",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
});

export default UserSearchScreen;
