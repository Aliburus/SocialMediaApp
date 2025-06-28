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

const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const renderNotificationItem = ({ item }: { item: any }) => {
    const getNotificationIcon = () => {
      switch (item.type) {
        case "like":
          return <Ionicons name="heart" size={24} color="#E91E63" />;
        case "comment":
          return <Ionicons name="chatbubble" size={24} color="#2196F3" />;
        case "follow":
          return <Ionicons name="person-add" size={24} color="#4CAF50" />;
        case "mention":
          return <Ionicons name="at" size={24} color="#FF9800" />;
        default:
          return <Ionicons name="notifications" size={24} color="#666" />;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
      >
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <View style={styles.notificationText}>
            <Text style={styles.username}>{item.user.username}</Text>
            <Text style={styles.notificationMessage}> {item.text}</Text>
          </View>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Ionicons name="checkmark-done" size={24} color="#E91E63" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...styles.notificationsList,
          paddingBottom: insets.bottom + 16,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#F8F9FA",
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
    color: "#333",
  },
  notificationMessage: {
    fontSize: 16,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
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
