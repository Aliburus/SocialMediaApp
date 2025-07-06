import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const SettingsScreen: React.FC<{ navigation: any; onLogout?: () => void }> = ({
  navigation,
  onLogout,
}) => {
  const { colors, isDark, setTheme } = useTheme();
  const [locationEnabled, setLocationEnabled] = React.useState(false);
  const [location, setLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [privateAccount, setPrivateAccount] = React.useState(false);
  const [onlyFollowersCanMessage, setOnlyFollowersCanMessage] =
    React.useState(false);

  React.useEffect(() => {
    (async () => {
      const enabled = await AsyncStorage.getItem("locationEnabled");
      setLocationEnabled(enabled === "true");
      const locStr = await AsyncStorage.getItem("userLocation");
      if (locStr) {
        try {
          setLocation(JSON.parse(locStr));
        } catch {}
      }
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setPrivateAccount(!!userObj.privateAccount);
          setOnlyFollowersCanMessage(!!userObj.onlyFollowersCanMessage);
        } catch {}
      }
    })();
  }, []);

  const handleLocationSwitch = async (v: boolean) => {
    setLocationEnabled(v);
    await AsyncStorage.setItem("locationEnabled", v ? "true" : "false");
    if (v) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let loc = await Location.getCurrentPositionAsync({});
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(coords);
        await AsyncStorage.setItem("userLocation", JSON.stringify(coords));
      } else {
        setLocation(null);
        await AsyncStorage.removeItem("userLocation");
        setLocationEnabled(false);
        await AsyncStorage.setItem("locationEnabled", "false");
      }
    } else {
      setLocation(null);
      await AsyncStorage.removeItem("userLocation");
    }
  };

  const handlePrivateSwitch = async (v: boolean) => {
    setPrivateAccount(v);
    const userStr = await AsyncStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        const response = await fetch(
          `${process.env.BACKEND_URL}/api/users/${userObj._id}/toggle-private`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );
        const result = await response.json();
        userObj.privateAccount = result.privateAccount;
        await AsyncStorage.setItem("user", JSON.stringify(userObj));
        setPrivateAccount(result.privateAccount);
      } catch (e) {
        setPrivateAccount(!v);
      }
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.item}>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Karanlık Mod
        </Text>
        <Switch
          value={isDark}
          onValueChange={() => setTheme(isDark ? "light" : "dark")}
        />
      </View>
      <View style={styles.item}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginRight: 16,
          }}
        >
          <Ionicons
            name="location-outline"
            size={28}
            color={colors.text}
            style={{ marginRight: 0 }}
          />
        </View>
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Konum Bilgisi
        </Text>
        <Switch value={locationEnabled} onValueChange={handleLocationSwitch} />
      </View>
      <View style={styles.item}>
        <Ionicons
          name={privateAccount ? "lock-closed-outline" : "lock-open-outline"}
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text, flex: 1 }]}>
          Hesap Gizliliği
        </Text>
        <Switch value={privateAccount} onValueChange={handlePrivateSwitch} />
      </View>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Archive")}
      >
        <Ionicons
          name="archive-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>Arşiv</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("NotificationSettings")}
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>
          Bildirim Ayarları
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <Ionicons
          name="key-outline"
          size={24}
          color={colors.text}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.text, { color: colors.text }]}>
          Şifre Değiştir
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.item, { justifyContent: "center" }]}
        onPress={async () => {
          await AsyncStorage.removeItem("user");
          if (onLogout) {
            onLogout();
          }
        }}
      >
        <Ionicons
          name="log-out-outline"
          size={24}
          color={colors.error}
          style={{ marginRight: 16 }}
        />
        <Text
          style={[styles.text, { color: colors.error, fontWeight: "bold" }]}
        >
          Çıkış Yap
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  text: {
    fontSize: 16,
  },
});

export default SettingsScreen;
