import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  PanResponder,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import {
  viewStory,
  deleteStory,
  archiveStory,
  unarchiveStory,
} from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareModal } from "../components/ShareModal";
import api from "../services/api";
import { Video, ResizeMode } from "expo-av";

const { width, height } = Dimensions.get("window");

// Zamanı güzel formatta göstermek için fonksiyon
function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "Az önce";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  return `${Math.floor(diffInSeconds / 86400)} gün önce`;
}

const StoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { stories, fromArchive } = route.params as {
    stories: any[];
    fromArchive?: boolean;
  };
  const [current, setCurrent] = React.useState(() => {
    // Görülmemiş story'lerden başla
    const firstUnviewedIndex = stories.findIndex((story) => !story.isViewed);
    return firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;
  });
  const { colors } = useTheme();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(0);
  const [remainingDuration, setRemainingDuration] = React.useState(8000);
  const [showOptions, setShowOptions] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Story'nin 24 saat geçip geçmediğini kontrol et
  const isStoryWithin24Hours = (story: any) => {
    if (!story.createdAt) return false;
    const storyDate = new Date(story.createdAt);
    const now = new Date();
    const diffInHours =
      (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          if (fromArchive) navigation.navigate("Archive");
          else if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate("Home");
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(0)).current;

  const pressStartRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!isPaused) {
      timer = setTimeout(() => {
        handleNext();
      }, remainingDuration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [current, isPaused, remainingDuration]);

  // Story süresi bittiğinde otomatik kapat
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (!isPaused) {
      // Tek story varsa 8 saniye sonra kapat
      if (stories.length === 1) {
        timer = setTimeout(() => {
          if (fromArchive) {
            navigation.navigate("Archive");
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("Home");
          }
        }, 8000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stories.length, isPaused, navigation]);

  useEffect(() => {
    setProgressValue(0);
    setRemainingDuration(8000);
  }, [current]);

  useEffect(() => {
    // Kullanıcı bilgisini al
    (async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      setUserId(userObj?._id || userObj?.id || null);
    })();
  }, []);

  useEffect(() => {
    // Story izlenmiş olarak işaretle
    if (stories[current]?._id && userId) {
      viewStory(stories[current]._id, userId).catch((err: any) => {});
      api.post("/explore/track", {
        contentId: stories[current]._id,
        behaviorType: "story_view",
      });
    }
  }, [current, userId]);

  // StoryScreen'den çıkıldığında tüm story'leri görüldü olarak işaretle
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Screen'den çıkıldığında tüm story'leri görüldü olarak işaretle
        if (userId && stories.length > 0) {
          stories.forEach((story) => {
            if (story._id) {
              viewStory(story._id, userId).catch((err: any) => {});
            }
          });
        }
      };
    }, [userId, stories])
  );

  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    if (!isPaused) {
      progress.setValue(progressValue);
      anim = Animated.timing(progress, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      anim.start((result) => {
        if (result.finished) {
          // Progress tamamlandığında otomatik olarak handleNext çağır
          handleNext();
        }
      });
    } else {
      progress.stopAnimation((value) => {
        setProgressValue(value);
        setRemainingDuration((1 - value) * 8000);
      });
    }
    return () => {
      if (anim && anim.stop) anim.stop();
    };
  }, [current, isPaused, remainingDuration]);

  const handleNext = () => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // Son story'den sonra otomatik kapat
      // Eğer tüm story'ler görüldüyse kapat
      const allViewed = stories.every((s) => s.isViewed);
      if (allViewed) {
        if (fromArchive) {
          navigation.navigate("Archive");
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Home");
        }
      } else {
        // Hala görülmemiş story'ler varsa kapat
        if (fromArchive) {
          navigation.navigate("Archive");
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Home");
        }
      }
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
    else if (fromArchive) navigation.navigate("Archive");
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Home");
  };

  // Kullanıcının kendi story'si olup olmadığını kontrol et
  const isOwnStory =
    stories[current]?.user?._id === userId ||
    stories[current]?.user?.id === userId;

  // Story silme fonksiyonu
  const handleDeleteStory = async () => {
    try {
      if (stories[current]?._id && userId) {
        const result = await deleteStory(stories[current]._id, userId);

        setShowOptions(false);
        // Story silindikten sonra HomeScreen'e dön ve story'leri yenile
        if (navigation.canGoBack()) {
          navigation.goBack({ refreshStories: true });
        } else {
          navigation.navigate("Home", { refreshStories: true });
        }
      }
    } catch (error) {
      // Hata durumunda da kapat
      setShowOptions(false);
    }
  };

  // Story arşivleme fonksiyonu
  const handleArchiveStory = async () => {
    try {
      if (stories[current]?._id && userId) {
        const result = await archiveStory(stories[current]._id, userId);
        setShowOptions(false);
        // Story arşivlendikten sonra HomeScreen'e dön ve story'leri yenile
        if (navigation.canGoBack()) {
          navigation.goBack({ refreshStories: true });
        } else {
          navigation.navigate("Home", { refreshStories: true });
        }
      }
    } catch (error) {
      // Hata durumunda da kapat
      setShowOptions(false);
    }
  };

  const handleUnarchiveStory = async () => {
    try {
      if (stories[current]?._id && userId) {
        await unarchiveStory(stories[current]._id, userId);
        setShowOptions(false);
        if (navigation.canGoBack()) {
          navigation.goBack({ refreshStories: true });
        } else {
          navigation.navigate("Home", { refreshStories: true });
        }
      }
    } catch (error) {
      setShowOptions(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000" }}
        edges={["bottom"]}
      >
        <Animated.View
          style={[styles.container, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          {/* Story görseli ve tıklama alanları */}
          <View style={{ flex: 1 }}>
            {stories[current]?.video ? (
              <Video
                source={{
                  uri: stories[current].video.startsWith("http")
                    ? stories[current].video
                    : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                        stories[current].video
                      }`,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{
                  uri: stories[current].image.startsWith("http")
                    ? stories[current].image
                    : `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                        stories[current].image
                      }`,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />
            )}
            {/* Sol ve sağ tıklama alanları */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                  if (current > 0) setCurrent((c) => c - 1);
                }}
                onPressIn={() => setIsPaused(true)}
                onPressOut={() => setIsPaused(false)}
              />
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPressIn={() => {
                  setIsPaused(true);
                  pressStartRef.current = Date.now();
                }}
                onPressOut={() => {
                  setIsPaused(false);
                  const pressDuration =
                    Date.now() - (pressStartRef.current || 0);
                  if (pressDuration < 300) {
                    handleNext();
                  }
                  pressStartRef.current = null;
                }}
              />
            </View>
          </View>

          {/* Üst progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {stories.map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    marginLeft: i === 0 ? 0 : 2,
                    marginRight: i === stories.length - 1 ? 0 : 2,
                  }}
                >
                  {i < current ? (
                    <View
                      style={[
                        styles.progressBar,
                        styles.progressFill,
                        { width: "100%" },
                      ]}
                    />
                  ) : i === current ? (
                    <Animated.View
                      style={[
                        styles.progressBar,
                        styles.progressFill,
                        {
                          width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                              0,
                              (width - (stories.length - 1) * 4 - 24) /
                                stories.length,
                            ],
                          }),
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.progressBar,
                        {
                          backgroundColor: "rgba(255,255,255,0.3)",
                          width: "100%",
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Üst header */}
          <View style={styles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Image
                source={{
                  uri: stories[current]?.user?.avatar
                    ? stories[current].user.avatar.startsWith("/uploads/")
                      ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${
                          stories[current].user.avatar
                        }`
                      : stories[current].user.avatar
                    : "https://ui-avatars.com/api/?name=User",
                }}
                style={styles.profileImage}
              />
              <Text style={styles.username}>
                {stories[current]?.user?.username || ""}
              </Text>
              {stories[current]?.user?.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#1DA1F2"
                  style={{ marginLeft: 2 }}
                />
              )}
              <Text style={styles.timeAgo}>
                {stories[current]?.timestamp
                  ? timeAgo(stories[current].timestamp)
                  : ""}
              </Text>
            </View>
            {isOwnStory ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowOptions(!showOptions)}
              >
                <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Alt bar */}
          <View
            style={[styles.inputRowContainer, { bottom: insets.bottom + 16 }]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.messageInput}
                placeholder="Send message"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowShareModal(true)}
              >
                <Ionicons name="paper-plane-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Options Menu */}
        {showOptions && isOwnStory && (
          <View style={styles.optionsOverlay}>
            <TouchableOpacity
              style={styles.optionsBackground}
              onPress={() => setShowOptions(false)}
              activeOpacity={1}
            />
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleDeleteStory}
              >
                <Ionicons name="trash-outline" size={24} color="#ff3b30" />
                <Text style={[styles.optionText, { color: "#ff3b30" }]}>
                  Story'yi Sil
                </Text>
              </TouchableOpacity>
              {fromArchive && isStoryWithin24Hours(stories[current]) && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleUnarchiveStory}
                >
                  <Ionicons name="archive-outline" size={24} color="#fff" />
                  <Text style={styles.optionText}>Arşivden Çıkar</Text>
                </TouchableOpacity>
              )}
              {!fromArchive && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleArchiveStory}
                >
                  <Ionicons name="archive-outline" size={24} color="#fff" />
                  <Text style={styles.optionText}>Arşivle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.optionButton, { borderBottomWidth: 0 }]}
                onPress={() => setShowOptions(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.optionText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        story={stories[current]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  storyImage: {
    width: width,
    height: height,
    position: "absolute",
  },
  progressContainer: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  header: {
    position: "absolute",
    top: 65,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  timeAgo: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "400",
  },
  moreButton: {
    padding: 4,
    marginLeft: 12,
  },
  inputRowContainer: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
  },
  actionButton: {
    padding: 8,
  },
  optionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  optionsBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  optionsContainer: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    transform: [{ translateY: -100 }],
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  shareButton: {
    padding: 4,
    marginRight: 8,
  },
});

export default StoryScreen;
