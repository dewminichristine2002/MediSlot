// src/screens/HomeScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Easing,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { listHealthAwareness } from "../api/healthAwareness";
import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl } from "../api/config";

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width * 0.9, 380);
const CARD_H = 270;
const AUTOPLAY_MS = 3500;

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  sub: "#475569",
  border: "#E5E7EB",
  g1: "#2563EB",
  g2: "#06B6D4",
  primary: "#2563EB",
  danger: "#FEE2E2",
};

export default function HomeScreen({ navigation }) {
  // use the whole auth object so we can call logout if provided
  const auth = useAuth();
  const { user, token, signOut } = auth || {};

  // ---- notifications state ----
  const [notifCount, setNotifCount] = useState(0);
  const pollingRef = useRef(null);
  const storageKey = user?._id ? `notif_last_seen_${user._id}` : null;
  const role = (user?.user_category || "").toLowerCase();
  const isAdmin =
    role === "admin" || role === "superadmin" || role === "manager";

  const canGoTo = useCallback(
    (routeName) => navigation.getState()?.routeNames?.includes(routeName),
    [navigation]
  );

  const goLogin = useCallback(() => {
    if (canGoTo("Login")) navigation.navigate("Login");
  }, [canGoTo, navigation]);

  const goProfile = useCallback(() => {
    if (canGoTo("Profile")) navigation.navigate("Profile");
  }, [canGoTo, navigation]);

  const markNotifSeen = useCallback(async () => {
    try {
      if (storageKey)
        await AsyncStorage.setItem(storageKey, String(Date.now()));
    } catch (e) {
      console.warn("Failed to mark notifications seen:", e?.message);
    }
  }, [storageKey]);

  const goNotifications = useCallback(async () => {
    await markNotifSeen();
    setNotifCount(0);
    if (canGoTo("Notifications")) navigation.navigate("Notifications");
  }, [markNotifSeen, canGoTo, navigation]);

  const fetchNotifCount = useCallback(async () => {
    try {
      if (!user?._id || isAdmin) {
        setNotifCount(0);
        return;
      }
      const base = getApiBaseUrl();
      const url = `${base}/api/eventLabNotifications?user_id=${user._id}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      const list = Array.isArray(items) ? items : [];

      let lastSeen = 0;
      if (storageKey) {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) lastSeen = Number(raw) || 0;
      }
      const unseen = list.filter((n) => {
        const t = n?.sent_at ? new Date(n.sent_at).getTime() : 0;
        return t > lastSeen;
      }).length;

      setNotifCount(unseen);
    } catch (e) {
      console.warn("Failed to fetch notifications:", e.message);
    }
  }, [user?._id, token, storageKey, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifCount();
      if (user && !isAdmin) {
        pollingRef.current = setInterval(fetchNotifCount, 30000);
      }
      return () => pollingRef.current && clearInterval(pollingRef.current);
    }, [fetchNotifCount, user, isAdmin])
  );

  // ---- home content state ----
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const x = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  // Fade-in on mount (banner + list)
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await listHealthAwareness();
        setItems((data || []).slice(0, 8));
      } catch (e) {
        console.warn("Home load error:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % items.length;
      scrollRef.current?.scrollToIndex({
        index: indexRef.current,
        animated: true,
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

const renderItem = ({ item }) => {
  const base = getApiBaseUrl().trim().replace(/\/$/, "");
  const thumb =
    item?.imageUrl
      ? `${base}${item.imageUrl}`
      : Array.isArray(item.photos) && item.photos[0]
      ? `${base}${item.photos[0]}`
      : null;

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("HealthAwarenessDetail", { id: item._id })
      }
      style={s.card}
    >
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={s.cardImgTop}
          resizeMode="cover"
          onError={(e) => console.log("❌ Image error:", thumb, e?.nativeEvent)}
        />
      ) : (
        <View style={[s.cardImgTop, s.cardImgPlaceholder]}>
          <Text style={{ color: "#64748b" }}>No image</Text>
        </View>
      )}

        <View style={s.cardBody}>
          <View style={s.cardTitleRow}>
            <Text numberOfLines={1} style={s.cardTitle}>
              {item.title}
            </Text>
            <SeverityBadge level={item.severity} />
          </View>
          {!!item.summary && (
            <Text numberOfLines={2} style={s.cardSummary}>
              {item.summary}
            </Text>
          )}
          <View style={s.pillsRow}>
            {!!item.category && <Pill label={item.category} />}
            {!!item.region && <Pill label={item.region} />}
          </View>
        </View>
      </Pressable>
    );
  };

  // ---- Logout handler ----
  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  }, [signOut]);
  // --- Admin UI ---
  // --- Admin UI ---
  if (user && isAdmin) {
    const initials =
      (user?.name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("") || "U";

    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Gradient header with profile + logout */}
        <LinearGradient
          colors={[C.g1, C.g2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            {/* Left: Title + subtitle */}
            <View>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>
                Admin Dashboard
              </Text>
              <Text style={{ color: "#fff", marginTop: 4 }}>
                {`Welcome ${user?.name || ""}`} •{" "}
                {user?.user_category || "Admin"}
              </Text>
            </View>

            {/* Right: Profile + Logout */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={goProfile}
                hitSlop={10}
                style={{ marginRight: 14 }}
              >
                <Ionicons name="person-circle-outline" size={28} color="#fff" />
              </Pressable>
              <Pressable onPress={handleLogout} hitSlop={10}>
                <MaterialCommunityIcons name="logout" size={26} color="#fff" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Action */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
            Quick Action
          </Text>
          <TouchableOpacity
            style={{
              alignItems: "center",
              padding: 16,
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 2,
            }}
            onPress={() => navigation.navigate("AdminScan")}
          >
            <Ionicons name="qr-code-outline" size={26} color={C.primary} />
            <Text style={{ marginTop: 8, fontWeight: "700", color: C.text }}>
              Scan QR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {/* Gradient header with right-side actions */}
      <LinearGradient
        colors={[C.g1, C.g2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>
            Welcome to{"\n"}
            <Text style={s.mediSlotTitle}>MediSlot</Text>
          </Text>

          {/* Right side: if logged in → notifications + profile + logout; else → Login */}
          {user ? (
            <View style={s.headerActions}>
              {!isAdmin && (
                <Pressable
                  onPress={goNotifications}
                  hitSlop={10}
                  style={{ marginRight: 14 }}
                >
                  <View style={s.iconWrap}>
                    <Ionicons
                      name="notifications-outline"
                      size={24}
                      color="#fff"
                    />
                    {notifCount > 0 && (
                      <View style={s.notifBadge}>
                        <Text style={s.notifBadgeText}>
                          {notifCount > 99 ? "99+" : String(notifCount)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              )}
              <Pressable
                onPress={goProfile}
                hitSlop={10}
                style={{ marginRight: 14 }}
              >
                <Ionicons name="person-circle-outline" size={26} color="#fff" />
              </Pressable>
              <Pressable onPress={handleLogout} hitSlop={10}>
                <MaterialCommunityIcons name="logout" size={24} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <TouchableOpacity onPress={goLogin} style={s.loginBtn}>
              <Text style={s.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      
    <Animated.ScrollView
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >

      {/* Vitals banner */}
      <Animated.View
        style={{ opacity: fade, transform: [{ translateY: slideY }] }}
      >
        <VitalsBanner />

      </Animated.View>

      {/* Small Intro + Booking Button */}
      <Animated.View
        style={{ opacity: fade, transform: [{ translateY: slideY }] }}
      >
        <View style={s.introWrap}>
          <Text style={s.introText}>
            Your health companion - book diagnostic tests at nearby centers with ease.
          </Text>

          <TouchableOpacity
            style={s.bookingBtn}
            onPress={() => navigation.navigate("NewBooking")}
          >
            <LinearGradient
              colors={[C.g1, C.g2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={s.bookingBtnText}>Book a Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* Section header for slider */}
      <Animated.View
        style={[
          s.sectionHeader,
          { opacity: fade, transform: [{ translateY: slideY }] },
        ]}
      >
        <Text style={s.sectionTitle}>Health Awareness</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("HealthAwarenessList")}
        >
          <Text style={s.viewAll}>View All</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slider */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slideY }] }}
        >
          <Animated.FlatList
            ref={scrollRef}
            data={items}
            keyExtractor={(i) => i._id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: (width - CARD_W) / 2 }}
            snapToInterval={CARD_W + 16}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x } } }],
              { useNativeDriver: false }
            )}
            getItemLayout={(_, index) => ({
              length: CARD_W + 16,
              offset: (CARD_W + 16) * index,
              index,
            })}
            style={{ flexGrow: 0 }}
          />
          <View style={s.dotsRow}>
            {items.map((_, i) => {
              const inputRange = [
                (CARD_W + 16) * (i - 1),
                (CARD_W + 16) * i,
                (CARD_W + 16) * (i + 1),
              ];
              const dotW = x.interpolate({
                inputRange,
                outputRange: [8, 22, 8],
                extrapolate: "clamp",
              });
              const opacity = x.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[s.dot, { width: dotW, opacity }]}
                />
              );
            })}
          </View>
        </Animated.View>
      )}
    </Animated.ScrollView>
    </View>
  );
}

/* ----------------- Vitals Banner (white card, gradients) ----------------- */
function VitalsBanner() {
  // heart pulse (pink)
  const heartScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.18,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // moving ECG bars (each bar with blue→green gradient)
  const BAR_COUNT = 28,
    BAR_MIN = 6,
    BAR_MAX = 30;
  const pattern = [0.2, 0.25, 0.3, 0.35, 0.45, 1.0, 0.45, 0.3, 0.22, 0.18];
  const bars = useRef(
    [...Array(BAR_COUNT)].map(() => new Animated.Value(BAR_MIN))
  ).current;
  const offsetRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      offsetRef.current = (offsetRef.current + 1) % 10000;
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx =
          (((i - offsetRef.current) % pattern.length) + pattern.length) %
          pattern.length;
        const factor = pattern[idx];
        const target = BAR_MIN + factor * (BAR_MAX - BAR_MIN);
        Animated.timing(bars[i], {
          toValue: target,
          duration: 110,
          useNativeDriver: false,
        }).start();
      }
    }, 110);
    return () => clearInterval(id);
  }, [bars]);

  // test-tube fill (blue→green vertical gradient)
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fill, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(fill, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  const tubeFillH = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 42],
  });

 return (
  <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
    <View style={s.banner}>
      {/* row with heart / bars / tube */}
      <View style={s.bannerRow}>
        {/* Left: pulsing heart */}
        <View style={s.bannerLeft}>
          <Animated.View
            style={[
              s.heartGlow,
              { backgroundColor: "rgba(236,72,153,0.22)", transform: [{ scale: heartScale }] },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name="heart" size={26} color="#EC4899" />
          </Animated.View>
          <Text style={[s.bannerLabel, { color: "#EC4899" }]}>Vitals</Text>
        </View>

        {/* Middle: ECG bars */}
        <View style={s.barsRow}>
          {bars.map((h, i) => (
            <View key={i} style={s.barWrap}>
              <Animated.View style={[s.bar, { height: h }]}>
                <LinearGradient
                  colors={["#06B6D4", "#10B981"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={{ flex: 1, borderRadius: 2 }}
                />
              </Animated.View>
            </View>
          ))}
        </View>

        {/* Right: lab tube */}
        <View style={s.bannerRight}>
          <MaterialCommunityIcons name="test-tube" size={20} color="#0891B2" style={{ marginBottom: 4 }} />
          <View style={s.tube}>
            <Animated.View style={{ height: tubeFillH, width: "100%" }}>
              <LinearGradient
                colors={["#06B6D4", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
              />
            </Animated.View>
          </View>
          <Text style={[s.bannerLabel, { color: "#0891B2" }]}>Lab</Text>
        </View>
      </View>

      {/* 👇 Your slogan inside the same card */}
      <Text style={s.sloganInside}>Your Health is Our Priority</Text>
    </View>
  </View>
);

}

/* ----------------- Helpers ----------------- */

function SeverityBadge({ level }) {
  const map = {
    high: { bg: "#FEE2E2", text: "#991b1b" },
    medium: { bg: "#FEF3C7", text: "#92400e" },
    info: { bg: "#DBEAFE", text: "#1e3a8a" },
  };
  const c = map[level] || { bg: "#E5E7EB", text: "#111827" };

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (level === "high") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [level]);
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.35],
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {level === "high" && (
        <Animated.View
          style={[
            s.badgeHalo,
            {
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
              backgroundColor: c.bg,
            },
          ]}
        />
      )}
      <View style={[s.badge, { backgroundColor: c.bg }]}>
        <Text style={[s.badgeTxt, { color: c.text }]}>
          {(level || "info").toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function Pill({ label }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillTxt}>{label}</Text>
    </View>
  );
}

/* ----------------- Styles ----------------- */

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    marginTop: 46,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 35,
  },
  mediSlotTitle: { fontSize: 28, fontWeight: "900", color: "#FFFFFF" },

  headerActions: { flexDirection: "row", alignItems: "center" },

  // Login pill (when logged out)
  loginBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loginBtnText: { color: C.text, fontWeight: "800" },

  /* Vitals banner (white card) */
banner: {
  width: "100%",
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 12,
  backgroundColor: "#FFFFFF",
},
bannerRow: {                 // ← NEW: was previously on banner
  flexDirection: "row",
  alignItems: "center",
},
sloganInside: { 
    fontSize: 18,
  fontWeight: "700",             // ← NEW
  marginTop: 8,
  textAlign: "center",
  fontWeight: "800",
  color: "#2563EB",          // matches your theme
},

  bannerLeft: { width: 64, alignItems: "center", justifyContent: "center" },
  bannerRight: { width: 64, alignItems: "center", justifyContent: "center" },
  heartGlow: { position: "absolute", width: 42, height: 42, borderRadius: 21 },
  bannerLabel: { fontWeight: "800", marginTop: 6 },

  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  barWrap: {
    width: 6,
    alignItems: "center",
    justifyContent: "flex-end",
    height: 36,
  },
  bar: { width: 4, borderRadius: 2, overflow: "hidden" },

  tube: {
    width: 22,
    height: 46,
    borderRadius: 6,
    backgroundColor: "rgba(2,132,199,0.08)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  // notification badge + icon positioning
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  viewAll: { color: C.primary, fontWeight: "700" },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginRight: 16,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
  },
  cardImgTop: { width: "100%", height: 150, backgroundColor: "#EEF2FF" },
  cardImgPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 12 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: C.text,
    fontWeight: "900",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  cardSummary: { color: "#334155", marginTop: 6 },
  pillsRow: { flexDirection: "row", gap: 8, marginTop: 10 },

  pill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillTxt: { color: "#1E3A8A" },

  badgeHalo: { position: "absolute", width: 38, height: 26, borderRadius: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { fontWeight: "700", fontSize: 12 },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    height: 8,
    borderRadius: 999,
    backgroundColor: C.primary,
    marginHorizontal: 4,
  },

  notifBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  notifBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
introWrap: {
  paddingHorizontal: 18,
  paddingVertical: 16,
  marginTop: 14,
  marginBottom: 12,
  marginHorizontal: 16,
  backgroundColor: "#ffffff",
  borderRadius: 14,
  elevation: 3, // Android shadow
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
},

  introText: {
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
  },

bookingBtn: {
  alignSelf: "center",
  width: "75%",      // keep button nicely centered
  borderRadius: 10,
  overflow: "hidden",
},

  bookingBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },



});
