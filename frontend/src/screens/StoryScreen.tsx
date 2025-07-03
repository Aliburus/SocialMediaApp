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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const { stories } = route.params as { stories: any[] };
  const [current, setCurrent] = React.useState(0);
  const { colors } = useTheme();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(0);
  const [remainingDuration, setRemainingDuration] = React.useState(8000);

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
          if (navigation.canGoBack()) navigation.goBack();
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
      axios.post(
        `${
          process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/stories/${stories[current]._id}/view`,
        { userId }
      );
    }
  }, [current, userId]);

  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    if (!isPaused) {
      progress.setValue(progressValue);
      anim = Animated.timing(progress, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      anim.start();
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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Home");
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
          <View style={{ flex: 1, flexDirection: "row" }}>
            {/* Sol alan: bir önceki story */}
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => {
                if (current > 0) setCurrent((c) => c - 1);
              }}
              onPressIn={() => setIsPaused(true)}
              onPressOut={() => setIsPaused(false)}
            >
              <Image
                source={{
                  uri:
                    stories[current]?.image ||
                    stories[current]?.media ||
                    "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg",
                }}
                style={[styles.storyImage, { position: "absolute", left: 0 }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
            {/* Sağ alan: bir sonraki story */}
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPressIn={() => {
                setIsPaused(true);
                pressStartRef.current = Date.now();
              }}
              onPressOut={() => {
                setIsPaused(false);
                const pressDuration = Date.now() - (pressStartRef.current || 0);
                if (pressDuration < 300) {
                  handleNext();
                }
                pressStartRef.current = null;
              }}
            >
              {/* Boş, sadece tıklama alanı */}
            </TouchableOpacity>
          </View>

          {/* Üst progress bar */}
          <View style={styles.progressContainer}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {stories.map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressBar, { flex: 1, marginHorizontal: 2 }]}
                >
                  {i < current ? (
                    <View style={[styles.progressFill, { width: "100%" }]} />
                  ) : i === current ? (
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, width - 24],
                          }),
                        },
                      ]}
                    />
                  ) : (
                    <View style={[styles.progressFill, { width: 0 }]} />
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
                  uri:
                    stories[current]?.user?.avatar ||
                    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
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
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
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
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
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
  },
  progressFill: {
    height: 2,
    width: "60%",
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
});

export default StoryScreen;
