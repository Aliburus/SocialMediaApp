import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  followUser,
  unfollowUser,
  sendFollowRequest,
  cancelFollowRequest,
  getFollowStatus,
} from "../services/followApi";
import api from "../services/api";

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  username: string;
  onStatusChange?: () => void;
  style?: any;
  size?: "small" | "medium" | "large";
}

const FollowButton: React.FC<FollowButtonProps> = ({
  currentUserId,
  targetUserId,
  username,
  onStatusChange,
  style,
  size = "medium",
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    isFollowing: false,
    isFollowedBy: false,
    isRequestedByMe: false,
    isRequestedByOther: false,
    isPrivate: false,
  });

  const updateStatus = async () => {
    try {
      const s = await getFollowStatus(currentUserId, targetUserId);
      setStatus(s);
    } catch (e) {
      // Hata yönetimi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    updateStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId]);

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (status.isPrivate) {
        await sendFollowRequest(currentUserId, targetUserId);
      } else {
        await followUser(currentUserId, targetUserId);
      }
      await updateStatus();
      onStatusChange?.();
      if (targetUserId && currentUserId) {
        api.post("/explore/track", {
          contentId: targetUserId,
          behaviorType: "follow",
        });
      }
    } catch (e) {
      // Hata yönetimi
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    Alert.alert(`Do you want to unfollow ${username}?`, "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await unfollowUser(currentUserId, targetUserId);
          await updateStatus();
          setLoading(false);
          onStatusChange?.();
        },
      },
    ]);
  };

  const handleCancelRequest = async () => {
    Alert.alert("Do you want to cancel the follow request?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await cancelFollowRequest(currentUserId, targetUserId);
          await updateStatus();
          setLoading(false);
          onStatusChange?.();
        },
      },
    ]);
  };

  // BUTON METNİ VE AKSİYON
  let buttonText = "";
  let onPress = handleFollow;

  if (loading) {
    buttonText = "";
    onPress = async () => {};
  } else if (status.isFollowing) {
    buttonText = "Following";
    onPress = handleUnfollow;
  } else if (status.isPrivate && status.isRequestedByMe) {
    buttonText = "Requested";
    onPress = handleCancelRequest;
  } else if (status.isPrivate && status.isRequestedByOther) {
    buttonText = "Pending";
    onPress = async () => {};
  } else if (!status.isFollowing && status.isFollowedBy) {
    buttonText = "Follow Back";
    onPress = handleFollow;
  } else {
    buttonText = "Follow";
    onPress = handleFollow;
  }

  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          borderRadius: 4,
        };
      case "large":
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          borderRadius: 8,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          borderRadius: 6,
        };
    }
  };
  const sizeConfig = getSizeConfig();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: status.isFollowing ? colors.surface : colors.primary,
          borderColor: status.isFollowing ? colors.border : colors.primary,
          borderWidth: 1,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
          opacity: loading || buttonText === "Pending" ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading || buttonText === "" || buttonText === "Pending"}
      activeOpacity={0.7}
    >
      {loading || buttonText === "" ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: status.isFollowing ? colors.text : colors.background,
              fontSize: sizeConfig.fontSize,
              fontWeight: "bold",
            },
          ]}
        >
          {buttonText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
});

export default FollowButton;
