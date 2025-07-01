import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { mockNotifications } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";

const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const renderNotificationItem = ({ item }: { item: any }) => {
    const getNotificationIcon = () => {
      switch (item.type) {
        case "like":
          return <Ionicons name="heart" size={24} color={colors.primary} />;
        case "comment":
          return <Ionicons name="chatbubble" size={24} color={colors.info} />;
        case "follow":
          return (
            <Ionicons name="person-add" size={24} color={colors.success} />
          );
        case "mention":
          return <Ionicons name="at" size={24} color={colors.warning} />;
        default:
          return (
            <Ionicons
              name="notifications"
              size={24}
              color={colors.textSecondary}
            />
          );
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && [
            styles.unreadNotification,
            { backgroundColor: colors.surface },
          ],
          { backgroundColor: colors.background },
        ]}
      >
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <View style={styles.notificationText}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.user.username}
            </Text>
            <Text style={[styles.notificationMessage, { color: colors.text }]}>
              {" "}
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        <View style={styles.notificationIcon}>{getNotificationIcon()}</View>
        {item.post && (
          <Image
            source={{ uri: item.post.image }}
            style={styles.postThumbnail}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <TouchableOpacity>
          <Ionicons name="checkmark-done" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...styles.notificationsList,
          paddingBottom: 16,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  unreadNotification: {
    // backgroundColor will be set dynamically
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
    fontSize: 16,
  },
  notificationMessage: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  notificationIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  postThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
});

export default NotificationsScreen;
