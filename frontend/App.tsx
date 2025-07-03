import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import {
  Text,
  Platform,
  View,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import CameraScreen from "./src/screens/CameraScreen";
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const { colors, isDark } = useTheme();
  const [userAvatar, setUserAvatar] = useState<string>("");

  useEffect(() => {
    const getUserAvatar = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?.avatar) {
          setUserAvatar(userObj.avatar);
        } else {
          setUserAvatar("");
        }
      } catch (err) {
        setUserAvatar("");
      }
    };
    getUserAvatar();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const getUserAvatar = async () => {
        try {
          const userStr = await AsyncStorage.getItem("user");
          const userObj = userStr ? JSON.parse(userStr) : null;
          if (userObj?.avatar) {
            setUserAvatar(userObj.avatar);
          } else {
            setUserAvatar("");
          }
        } catch (err) {
          setUserAvatar("");
        }
      };
      getUserAvatar();
    }, [])
  );

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
                  marginBottom: 24,
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
          } else if (route.name === "Camera") {
            iconName = focused ? "camera" : "camera-outline";
          } else if (route.name === "Profile") {
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={handleProfileLongPress}
              >
                <Image
                  source={{
                    uri:
                      userAvatar ||
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
          } else {
            iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
        },
        headerShown: false,
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
            <Ionicons
              name="paper-plane-outline"
              size={28}
              color={colors.text}
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("DMList")}
            />
          ) : null,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{ tabBarLabel: "" }}
      />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={{
                uri:
                  userAvatar ||
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
    await AsyncStorage.setItem("user", JSON.stringify(userData || {}));
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setIsLoggedIn(false);
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
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
          <Stack.Screen name="Archive" component={ArchiveScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
