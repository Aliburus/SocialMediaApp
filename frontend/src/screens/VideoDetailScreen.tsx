import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { Video, ResizeMode } from "expo-av";
import { toggleLike, savePost, deletePost, archivePost } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";
import api from "../services/api";

const { width, height } = Dimensions.get("window");

const VideoDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { post, onLikeUpdate, onSaveUpdate } = route.params as {
    post: any;
    onLikeUpdate?: (
      postId: string,
      isLiked: boolean,
      likesCount: number
    ) => void;
    onSaveUpdate?: (postId: string, isSaved: boolean) => void;
  };
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLocked, setLikeLocked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseButton, setShowPlayPauseButton] = useState(false);
  const [isPausedByTouch, setIsPausedByTouch] = useState(false);

  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const playPauseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkUserData = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(userObj);

      if (userObj?._id && Array.isArray(post.likes)) {
        setIsLiked(post.likes.includes(userObj._id));
      }

      if (userObj?._id && Array.isArray(post.savedBy)) {
        setIsSaved(post.savedBy.includes(userObj._id));
      }

      setLikesCount(Array.isArray(post.likes) ? post.likes.length : 0);
    };

    checkUserData();

    // Fade in animasyonu
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [post]);

  const handleLike = async () => {
    if (likeLocked) return;
    setLikeLocked(true);

    const prevLiked = isLiked;
    const prevLikes = likesCount;

    try {
      if (!currentUser?._id) {
        Alert.alert("Hata", "Lütfen giriş yapın.");
        return;
      }

      const newLiked = !isLiked;
      const newLikesCount = newLiked
        ? likesCount + 1
        : Math.max(0, likesCount - 1);

      // Optimistic update
      setIsLiked(newLiked);
      setLikesCount(newLikesCount);

      // HomeScreen'i güncelle
      if (onLikeUpdate) {
        onLikeUpdate(post._id || post.id, newLiked, newLikesCount);
      }

      const updatedPost = await toggleLike(
        post._id || post.id,
        currentUser._id
      );

      const finalLikesCount = Array.isArray(updatedPost.likes)
        ? updatedPost.likes.length
        : 0;
      const finalIsLiked = Array.isArray(updatedPost.likes)
        ? updatedPost.likes.includes(currentUser._id)
        : false;

      setLikesCount(finalLikesCount);
      setIsLiked(finalIsLiked);

      // HomeScreen'i final durumla güncelle
      if (onLikeUpdate) {
        onLikeUpdate(post._id || post.id, finalIsLiked, finalLikesCount);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevLikes);
      Alert.alert("Hata", "Beğeni işlemi başarısız oldu.");
    } finally {
      setLikeLocked(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!currentUser?._id) {
        Alert.alert("Hata", "Lütfen giriş yapın.");
        return;
      }

      const newSaved = !isSaved;

      // Optimistic update
      setIsSaved(newSaved);

      // HomeScreen'i güncelle
      if (onSaveUpdate) {
        onSaveUpdate(post._id || post.id, newSaved);
      }

      await savePost(currentUser._id, post._id || post.id);
    } catch (err) {
      setIsSaved(!isSaved);
      Alert.alert("Hata", "Kaydetme işlemi başarısız oldu.");
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleComment = () => {
    navigation.navigate("Comment", { postId: post._id || post.id });
  };

  const handleDelete = async () => {
    Alert.alert(
      "Gönderiyi Sil",
      "Bu gönderiyi silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(post._id || post.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert("Hata", "Silme işlemi başarısız oldu.");
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    try {
      await archivePost(post._id || post.id);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Hata", "Arşivleme işlemi başarısız oldu.");
    }
  };

  const handleCopyLink = () => {
    // Link kopyalama işlemi
    Alert.alert("Bilgi", "Link kopyalandı!");
  };

  const handleVideoPress = () => {
    setShowPlayPauseButton(true);

    // Hızlı animasyon başlat
    Animated.sequence([
      Animated.timing(playPauseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(playPauseAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPlayPauseButton(false);
    });
  };

  const handleVideoPressIn = async () => {
    // Basılı tutunca video durur
    if (isPlaying && !isPausedByTouch) {
      await videoRef.current?.pauseAsync();
      setIsPausedByTouch(true);
    }
  };

  const handleVideoPressOut = async () => {
    // Bırakınca video devam eder
    if (isPausedByTouch) {
      await videoRef.current?.playAsync();
      setIsPausedByTouch(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Video */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        onPressIn={handleVideoPressIn}
        onPressOut={handleVideoPressOut}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{
            uri: post.video.startsWith("http")
              ? post.video
              : `${api.defaults.baseURL?.replace(/\/api$/, "")}${post.video}`,
          }}
          style={styles.video}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={true}
          isMuted={false}
          volume={1.0}
          shouldCorrectPitch={true}
          posterStyle={styles.video}
          posterSource={
            post.image
              ? {
                  uri: post.image.startsWith("http")
                    ? post.image
                    : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                        post.image
                      }`,
                }
              : undefined
          }
          onReadyForDisplay={() => {
            // Video hazır olduğunda hemen başlat
            setTimeout(() => {
              videoRef.current?.playAsync();
            }, 100);
          }}
          onLoad={() => {
            // Video yüklendiğinde de başlat
            videoRef.current?.playAsync();
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              // Sadece manuel durdurma/oynatma durumlarında state'i güncelle
              if (!isPausedByTouch) {
                setIsPlaying(status.isPlaying);
              }
            }
          }}
          onError={(error) => {
            console.log("Video error:", error);
          }}
        />

        {/* Oynat/Durdur butonu */}
        {showPlayPauseButton && (
          <Animated.View
            style={[
              styles.playPauseButton,
              {
                opacity: playPauseAnim,
                transform: [{ scale: playPauseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.playPauseButtonInner}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={70}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Sol üst kullanıcı bilgisi */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("UserProfile", { user: post.user })
            }
            style={styles.userInfoHeader}
          >
            <View style={styles.userAvatarHeader}>
              {post.user?.avatar ? (
                <Image
                  source={{
                    uri: post.user.avatar.startsWith("http")
                      ? post.user.avatar
                      : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                          post.user.avatar
                        }`,
                  }}
                  style={styles.userAvatarImageHeader}
                />
              ) : (
                <Text style={styles.userInitialHeader}>
                  {post.user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <View style={styles.userTextHeader}>
              <Text style={styles.usernameHeader}>{post.user?.username}</Text>
              {post.user?.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowOptionsModal(true)}
            style={styles.headerMenuButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Sağ alt köşe butonları */}
      <View style={[styles.sideButtons, { bottom: insets.bottom + 40 }]}>
        {/* Beğeni butonu */}
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={28}
            color={isLiked ? "#FF3040" : "#fff"}
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        {/* Yorum butonu */}
        <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionText}>
            {Array.isArray(post.comments) ? post.comments.length : 0}
          </Text>
        </TouchableOpacity>

        {/* Paylaş butonu */}
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Kaydet butonu */}
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={28}
            color={isSaved ? "#fff" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {/* Alt bilgi alanı */}
      <View style={[styles.bottomInfo, { bottom: insets.bottom + 180 }]}>
        {post.caption && (
          <Text style={styles.caption} numberOfLines={3}>
            <Text style={styles.captionUsername}>{post.user?.username} </Text>
            {post.caption}
          </Text>
        )}
      </View>

      {/* Paylaş modalı */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />

      {/* Seçenekler modalı */}
      {showOptionsModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowOptionsModal(false)}
          />
          <View
            style={[
              styles.optionsModal,
              { backgroundColor: colors.background },
            ]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                handleCopyLink();
              }}
            >
              <Ionicons name="link-outline" size={24} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                Linki Kopyala
              </Text>
            </TouchableOpacity>

            {currentUser?._id === post.user?._id && (
              <>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsModal(false);
                    handleArchive();
                  }}
                >
                  <Ionicons
                    name="archive-outline"
                    size={24}
                    color={colors.text}
                  />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    Arşivle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionItem, styles.deleteOption]}
                  onPress={() => {
                    setShowOptionsModal(false);
                    handleDelete();
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3040" />
                  <Text style={[styles.optionText, { color: "#FF3040" }]}>
                    Sil
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: width,
    height: height,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatarHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    marginRight: 8,
  },
  userAvatarImageHeader: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userInitialHeader: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  userTextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  usernameHeader: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sideButtons: {
    position: "absolute",
    right: 20,
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  userButton: {
    marginBottom: 10,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  userInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  actionButton: {
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: "absolute",
    left: 16,
    right: 100,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captionUsername: {
    fontWeight: "bold",
  },
  playPauseButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  playPauseButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  optionsModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 8,
    paddingTop: 16,
  },
});

export default VideoDetailScreen;
