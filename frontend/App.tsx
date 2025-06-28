import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Camera") {
            iconName = focused ? "camera" : "camera-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="white" translucent={false} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
