import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import FollowButton from "../components/FollowButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getProfile,
  getUserPosts,
  followUser,
  unfollowUser,
  sendFollowRequest,
  cancelFollowRequest,
} from "../services/api";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  ArrowLeft,
  Grid3X3,
  Play,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const imageSize = (width - 6) / 3;

const UserProfileScreen: React.FC = ({ route, navigation }: any) => {
  const { user } = route.params;
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(user);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"grid" | "reels">("grid");
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const isFocused = useIsFocused();
  const [followed, setFollowed] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    const userStr = await AsyncStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const myUserId = userObj?._id || userObj?.id || "";
    setCurrentUserId(myUserId);

    if (user._id || user.id) {
      try {
        const profileData = await getProfile(user._id || user.id);
        setProfile(profileData);
        const posts = await getUserPosts(user._id || user.id, myUserId);
        // En yeniden eskiye doğru sırala
        const sortedPosts = posts.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setUserPosts(sortedPosts);

        // Mevcut kullanıcının profilini de çek
        if (myUserId) {
          const currentProfile = await getProfile(myUserId);
          setCurrentUserProfile(currentProfile);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (navigation && navigation.getParent) {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: isFocused ? "flex" : "none" },
        });
      }
    }
  }, [isFocused, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    setLoadingBtn(true);
    try {
      // Eğer hesap gizliyse takip isteği gönder, açıksa direkt takip et
      if (profile?.privateAccount) {
        await sendFollowRequest(currentUserId, profile._id || profile.id);
      } else {
        await followUser(currentUserId, profile._id || profile.id);
      }
      // Profil ve post verilerini yeniden çek
      const profileData = await getProfile(profile._id || profile.id);
      setProfile(profileData);
      const posts = await getUserPosts(
        profile._id || profile.id,
        currentUserId
      );
      const sortedPosts = posts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserPosts(sortedPosts);

      // Mevcut kullanıcının profilini de güncelle
      if (currentUserId) {
        const currentProfile = await getProfile(currentUserId);
        setCurrentUserProfile(currentProfile);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
    setLoadingBtn(false);
  };

  const handleUnfollow = async () => {
    setLoadingBtn(true);
    try {
      await unfollowUser(currentUserId, profile._id || profile.id);
      // Profil ve post verilerini yeniden çek
      const profileData = await getProfile(profile._id || profile.id);
      setProfile(profileData);
      const posts = await getUserPosts(
        profile._id || profile.id,
        currentUserId
      );
      const sortedPosts = posts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserPosts(sortedPosts);
      setFollowed(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
    setLoadingBtn(false);
  };

  const handleCancelRequest = async () => {
    setLoadingBtn(true);
    try {
      await cancelFollowRequest(currentUserId, profile._id || profile.id);
      const profileData = await getProfile(profile._id || profile.id);
      setProfile(profileData);
      const posts = await getUserPosts(
        profile._id || profile.id,
        currentUserId
      );
      const sortedPosts = posts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserPosts(sortedPosts);

      // Mevcut kullanıcının profilini de güncelle
      if (currentUserId) {
        const currentProfile = await getProfile(currentUserId);
        setCurrentUserProfile(currentProfile);
      }
    } catch (error) {
      console.error("Error canceling follow request:", error);
    }
    setLoadingBtn(false);
  };

  const handleFollowBack = async () => {
    setLoadingBtn(true);
    try {
      // Eğer hesap gizliyse takip isteği gönder, açıksa direkt takip et
      if (profile?.privateAccount) {
        await sendFollowRequest(currentUserId, profile._id || profile.id);
      } else {
        await followUser(currentUserId, profile._id || profile.id);
        setFollowed(true);
      }
      const profileData = await getProfile(profile._id || profile.id);
      setProfile(profileData);
      const posts = await getUserPosts(
        profile._id || profile.id,
        currentUserId
      );
      const sortedPosts = posts.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserPosts(sortedPosts);

      // Mevcut kullanıcının profilini de güncelle
      if (currentUserId) {
        const currentProfile = await getProfile(currentUserId);
        setCurrentUserProfile(currentProfile);
      }
    } catch (error) {
      console.error("Error following back:", error);
    }
    setLoadingBtn(false);
  };

  const isPending = profile?.pendingFollowRequests?.some(
    (id: any) => id.toString() === currentUserId
  );
  const isSent = currentUserProfile?.sentFollowRequests?.some(
    (id: any) => id.toString() === (profile._id || profile.id)
  );
  const isFollowing = profile?.followers?.some(
    (id: any) => id.toString() === currentUserId
  );
  const isFollowMe = profile?.following?.some(
    (id: any) => id.toString() === currentUserId
  );
  const isPrivateAccount = profile?.privateAccount;
  const isOwnProfile =
    currentUserId?.toString() === (profile._id || profile.id)?.toString();
  // Kendi profilinde her zaman postları görebil, başkalarının gizli hesabında takipçi olması gerekir
  const canViewPosts = isOwnProfile || !isPrivateAccount || isFollowing;

  // Test fonksiyonu - gizli hesap ayarını değiştir
  const togglePrivateAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/users/${
          profile._id || profile.id
        }/toggle-private`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      // Backend'den gelen profil verisini kullan
      if (result.profileData) {
        setProfile(result.profileData);
      } else {
        // Profil verilerini yeniden çek
        await fetchUserData();
      }
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
    >
      <Image source={{ uri: item.image }} style={styles.postImage} />
    </TouchableOpacity>
  );

  // Gizli hesap mesajı
  const renderPrivateAccountMessage = () => (
    <View style={styles.privateAccountContainer}>
      <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
      <Text style={[styles.privateAccountTitle, { color: colors.text }]}>
        Gizli Hesap
      </Text>
      <Text
        style={[styles.privateAccountText, { color: colors.textSecondary }]}
      >
        Bu hesabın gönderilerini görmek için takip etmeniz gerekiyor.
      </Text>
    </View>
  );

  // Yardımcı fonksiyon: Buton metni ve aksiyonu
  const getFollowButton = () => {
    if (currentUserId === (profile._id || profile.id)) {
      return null;
    }
    if (isFollowing || followed) {
      return {
        type: "unfollow" as const,
        onPress: handleUnfollow,
      };
    }
    if (isFollowMe) {
      // Eğer gizli hesap ve takip isteği gönderilmişse
      if (profile?.privateAccount && isSent) {
        return {
          type: "pending_request" as const,
          onPress: handleCancelRequest,
        };
      }
      return {
        type: profile?.privateAccount
          ? ("follow" as const)
          : ("follow_back" as const),
        onPress: handleFollowBack,
      };
    }
    // Eğer gizli hesap ve takip isteği gönderilmişse
    if (profile?.privateAccount && isSent) {
      return {
        type: "pending_request" as const,
        onPress: handleCancelRequest,
      };
    }
    return {
      type: "follow" as const,
      onPress: handleFollow,
    };
  };

  const renderFollowButton = () => {
    const btn = getFollowButton();
    if (!btn) return null;
    return (
      <FollowButton
        type={btn.type}
        onPress={btn.onPress}
        disabled={loadingBtn}
        style={styles.followButton}
      />
    );
  };

  // Mesaj butonu render fonksiyonu
  const renderMessageButton = () => {
    if (currentUserId === (profile._id || profile.id)) return null;
    // Eğer sadece takipçiler mesaj gönderebilir ve takipçi değilse gösterme
    if (profile.onlyFollowersCanMessage && !isFollowing && !followed)
      return null;
    return (
      <TouchableOpacity
        style={[
          styles.followButton,
          { backgroundColor: colors.primary, marginTop: 8 },
        ]}
        onPress={() => navigation.navigate("DMChat", { user: profile })}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18}
          color="#fff"
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.followButtonText, { color: "#fff" }]}>
          Mesaj Gönder
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <FlatList
        data={canViewPosts && activeTab === "grid" ? userPosts : []}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id || item.id}
        numColumns={3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.usernameContainer}>
                <Text style={[styles.headerUsername, { color: colors.text }]}>
                  {profile?.username || ""}
                </Text>
                {profile?.isVerified && <UserCheck size={20} color="#1DA1F2" />}
              </View>
              {currentUserId === (profile._id || profile.id) ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.text,
                      marginRight: 8,
                      fontWeight: "600",
                    }}
                  >
                    Gizli Hesap
                  </Text>
                  <Switch
                    value={!!profile?.privateAccount}
                    onValueChange={async (val) => {
                      await togglePrivateAccount();
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={
                      profile?.privateAccount ? colors.primary : colors.surface
                    }
                  />
                </View>
              ) : (
                <View style={{ width: 24 }} />
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                {/* Story bar: sadece hikaye varsa ve hesap gizli değilse */}
                {userPosts.some((p) => p.type === "story" || p.isStory) &&
                !profile?.isPrivate ? (
                  <View
                    style={[styles.storyBar, { borderColor: colors.primary }]}
                  >
                    <Image
                      source={{ uri: profile?.avatar || "" }}
                      style={[
                        styles.profileImage,
                        { backgroundColor: colors.background },
                      ]}
                    />
                  </View>
                ) : (
                  <Image
                    source={{ uri: profile?.avatar || "" }}
                    style={[
                      styles.profileImage,
                      { backgroundColor: colors.background },
                    ]}
                  />
                )}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      {userPosts.length}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Posts
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      {profile?.followersCount ||
                        profile?.followers?.length ||
                        0}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Followers
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      {profile?.followingCount ||
                        profile?.following?.length ||
                        0}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Following
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bioContainer}>
                <Text style={[styles.fullName, { color: colors.text }]}>
                  {profile?.fullName || profile?.name || ""}
                </Text>
                {profile?.bio && (
                  <Text style={[styles.bio, { color: colors.text }]}>
                    {profile.bio}
                  </Text>
                )}

                {/* Gizli hesap toggle butonu - sadece kendi profilinde */}
                {currentUserId === (profile._id || profile.id) && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <TouchableOpacity
                      onPress={togglePrivateAccount}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        Hesap: {profile?.privateAccount ? "Gizli" : "Açık"}
                      </Text>
                    </TouchableOpacity>

                    {/* Debug bilgisi */}
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      Debug: isPrivateAccount=
                      {profile?.privateAccount?.toString()}, canViewPosts=
                      {canViewPosts.toString()}, isFollowing=
                      {isFollowing.toString()}
                    </Text>
                  </View>
                )}
              </View>

              {renderFollowButton()}
              {renderMessageButton()}
            </View>

            {/* Tabs */}
            <View
              style={[
                styles.tabsContainer,
                { borderBottomColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "grid" && [
                    styles.activeTab,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("grid")}
              >
                <Ionicons
                  name="grid-outline"
                  size={24}
                  color={
                    activeTab === "grid" ? colors.primary : colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "reels" && [
                    styles.activeTab,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("reels")}
              >
                <Ionicons
                  name="play-outline"
                  size={24}
                  color={
                    activeTab === "reels"
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Empty state for reels */}
            {/* {activeTab === "reels" && (
              <View style={styles.emptyStateContainer}>
                <Play size={48} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Reels feature coming soon!
                </Text>
              </View>
            )} */}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            {!canViewPosts ? (
              renderPrivateAccountMessage()
            ) : activeTab === "grid" ? (
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                Henüz gönderi yok
              </Text>
            ) : (
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                Henüz reels yok
              </Text>
            )}
          </View>
        }
        contentContainerStyle={
          activeTab === "grid" ? styles.postsContainer : undefined
        }
        columnWrapperStyle={activeTab === "grid" ? { gap: 0 } : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: "relative",
  },
  usernameContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: "bold",
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
  },
  statLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  followingButton: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  pendingButton: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  followPrimaryButton: {
    // Primary button styling handled by backgroundColor prop
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  postsContainer: {
    paddingBottom: 24,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 0,
    backgroundColor: "#eee",
  },
  postImage: {
    width: imageSize,
    height: imageSize,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  storyBar: {
    borderWidth: 3,
    borderRadius: 999,
    padding: 2,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  privateAccountContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  privateAccountTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  privateAccountText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default UserProfileScreen;
