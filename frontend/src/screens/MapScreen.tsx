import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import Slider from "@react-native-community/slider";
import { useUser } from "../context/UserContext";
import * as FileSystem from "expo-file-system";
import vpnDetectionService from "../services/vpnDetection";

const getLeafletHtml = (
  lat: number,
  lng: number,
  showUser: boolean,
  others: any[] = [],
  avatarUrl?: string,
  userGender?: string,
  isDarkMode?: boolean,
  radiusKm?: number
) => {
  // Kendi marker'ı için
  let userMarker = "";
  const minRadius = 5;
  const usedRadius = Math.max(radiusKm || 10, minRadius);
  if (showUser) {
    const genderClass =
      userGender === "female"
        ? "female"
        : userGender === "male"
        ? "male"
        : "unknown";
    const hasPp = !!avatarUrl;
    let userHtml = "";
    if (hasPp) {
      userHtml = `<img class="custom-marker-img ${genderClass}" src="${avatarUrl}" />`;
    } else {
      userHtml = `<div class="custom-marker-initial ${genderClass}">${"U"}</div>`;
    }
    userMarker = `var myIcon = L.divIcon({ html: '<div class="custom-marker">${userHtml}<div class="custom-marker-pointer ${genderClass}"></div></div>', iconSize: [48, 56], iconAnchor: [24, 56], className: '' }); var center = [${lat}, ${lng}]; var circle = L.circle(center, {radius: ${
      (usedRadius * 1000) / 2
    }, color: 'red', fillColor: 'red', fillOpacity: 0.08, weight: 1}).addTo(map); L.marker(center, {icon: myIcon}).addTo(map); map.setView(center, 13); map.fitBounds(circle.getBounds(), {padding: [40,40]});`;
  }
  // Diğer kullanıcılar için
  let othersMarkers = others
    .map((u) => {
      const otherGenderClass =
        u.gender === "female"
          ? "female"
          : u.gender === "male"
          ? "male"
          : "unknown";
      const hasPp = !!u.avatarUrl;
      let otherHtml = "";
      if (hasPp) {
        otherHtml = `<img class=\"custom-marker-img ${otherGenderClass}\" src=\"${u.avatarUrl}\" />`;
      } else {
        otherHtml = `<div class=\"custom-marker-initial ${otherGenderClass}\">${u.username
          .charAt(0)
          .toUpperCase()}</div>`;
      }
      return `var otherIcon = L.divIcon({ html: '<div class=\"custom-marker\">${otherHtml}<div class=\"custom-marker-pointer ${otherGenderClass}\"></div></div>', iconSize: [48, 56], iconAnchor: [24, 56], className: '' }); var marker = L.marker([${u.lat}, ${u.lng}], {icon: otherIcon}).addTo(map); marker.on('click', function() { window.ReactNativeWebView && window.ReactNativeWebView.postMessage && window.ReactNativeWebView.postMessage('${u.username}'); });`;
    })
    .join("\n");
  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttr = isDarkMode
    ? '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    : "&copy; OpenStreetMap contributors";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
    body { background: ${isDarkMode ? "#181A20" : "#fff"}; }
    .custom-marker {
      position: relative;
      width: 48px;
      height: 56px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .custom-marker-img {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      border-width: 2px;
      object-fit: cover;
      background: #fff;
      z-index: 2;
      border: 2px solid #4F8EF7;
    }
    .custom-marker-img.female {
      border: 2px solid #FF69B4;
    }
    .custom-marker-img.male {
      border: 2px solid #4F8EF7;
    }
    .custom-marker-img.unknown {
      border: 2px solid #333;
    }
    .custom-marker-img.female.nopp {
      background: #FF69B4;
      border: 2px solid #FF69B4;
    }
    .custom-marker-img.male.nopp {
      background: #4F8EF7;
      border: 2px solid #4F8EF7;
    }
    .custom-marker-img.unknown.nopp {
      background: #333;
      border: 2px solid #333;
    }
    .custom-marker-pointer {
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 16px solid #4F8EF7;
      margin-top: -2px;
      z-index: 1;
    }
    .custom-marker-pointer.female {
      border-top-color: #FF69B4;
    }
    .custom-marker-pointer.male {
      border-top-color: #4F8EF7;
    }
    .custom-marker-pointer.unknown {
      border-top-color: #333;
    }
    .custom-marker-initial {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      font-size: 20px;
      border: 2px solid;
    }
    .custom-marker-initial.female {
      background: #FF69B4;
      border-color: #FF69B4;
    }
    .custom-marker-initial.male {
      background: #4F8EF7;
      border-color: #4F8EF7;
    }
    .custom-marker-initial.unknown {
      background: #333;
      border-color: #333;
    }
    .leaflet-control-zoom {
      top: 16px !important;
      left: 16px !important;
      box-shadow: none;
      border: none;
      background: transparent;
    }
    .leaflet-control-zoom-in,
    .leaflet-control-zoom-out {
      width: 44px;
      height: 44px;
 
      background: rgba(255,255,255,0.82) !important;
      color: #222 !important;
      border: 1.5px solid #eee !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      font-size: 1.7rem !important;
    
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.18s, box-shadow 0.18s, color 0.18s;
    }
    .leaflet-control-zoom-in:hover,
    .leaflet-control-zoom-out:hover {
      background: rgba(255,255,255,0.95) !important;
      color: #007AFF !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.13);
    }
    .leaflet-control-zoom-in:active,
    .leaflet-control-zoom-out:active {
      background: #007AFF !important;
      color: #fff !important;
      border-color: #007AFF !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 13);
    L.tileLayer('${tileUrl}', {
      attribution: '${tileAttr}'
    }).addTo(map);
    ${userMarker}
    ${othersMarkers}
  </script>
</body>
</html>
`;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MapScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [html, setHtml] = useState<string>("");
  const [permission, setPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [radiusFilter, setRadiusFilter] = useState(10);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const insets = useSafeAreaInsets();
  const [pendingGenderFilter, setPendingGenderFilter] = useState<string | null>(
    null
  );
  const [pendingRadiusFilter, setPendingRadiusFilter] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [vpnChecking, setVpnChecking] = useState(true);
  const [vpnError, setVpnError] = useState<string | null>(null);

  // Filtreleri AsyncStorage'dan yükle
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedGenderFilter = await AsyncStorage.getItem("mapGenderFilter");
        const savedRadiusFilter = await AsyncStorage.getItem("mapRadiusFilter");

        if (savedGenderFilter) {
          setGenderFilter(
            savedGenderFilter === "null" ? null : savedGenderFilter
          );
        }
        if (savedRadiusFilter) {
          setRadiusFilter(parseInt(savedRadiusFilter, 10));
        }
      } catch (error) {
        console.error("Filtre yükleme hatası:", error);
      }
    };

    loadFilters();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let interval: NodeJS.Timeout | undefined;
      (async () => {
        // VPN kontrolü yap
        await checkVPNStatus(false); // İlk yüklemede cache kullan
        if (vpnBlocked) return;

        // MOCK DATA: Pendik/Güzelyalı'da konumu açık bir kullanıcı
        const mockNearby: any[] = [
          {
            lat: 40.8706,
            lng: 29.2672,
            username: "guzelyali_user",
            gender: "female",
            avatarUrl:
              "https://ui-avatars.com/api/?name=G&background=4F8EF7&color=fff",
            locationTimestamp: Date.now(),
          },
        ];
        await AsyncStorage.setItem(
          "nearbyLocations",
          JSON.stringify(mockNearby)
        );
        const locationSetting = await AsyncStorage.getItem("locationEnabled");
        setLocationEnabled(locationSetting === "true");
        let avatarUrl = undefined;
        let username = undefined;
        let userGender = undefined;
        // UserContext'ten kullanıcı bilgilerini al
        avatarUrl = user?.avatar;
        username = user?.username;
        userGender = user?.gender;
        setIsPlusUser(!!user?.isPlusUser);

        // Local dosya URL'sini base64'e çevir (WebView için)
        if (avatarUrl && avatarUrl.startsWith("file://")) {
          try {
            const base64 = await FileSystem.readAsStringAsync(avatarUrl, {
              encoding: FileSystem.EncodingType.Base64,
            });
            avatarUrl = `data:image/jpeg;base64,${base64}`;
          } catch (error) {
            console.error(
              "MapScreen: Error converting avatar to base64:",
              error
            );
          }
        }
        if (typeof window !== "undefined") (window as any).username = username;
        if (locationSetting === "true") {
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== "granted") {
            setPermission("denied");
            setHtml("");
            return;
          }
          setPermission("granted");
          let locStr = await AsyncStorage.getItem("userLocation");
          let coords = null;
          if (!locStr) {
            let loc = await Location.getCurrentPositionAsync({});
            coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            await AsyncStorage.setItem("userLocation", JSON.stringify(coords));
          } else {
            try {
              coords = JSON.parse(locStr);
            } catch {}
          }
          let others: any[] = [];
          try {
            const othersStr = await AsyncStorage.getItem("nearbyLocations");
            if (othersStr) others = JSON.parse(othersStr);
          } catch {}
          // radiusFilter km çapındaki kullanıcıları filtrele
          if (coords) {
            const now = Date.now();
            const filteredOthers = others.filter(
              (u: any) =>
                haversine(coords.lat, coords.lng, u.lat, u.lng) <=
                  radiusFilter / 2 &&
                u.locationTimestamp &&
                now - u.locationTimestamp <= 25 * 60 * 1000 &&
                (!genderFilter || u.gender === genderFilter)
            );
            setHtml(
              getLeafletHtml(
                coords.lat,
                coords.lng,
                true,
                filteredOthers,
                avatarUrl,
                userGender,
                colorScheme === "dark",
                radiusFilter / 2
              )
            );
          } else {
            setHtml(
              getLeafletHtml(
                41.0082,
                28.9784,
                false,
                [],
                undefined,
                undefined,
                colorScheme === "dark",
                10
              )
            );
          }
          // 5 dakikada bir konum güncelle
          interval = setInterval(async () => {
            let loc = await Location.getCurrentPositionAsync({});
            const coords = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            };
            await AsyncStorage.setItem("userLocation", JSON.stringify(coords));
            setHtml(
              getLeafletHtml(
                coords.lat,
                coords.lng,
                true,
                others,
                avatarUrl,
                userGender,
                colorScheme === "dark",
                10
              )
            );
          }, 5 * 60 * 1000);
        } else {
          setPermission("denied");
          setHtml("");
        }
      })();
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [navigation, colorScheme, genderFilter, radiusFilter, vpnBlocked])
  );

  useEffect(() => {
    if (filterModalVisible) {
      setPendingGenderFilter(genderFilter);
      setPendingRadiusFilter(radiusFilter);
    }
  }, [filterModalVisible]);

  // Tab'a basıldığında refresh
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshing(true);
      // Map için konum izinlerini tekrar kontrol et
      setPermission("unknown");
      setLocationEnabled(false);
      setTimeout(() => setRefreshing(false), 500);
    });
    return unsubscribe;
  }, [navigation]);

  const checkVPNStatus = async (clearCache = false) => {
    try {
      setVpnChecking(true);
      setVpnError(null);
      if (clearCache) {
        await vpnDetectionService.clearCache();
      }
      const vpnResult = await vpnDetectionService.checkVPNStatus();
      if (vpnResult.isVPN) {
        setVpnBlocked(true);
        setVpnError(null);
        Alert.alert(
          "VPN Tespit Edildi",
          `Güvenlik nedeniyle ${
            vpnResult.provider || "VPN"
          } kullanımı engellenmiştir. Lütfen VPN'i kapatıp tekrar deneyin.`,
          [
            {
              text: "Tamam",
              onPress: () => {
                (navigation as any).navigate("Home");
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        setVpnBlocked(false);
        setVpnError(null);
      }
    } catch (error) {
      // VPN tespit hatası durumunda sessizce devam et, hata mesajı gösterme
      setVpnBlocked(false);
      setVpnError(null);
    } finally {
      setVpnChecking(false);
    }
  };

  const handleAllowLocation = async () => {
    // Önce VPN kontrolü yap
    await checkVPNStatus(true); // Cache'i temizle
    if (vpnBlocked) return;

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      let loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      await AsyncStorage.setItem("locationEnabled", "true");
      await AsyncStorage.setItem("userLocation", JSON.stringify(coords));
      setLocationEnabled(true);
      setPermission("granted");

      let userGender = undefined;
      try {
        const userStr = await AsyncStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : null;
        userGender = userObj?.gender;
      } catch {}

      setHtml(
        getLeafletHtml(
          coords.lat,
          coords.lng,
          true,
          [],
          undefined,
          userGender,
          colorScheme === "dark",
          10
        )
      );
    }
  };

  const applyFilters = async () => {
    setGenderFilter(pendingGenderFilter);
    setRadiusFilter(pendingRadiusFilter);

    // Filtreleri AsyncStorage'a kaydet
    try {
      await AsyncStorage.setItem(
        "mapGenderFilter",
        pendingGenderFilter || "null"
      );
      await AsyncStorage.setItem(
        "mapRadiusFilter",
        pendingRadiusFilter.toString()
      );
    } catch (error) {
      console.error("Filtre kaydetme hatası:", error);
    }

    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Sağ üstte filtre butonu */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(0,0,0,0.18)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Filtre modalı */}
      <Modal
        isVisible={filterModalVisible}
        onBackdropPress={() => setFilterModalVisible(false)}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Filtrele
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
            Cinsiyet
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 16,
              }}
              onPress={() => setPendingGenderFilter("male")}
            >
              <Ionicons
                name={
                  pendingGenderFilter === "male"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={colors.primary}
              />
              <Text style={{ color: colors.text, marginLeft: 6 }}>Erkek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 16,
              }}
              onPress={() => setPendingGenderFilter("female")}
            >
              <Ionicons
                name={
                  pendingGenderFilter === "female"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={colors.primary}
              />
              <Text style={{ color: colors.text, marginLeft: 6 }}>Kadın</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => setPendingGenderFilter(null)}
            >
              <Ionicons
                name={
                  pendingGenderFilter === null
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={colors.primary}
              />
              <Text style={{ color: colors.text, marginLeft: 6 }}>
                Farketmez
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
            Çap (km)
          </Text>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Slider
              style={{ width: 220, height: 40 }}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={pendingRadiusFilter}
              onValueChange={setPendingRadiusFilter}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={{ color: colors.text, fontSize: 16, marginTop: 4 }}>
              {pendingRadiusFilter} km
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 14,
              marginTop: 16,
            }}
            onPress={applyFilters}
          >
            <Text
              style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
            >
              Filtreyi Uygula
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {vpnChecking ? (
        <View style={styles.center}>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Güvenlik kontrolü yapılıyor...
          </Text>
        </View>
      ) : vpnBlocked ? (
        <View style={styles.center}>
          <Ionicons
            name="shield-checkmark"
            size={64}
            color={colors.error || "#ff4444"}
            style={{ marginBottom: 24 }}
          />
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              textAlign: "center",
              marginBottom: 16,
              fontWeight: "bold",
            }}
          >
            VPN Tespit Edildi
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {vpnError
              ? vpnError
              : `Güvenlik nedeniyle VPN/proxy kullanımı engellenmiştir.\nLütfen VPN'i kapatıp tekrar deneyin.`}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
            onPress={async () => {
              setVpnBlocked(false);
              setVpnError(null);
              await checkVPNStatus(true);
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Tekrar Dene
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => (navigation as any).navigate("Home")}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "bold",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Ana Sayfaya Dön
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {vpnError && (
            <View
              style={{
                backgroundColor: colors.warning,
                padding: 12,
                margin: 12,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                {vpnError}
              </Text>
            </View>
          )}
          {permission !== "granted" || !locationEnabled ? (
            <View style={styles.center}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Konum izni vermeden haritayı görüntüleyemezsin.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 12,
                }}
                onPress={handleAllowLocation}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Konum İzni Ver
                </Text>
              </TouchableOpacity>
            </View>
          ) : html ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback
              startInLoadingState
              onMessage={(event) => {
                const username = event.nativeEvent.data;
                if (username) {
                  (navigation as any).navigate("UserProfile", {
                    user: { username },
                  });
                }
              }}
            />
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});

export default MapScreen;
