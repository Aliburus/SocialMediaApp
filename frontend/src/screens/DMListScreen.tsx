import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserConversations, getUserFriends } from "../services/api";

const DMListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [dmList, setDmList] = React.useState<any[]>([]);
  const [showFriendsModal, setShowFriendsModal] = React.useState(false);
  const [friendSearch, setFriendSearch] = React.useState("");
  const [friends, setFriends] = React.useState<any[]>([]);
  const filteredFriends = friends.filter((u) =>
    u.username.toLowerCase().includes(friendSearch.toLowerCase())
  );
  const loadConversations = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?._id || userObj?.id) {
        const list = await getUserConversations(userObj._id || userObj.id);
        const filtered = list.filter(
          (item: any) => item.lastMessage && item.lastMessage.trim() !== ""
        );
        setDmList(filtered);
      }
    } catch (error) {
      console.error("DM listesi yükleme hatası:", error);
    }
  };

  React.useEffect(() => {
    loadConversations();
  }, []);

  // Ekran odaklandığında listeyi yenile
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadConversations();
    });
    return unsubscribe;
  }, [navigation]);
  React.useEffect(() => {
    if (showFriendsModal) {
      (async () => {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?._id || userObj?.id) {
          const list = await getUserFriends(userObj._id || userObj.id);
          setFriends(list);
        }
      })();
    }
  }, [showFriendsModal]);
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.dmItem, { borderBottomColor: colors.border }]}
      onPress={() => navigation.navigate("DMChat", { user: item.user })}
    >
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
      <View style={styles.dmInfo}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.user.username}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {item.time ? new Date(item.time).toLocaleDateString() : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      {/* Üst bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, flex: 1, textAlign: "left" },
          ]}
        >
          Direct
        </Text>
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={() => setShowFriendsModal(true)}
        >
          <Ionicons name="create-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* DM Listesi */}
      {dmList.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Henüz mesajlaşman yok
          </Text>
        </View>
      ) : (
        <FlatList
          data={dmList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item._id || item.username}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 8,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
      {/* Arkadaşlar Modalı */}
      {showFriendsModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              width: "90%",
              maxHeight: "80%",
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  color: colors.text,
                  fontSize: 16,
                  height: 40,
                }}
                placeholder="Arkadaş ara..."
                placeholderTextColor={colors.textSecondary}
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
              <TouchableOpacity
                onPress={() => setShowFriendsModal(false)}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id || item._id || item.username}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setShowFriendsModal(false);
                    setTimeout(() => {
                      navigation.navigate("DMChat", { user: item });
                    }, 0);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                  }}
                >
                  <Image
                    source={{ uri: item.avatar }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 12,
                    }}
                  />
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {item.username}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  Arkadaş bulunamadı
                </Text>
              }
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 8,
  },
  dmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  dmInfo: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default DMListScreen;
