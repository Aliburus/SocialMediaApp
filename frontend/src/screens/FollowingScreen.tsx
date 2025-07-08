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
import { getProfile } from "../services/api";
import FollowButton from "../components/FollowButton";

const FollowingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState<string>("");

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

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setMyId(userObj?._id || userObj?.id || "");
    })();
  }, []);

  React.useEffect(() => {
    fetchFollowing();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowing();
    setRefreshing(false);
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
      <FollowButton
        currentUserId={myId}
        targetUserId={item._id || item.id}
        username={item.username}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );

  const memoizedFollowing = useMemo(() => followingList, [followingList]);

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
        data={memoizedFollowing}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={renderFollowingItem}
        keyExtractor={(item, index) =>
          item._id?.toString() || item.id?.toString() || index.toString()
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.followingList}
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
