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
import { updateProfile, getProfile } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { updateUser } = useUser();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const userStr = await AsyncStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?.id || userObj?._id) {
        const id = userObj.id || userObj._id;
        setUserId(id);
        const profile = await getProfile(id);
        setName(profile.name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setAvatar(profile.avatar || "");
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        userId,
        name,
        username,
        avatar,
        bio,
      });
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
      Alert.alert("Başarılı", "Profil güncellendi!");
      navigation.goBack();
    } catch (err) {
      console.error("EditProfile: Error updating profile:", err);
      Alert.alert("Hata", "Profil güncellenemedi");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için izin vermelisiniz.");
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
              source={{ uri: avatar }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              }}
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
              Fotoğrafı Değiştir
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Ad Soyad</Text>
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
              placeholder="Ad Soyad"
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
