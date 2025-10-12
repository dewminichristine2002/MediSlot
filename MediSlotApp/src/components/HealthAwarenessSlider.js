import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listHealthAwareness } from "../api/healthAwareness";
import { getApiBaseUrl } from "../api/config";

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width, 380);

// ✅ Fixed: absolute URL builder (no spaces, no duplicate slashes)
const toAbsolute = (u) => {
  if (!u) return null;
  const base = getApiBaseUrl().trim().replace(/\/$/, "");
  return u.startsWith("/") ? `${base}${u}` : u;
};

// ✅ Pick image from available shapes
const pickImg = (item) => {
  const raw =
    item?.imageUrl || // new field
    (Array.isArray(item?.photos) && item.photos[0]) || // old field
    item?.imageURL || // stray casing
    null;
  return raw ? toAbsolute(raw) : null;
};

export default function HealthAwarenessSlider() {
  const [items, setItems] = useState([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      try {
        const data = await listHealthAwareness({ limit: 10 });
        const withImg = (data || []).filter((x) => !!pickImg(x));
        const withoutImg = (data || []).filter((x) => !pickImg(x));
        setItems([...withImg, ...withoutImg]);

        // ✅ Debug log
        [...withImg].slice(0, 3).forEach((it) => {
          console.log("🖼️ SLIDER IMG URL:", it._id, pickImg(it));
        });
      } catch (e) {
        console.warn("Slider load error:", e?.message);
      }
    })();
  }, []);

  const renderItem = ({ item }) => {
    const img = pickImg(item);
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate("HealthAwarenessDetail", { id: item._id })
        }
      >
        {img ? (
          <Image
            source={{ uri: img }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) =>
              console.log("❌ Image load error:", img, e?.nativeEvent)
            }
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ color: "#64748b" }}>No image</Text>
          </View>
        )}

        <View style={styles.textWrap}>
          {!!item.title && (
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
          )}
          {!!item.summary && (
            <Text numberOfLines={2} style={styles.summary}>
              {item.summary}
            </Text>
          )}
          <View style={styles.tagsRow}>
            {!!item.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.category}</Text>
              </View>
            )}
            {!!item.region && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.region}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.sliderWrap}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(x, i) => x._id || String(i)}
        horizontal
        pagingEnabled
        snapToInterval={CARD_W}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({
          length: CARD_W,
          offset: CARD_W * i,
          index: i,
        })}
        contentContainerStyle={{ paddingHorizontal: (width - CARD_W) / 2 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        removeClippedSubviews={false}
      />
      <View style={styles.dots}>
        {items.map((_, i) => {
          const inputRange = [(i - 1) * CARD_W, i * CARD_W, (i + 1) * CARD_W];
          const dotW = scrollX.interpolate({
            inputRange,
            outputRange: [8, 18, 8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotW, opacity }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrap: { marginTop: 8 },
  card: {
    width: CARD_W,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 12,
  },
  image: { width: "100%", height: 160, backgroundColor: "#eef2ff" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  textWrap: { padding: 12, gap: 6 },
  title: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  summary: { color: "#475569" },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: {
    backgroundColor: "#e6f0ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, color: "#1e40af" },
  dots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
  },
  dot: { height: 8, borderRadius: 8, backgroundColor: "#93c5fd" },
});
