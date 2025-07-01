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
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const StoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { stories } = route.params as { stories: any[] };
  const [current, setCurrent] = React.useState(0);
  const { colors } = useTheme();

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
          navigation.goBack();
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

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNext();
    });
  }, [current]);

  const handleNext = () => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
    else navigation.goBack();
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
          {/* Story görseli */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleNext}
            onLongPress={handlePrev}
          >
            <Image
              source={{
                uri:
                  stories[current]?.image ||
                  stories[current]?.media ||
                  "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg",
              }}
              style={styles.storyImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

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
              <Text style={styles.timeAgo}>5h</Text>
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
