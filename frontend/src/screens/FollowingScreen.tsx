import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { mockUsers } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, followUser, unfollowUser } from "../services/api";

const FollowingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowing = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) return;
      const me = await getProfile(userId);
      const followingIds = (me.following || []).map(
        (f: any) => f._id || f.id || f
      );
      const following = me.following || [];
      // Her following için detaylı profil çek ve isFollowing flag'i ekle
      const detailedFollowing = await Promise.all(
        following.map(async (f: any) => {
          let user = f;
          if (!(typeof f === "object" && f.avatar)) {
            user = await getProfile(f._id || f.id || f);
          }
          return {
            ...user,
            isFollowing: followingIds.includes(user._id || user.id || user),
          };
        })
      );
      setFollowingList(detailedFollowing);
    } catch (err) {
      setFollowingList([]);
    }
  };

  React.useEffect(() => {
    fetchFollowing();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowing();
    setRefreshing(false);
  };

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const myId = userObj?._id || userObj?.id;
      if (!myId) return;

      if (isFollowing) {
        await unfollowUser(myId, userId);
      } else {
        await followUser(myId, userId);
      }

      // Güncel profil çek ve following listesini güncelle
      const updatedProfile = await getProfile(myId);
      const followingIds = (updatedProfile.following || []).map(
        (f: any) => f._id || f.id || f
      );
      const following = updatedProfile.following || [];

      const detailedFollowing = await Promise.all(
        following.map(async (f: any) => {
          let user = f;
          if (!(typeof f === "object" && f.avatar)) {
            user = await getProfile(f._id || f.id || f);
          }
          return {
            ...user,
            isFollowing: followingIds.includes(user._id || user.id || user),
          };
        })
      );
      setFollowingList(detailedFollowing);
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  const renderFollowingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.followingItem, { borderBottomColor: colors.border }]}
      onPress={() => navigation.navigate("UserProfile", { user: item })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, { color: colors.text }]}>
            {item.username}
          </Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
          )}
        </View>
        <Text style={[styles.fullName, { color: colors.textSecondary }]}>
          {item.fullName}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followingButton,
          {
            backgroundColor: item.isFollowing
              ? colors.primary
              : colors.background,
            borderWidth: item.isFollowing ? 0 : 1,
            borderColor: colors.primary,
          },
        ]}
        onPress={() =>
          handleFollowToggle(item._id || item.id, item.isFollowing)
        }
      >
        <Text
          style={[
            styles.followingButtonText,
            { color: item.isFollowing ? colors.background : colors.primary },
          ]}
        >
          {item.isFollowing ? "Takipten Çık" : "Takip Et"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Following
        </Text>
        <View style={styles.placeholder} />
      </View>
      <FlatList
        data={followingList}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={renderFollowingItem}
        keyExtractor={(item, index) =>
          item._id?.toString() || item.id?.toString() || index.toString()
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.followingList}
      />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 24,
  },
  followingList: {
    padding: 16,
  },
  followingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
    marginBottom: 0,
  },
  fullName: {
    fontSize: 14,
    marginTop: 0,
  },
  followingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  followingButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FollowingScreen;
