import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { UserProvider, useUser } from "./src/context/UserContext";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  LogBox,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "./src/services/api";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import socketService from "./src/services/socketService";
import { getUnreadMessageCount } from "./src/services/messageApi";
import { getUnreadNotificationCount } from "./src/services/notificationApi";
import { getUnreadMessageCount as oldGetUnreadMessageCount } from "./src/services/messageApi";
import { getUnreadNotificationCount as oldGetUnreadNotificationCount } from "./src/services/notificationApi";

// StatusBar uyarılarını kapat
LogBox.ignoreLogs([
  "StatusBar backgroundColor is not supported with edge-to-edge enabled",
  "StatusBar is always translucent when edge-to-edge is enabled",
]);

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import FollowersScreen from "./src/screens/FollowersScreen";
import FollowingScreen from "./src/screens/FollowingScreen";
import CommentScreen from "./src/screens/CommentScreen";
import StoryScreen from "./src/screens/StoryScreen";
import DMListScreen from "./src/screens/DMListScreen";
import DMChatScreen from "./src/screens/DMChatScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import AddStoryScreen from "./src/screens/AddStoryScreen";
import ReelDetailScreen from "./src/screens/ReelDetailScreen";
import SavedDetailScreen from "./src/screens/SavedDetailScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AddPostScreen from "./src/screens/AddPostScreen";
import UserSearchScreen from "./src/screens/UserSearchScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import ArchiveScreen from "./src/screens/ArchiveScreen";
import NotificationSettingsScreen from "./src/screens/NotificationSettingsScreen";
import MapScreen from "./src/screens/MapScreen";
import ChatHistoryScreen from "./src/screens/ChatHistoryScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Okunmamış mesaj sayısını getir
  const fetchUnreadCount = async () => {
    try {
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        if (userId) {
          // Lazy import - performans için
          const api = await import("./src/services/api");
          const data = await api.getUnreadMessageCount(userId);
          setUnreadMessageCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Unread count fetch error:", error);
      // Hata durumunda 0 olarak ayarla
      setUnreadMessageCount(0);
    }
  };

  // Okunmamış bildirim sayısını getir
  const fetchUnreadNotifCount = async () => {
    try {
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        if (userId) {
          const api = await import("./src/services/api");
          const data = await api.getUnreadNotificationCount(userId);
          setUnreadNotifCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Unread notification count fetch error:", error);
      // Hata durumunda 0 olarak ayarla
      setUnreadNotifCount(0);
    }
  };

  // Socket event listener'ı
  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id;
      socketService.onUnreadCountUpdate((data) => {
        if (data.userId === userId) {
          setUnreadMessageCount(data.unreadCount);
        }
      });

      // İlk yükleme - geciktirilmiş (performans için)
      const timer1 = setTimeout(() => {
        fetchUnreadCount();
      }, 1000);
      const timer2 = setTimeout(() => {
        fetchUnreadNotifCount();
      }, 1200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        socketService.off("unread_count_update");
      };
    }

    return () => {
      socketService.off("unread_count_update");
    };
  }, [user]);

  const handleProfileLongPress = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("user");
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "AddPost") {
            return (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 32,
                  alignSelf: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            );
          } else if (route.name === "Map") {
            iconName = focused ? "location" : "location-outline";
          } else if (route.name === "Profile") {
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={handleProfileLongPress}
              >
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      "https://ui-avatars.com/api/?name=User&background=007AFF&color=fff",
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: focused ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                />
              </TouchableOpacity>
            );
          } else if (route.name === "DMList") {
            return null;
          } else if (route.name === "Notifications") {
            return null;
          } else {
            iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: "transparent",
          borderTopColor: "transparent",
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        },
        headerShown: route.name === "Home",
        headerTitle: () => null,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerRight: () =>
          route.name === "Home" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              {/* DM İkonu */}
              <TouchableOpacity
                style={{ position: "relative", marginRight: 16 }}
                onPress={() => navigation.navigate("DMList")}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={28}
                  color={colors.text}
                />
                {unreadMessageCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      backgroundColor: "red",
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Bildirim (Kalp) İkonu */}
              <TouchableOpacity
                style={{ position: "relative" }}
                onPress={() => {
                  navigation.navigate("Notifications");
                  setUnreadNotifCount(0);
                }}
              >
                <Ionicons name="heart-outline" size={28} color={colors.text} />
                {unreadNotifCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      backgroundColor: "red",
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : null,
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeScreen
            unreadMessageCount={unreadMessageCount}
            unreadNotifCount={unreadNotifCount}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{ tabBarLabel: "" }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "location" : "location-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: "Konum",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={{
                uri:
                  user?.avatar ||
                  "https://ui-avatars.com/api/?name=User&background=007AFF&color=fff",
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: focused ? 2 : 0,
                borderColor: colors.primary,
              }}
            />
          ),
          tabBarLabel: "Profil",
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        setIsLoggedIn(!!user);
      } catch (e) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async (userData: any = null) => {
    let user = userData || {};
    // Avatarı eksikse profilden çek
    if (!user.avatar && (user.id || user._id)) {
      try {
        const profile = await getProfile(user.id || user._id);
        user.avatar = profile.avatar;
      } catch {}
    }
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setIsLoggedIn(true);

    // Socket.io bağlantısı
    if (user.id || user._id) {
      socketService.connect(user.id || user._id);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setIsLoggedIn(false);

    // Socket.io bağlantısını kapat
    socketService.disconnect();
  };

  if (loading) {
    return null; // veya bir loading spinner
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: colors.background,
            },
          }}
        >
          {showRegister ? (
            <RegisterScreen onGoToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginScreen
              onLogin={handleLogin}
              onGoToRegister={() => setShowRegister(true)}
            />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
          },
        }}
      >
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={colors.background}
          translucent={false}
        />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs">
            {() => <MainTabs onLogout={handleLogout} />}
          </Stack.Screen>
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Followers" component={FollowersScreen} />
          <Stack.Screen name="Following" component={FollowingScreen} />
          <Stack.Screen name="Comment" component={CommentScreen} />
          <Stack.Screen name="Story" component={StoryScreen} />
          <Stack.Screen name="DMList" component={DMListScreen} />
          <Stack.Screen name="DMChat" component={DMChatScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="AddStory" component={AddStoryScreen} />
          <Stack.Screen name="ReelDetail" component={ReelDetailScreen} />
          <Stack.Screen name="SavedDetail" component={SavedDetailScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="UserSearchScreen" component={UserSearchScreen} />
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} onLogout={handleLogout} />}
          </Stack.Screen>
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
          <Stack.Screen name="Archive" component={ArchiveScreen} />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
          />
          <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
