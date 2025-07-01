import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "../types";

interface StoryItemProps {
  story: Story;
  onPress?: () => void;
  isActive?: boolean;
  isViewed?: boolean;
}

const StoryItem: React.FC<StoryItemProps> = ({
  story,
  onPress,
  isActive,
  isViewed,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        {isActive ? (
          <View style={styles.innerBorder}>
            <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
          </View>
        ) : isViewed ? (
          <View style={styles.viewedBorder}>
            <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
          </View>
        ) : (
          <LinearGradient
            colors={["#E91E63", "#F06292", "#FF9800"]}
            style={styles.gradient}
          >
            <View style={styles.innerBorder}>
              <Image
                source={{ uri: story.user.avatar }}
                style={styles.avatar}
              />
            </View>
          </LinearGradient>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {story.user.username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 8,
    width: 60,
  },
  imageContainer: {
    marginBottom: 4,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  innerBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  viewedBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  username: {
    fontSize: 11,
    textAlign: "center",
    color: "#333",
    marginTop: 2,
    maxWidth: 60,
  },
});

export default StoryItem;
