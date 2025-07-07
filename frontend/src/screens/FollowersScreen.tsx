import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getProfile,
  followUser,
  unfollowUser,
  sendFollowRequest,
} from "../services/api";
import FollowButton from "../components/FollowButton";

const FollowersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowers = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userId = userObj?._id || userObj?.id;
      if (!userId) return;
      const me = await getProfile(userId);
      const followingIds = (me.following || []).map(
        (f: any) => f._id || f.id || f
      );
      const followers = me.followers || [];
      // Her follower için detaylı profil çek ve isFollowing flag'i ekle
      const detailedFollowers = await Promise.all(
        followers.map(async (f: any) => {
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
      setFollowersList(detailedFollowers);
    } catch (err) {
      setFollowersList([]);
    }
  };

  React.useEffect(() => {
    fetchFollowers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowers();
    setRefreshing(false);
  };

  const handleFollowToggle = async (
    userId: string,
    isFollowing: boolean,
    isPrivateAccount: boolean
  ) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const myId = userObj?._id || userObj?.id;
      if (!myId) return;

      if (isFollowing) {
        await unfollowUser(myId, userId);
      } else {
        if (isPrivateAccount) {
          await sendFollowRequest(myId, userId);
        } else {
          await followUser(myId, userId);
        }
      }

      // Güncel profil çek ve followers listesini güncelle
      const updatedProfile = await getProfile(myId);
      const followingIds = (updatedProfile.following || []).map(
        (f: any) => f._id || f.id || f
      );
      const followers = updatedProfile.followers || [];

      const detailedFollowers = await Promise.all(
        followers.map(async (f: any) => {
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
      setFollowersList(detailedFollowers);

      // HomeScreen'de postları anında güncelle
      if (typeof window !== "undefined" && (window as any).__onFollowChange) {
        (window as any).__onFollowChange();
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  const renderFollowerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.followerItem, { borderBottomColor: colors.border }]}
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
      <FollowButton
        type={item.isFollowing ? "unfollow" : "follow"}
        onPress={() =>
          handleFollowToggle(
            item._id || item.id,
            item.isFollowing,
            item.privateAccount
          )
        }
      />
    </TouchableOpacity>
  );

  const memoizedFollowers = useMemo(() => followersList, [followersList]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Followers
        </Text>
        <View style={styles.placeholder} />
      </View>
      <FlatList
        data={memoizedFollowers}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={renderFollowerItem}
        keyExtractor={(item, index) =>
          item._id?.toString() || item.id?.toString() || index.toString()
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.followersList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
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
  followersList: {
    padding: 16,
  },
  followerItem: {
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
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FollowersScreen;
