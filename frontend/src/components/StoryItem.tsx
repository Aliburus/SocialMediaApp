import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "../types";

interface StoryItemProps {
  story: Story;
  onPress?: () => void;
  isActive?: boolean;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, onPress, isActive }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        {isActive ? (
          <View style={styles.innerBorder}>
            <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
          </View>
        ) : !story.isViewed ? (
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
        ) : (
          <View style={styles.viewedBorder}>
            <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
          </View>
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
    marginRight: 10,
    width: 64,
  },
  imageContainer: {
    marginBottom: 2,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  innerBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
