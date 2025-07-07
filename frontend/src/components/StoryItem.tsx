import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "../types";

interface StoryItemProps {
  story: Story;
  onPress?: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
  isViewed?: boolean;
  totalStories?: number;
  viewedStories?: number;
}

const StoryItem: React.FC<StoryItemProps> = ({
  story,
  onPress,
  onLongPress,
  isActive,
  isViewed,
  totalStories,
  viewedStories,
}) => {
  const avatar = story.user?.avatar || "https://ui-avatars.com/api/?name=User";
  const username = story.user?.username || "Kullanıcı";

  // isViewed prop'u veya story'nin kendi viewed durumu
  const hasBeenViewed = isViewed || story.isViewed;

  // Kısmi görüntüleme durumu (bazı story'ler görülmüş)
  const isPartiallyViewed =
    totalStories &&
    viewedStories &&
    viewedStories > 0 &&
    viewedStories < totalStories;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        {hasBeenViewed ? (
          <View style={styles.outerBorderGray}>
            <View style={styles.innerWhiteCircle}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.outerBorderGradient}
          >
            <View style={styles.innerWhiteCircle}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
          </LinearGradient>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 8,
    width: 70,
  },
  imageContainer: {
    marginBottom: 4,
  },
  outerBorderGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  outerBorderGray: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#bbb",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  innerWhiteCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  username: {
    fontSize: 13,
    textAlign: "center",
    color: "#ccc",
    marginTop: 2,
    maxWidth: 70,
  },
});

export default StoryItem;
