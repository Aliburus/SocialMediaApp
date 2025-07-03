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
  const avatar = story.user?.avatar || "https://ui-avatars.com/api/?name=User";
  const username = story.user?.username || "Kullanıcı";
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        {isViewed ?? false ? (
          <View style={styles.outerBorderGray}>
            <View style={styles.innerBlackCircle}>
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
            <View style={styles.innerBlackCircle}>
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
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  innerBlackCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#000",
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
