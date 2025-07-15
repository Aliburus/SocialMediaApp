import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { updateUser } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (userObj?.id || userObj?._id) {
          const id = userObj.id || userObj._id;
          setUserId(id);
          const response = await api.get(`/users/profile/${id}`);
          const profile = response.data;

          setName(profile.name || "");
          setUsername(profile.username || "");
          setBio(profile.bio || "");
          setAvatar(profile.avatar || "");
        }
      } catch (err) {
        console.error("EditProfileScreen: Error fetching profile:", err);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      // Avatar dosyası varsa FormData ile gönder
      let avatarFile = null;
      if (avatar && !avatar.startsWith("http") && avatar !== "") {
        const fileName = avatar.split("/").pop() || `avatar_${Date.now()}.jpg`;
        avatarFile = {
          uri: avatar,
          name: fileName,
          type: "image/jpeg",
        };
      }

      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("name", name);
      formData.append("username", username);
      formData.append("bio", bio);

      if (avatarFile) {
        formData.append("avatar", avatarFile as any);
      }

      const response = await api.post("/users/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = response.data;

      setName(updated.name);
      setUsername(updated.username);
      setAvatar(updated.avatar);
      setBio(updated.bio);

      updateUser({
        name: updated.name,
        username: updated.username,
        avatar: updated.avatar,
        bio: updated.bio,
      });
      showToast("✅ Profile updated successfully!", "success");
      navigation.goBack();
    } catch (err: any) {
      console.error("EditProfile: Error updating profile:", err);
      let errorMessage = "Profile update failed";

      if (err.response) {
        // Server response var
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        // Network error
        errorMessage =
          "Connection error. Please check your internet connection.";
      }

      showToast(errorMessage, "error");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showToast("You need to grant permission to select a photo", "warning");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: colors.primary }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View
          style={[styles.photoSection, { borderBottomColor: colors.border }]}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Image
              source={{
                uri:
                  avatar && avatar.startsWith("http")
                    ? avatar
                    : avatar
                    ? `${api.defaults.baseURL?.replace(/\/api$/, "")}${avatar}`
                    : "https://ui-avatars.com/api/?name=User&size=120",
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              }}
              onLoad={() => {}}
              onError={(error) =>
                console.log("EditProfileScreen: Avatar load error:", error)
              }
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 6,
                borderWidth: 2,
                borderColor: colors.background,
              }}
              onPress={pickImage}
            >
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{
              marginTop: 12,
              alignSelf: "center",
              paddingVertical: 8,
              paddingHorizontal: 24,
              borderRadius: 20,
              backgroundColor: colors.primary,
            }}
            onPress={pickImage}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a bio..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Additional Options */}
        <View
          style={[styles.optionsSection, { borderTopColor: colors.border }]}
        >
          <TouchableOpacity
            style={[styles.optionItem, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>
              Switch to Professional Account
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionItem, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>
              Personal Information Settings
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  optionsSection: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});

export default EditProfileScreen;
