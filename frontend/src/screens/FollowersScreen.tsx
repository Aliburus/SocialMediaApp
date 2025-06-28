import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { mockUsers } from "../data/mockData";

const FollowersScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const renderFollowerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => navigation.navigate("UserProfile", { user: item })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <View style={styles.usernameContainer}>
          <Text style={styles.username}>{item.username}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
          )}
        </View>
        <Text style={styles.fullName}>{item.fullName}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={styles.placeholder} />
      </View>
      <FlatList
        data={mockUsers}
        renderItem={renderFollowerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.followersList}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 24,
  },
  followersList: {
    padding: 16,
  },
  followerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  fullName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});

export default FollowersScreen;
