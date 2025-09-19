// src/screens/ProfileScreen.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy'; // ← legacy API to avoid deprecation alert
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from '../api/config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const C = {
  bg: '#F5F7FB',
  card: '#FFFFFF',
  border: '#E6EAF2',
  text: '#0F172A',
  sub: '#6B7280',
  primary: '#2563EB',
  primarySoft: '#E8F0FE',
  success: '#10B981',
  info: '#3B82F6',
  danger: '#EF4444',
  warn: '#F59E0B',
  chipBg: '#F1F5F9',
  chipText: '#334155',
};

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showRegs, setShowRegs] = useState(false);
  const [showLab, setShowLab] = useState(false);
  const [now, setNow] = useState(new Date()); // ⏰ current date/time
  const scrollRef = useRef(null);

  useEffect(() => {
    if (route?.params?.openLab) {
      setShowLab(true);
      setTimeout(() => {
        try {
          scrollRef.current?.scrollToEnd({ animated: true });
        } catch {}
      }, 200);
    }
  }, [route?.params?.openLab]);

  // Tick every minute to keep the time fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Greeting based on hour
  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Nicely formatted date/time
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const initials =
    (user?.name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <View style={styles.screen}>
      {/* Gradient header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {/* 👋 Greeting + date/time */}
            <Text style={styles.title}>
              {getGreeting()}, {user?.name || 'User'}!
            </Text>
            <Text style={styles.subTitle}>
              {dateStr} • {timeStr}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.user_category || 'User'}</Text>
            </View>
          </View>
        </View>

        {/* ✅ Compact profile details (slim rows) */}
        <View style={styles.kvGrid}>
          <KV label="Name" value={user?.name || '-'} />
          <KV label="Email" value={user?.email || '-'} />
          <KV label="Phone" value={user?.contact_no || '-'} />
          <KV label="Address" value={user?.address || '-'} last />
        </View>

        {/* Segmented toggle */}
        <View style={styles.segment}>
          <SegmentButton
            active={showRegs}
            label="Event Registrations"
            onPress={() => {
              setShowRegs((v) => !v);
              if (!showRegs && showLab) setShowLab(false);
            }}
          />
          <SegmentButton
            active={showLab}
            label="Lab Test Results"
            onPress={() => {
              setShowLab((v) => !v);
              if (!showLab && showRegs) setShowRegs(false);
            }}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingTop: 0 }}
      >
        {showRegs && <MyEventRegs />}
        {showLab && <MyLabTestResults />}
      </ScrollView>
    </View>
  );
}

/* --- Compact key–value row component (ONLY change in profile details) --- */
function KV({ label, value, last }) {
  return (
    <View style={[styles.kvRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.kKey}>{label}</Text>
      <Text style={styles.kVal} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* Segmented buttons */
function SegmentButton({ active, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.segmentBtn,
        active && { backgroundColor: C.card, borderColor: C.primary, ...shadow(8) },
      ]}
    >
      <Text style={[styles.segmentText, active && { color: C.primary, fontWeight: '800' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ------------------ Event Registrations ------------------ */
function MyEventRegs() {
  const { user } = useAuth();
  const patientId = user?._id;

  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState([]);

  const sortByUpcomingFirst = (arr) => {
    const items = Array.isArray(arr) ? [...arr] : [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];
    const noDate = [];

    for (const it of items) {
      const d = it?.event_date ? new Date(it.event_date) : null;
      if (!d || isNaN(d.getTime())) noDate.push(it);
      else if (d >= todayStart) upcoming.push(it);
      else past.push(it);
    }

    upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    return [...upcoming, ...past, ...noDate];
  };

  const refresh = async () => {
    try {
      const t = await AsyncStorage.getItem('token');
      if (!t) throw new Error('No token');

      const url = `${getApiBaseUrl()}/api/event-registrations/events-by-user/me?when=all&page=1&limit=50&sort=event.date&order=desc`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const sorted = sortByUpcomingFirst(items);
      setRegs(sorted);
      await AsyncStorage.setItem('my_event_regs', JSON.stringify(sorted));
    } catch (err) {
      const localStr = await AsyncStorage.getItem('my_event_regs');
      const local = localStr ? JSON.parse(localStr) : [];
      setRegs(sortByUpcomingFirst(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const patientId = user?._id;
    if (!patientId) {
      setRegs([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      const patientId = user?._id;
      if (patientId) refresh();
    }, [user?._id])
  );

  const cancelRegistration = async (registration_id) => {
    try {
      const t = await AsyncStorage.getItem('token');
      if (!t) throw new Error('Not authenticated');

      const res = await fetch(
        `${getApiBaseUrl()}/api/event-registrations/${registration_id}/cancel`,
        { method: 'PATCH', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } }
      );

      if (!res.ok) throw new Error('Cancel failed');
      Alert.alert('Cancelled', 'Your registration was cancelled.');
      await refresh();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not cancel');
    }
  };

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" />
        <Text style={styles.stateText}>Loading registrations…</Text>
      </View>
    );
  }

  if (!regs.length) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>No event registrations yet.</Text>
      </View>
    );
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const pillStyle = (status) => {
    if (status === 'confirmed' || status === 'registered')
      return { bg: '#EAF7F3', text: C.success, border: '#CBEDE3', bar: '#34D399' };
    if (status === 'waitlist' || status === 'waiting')
      return { bg: '#EEF4FF', text: C.info, border: '#D8E4FF', bar: '#93C5FD' };
    if (status === 'cancelled')
      return { bg: '#FDECEC', text: C.danger, border: '#F8C9CC', bar: '#FCA5A5' };
    if (status === 'attended')
      return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', bar: '#CBD5E1' };
    return { bg: C.chipBg, text: C.chipText, border: C.border, bar: '#CBD5E1' };
  };

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>My Event Registrations</Text>
      <FlatList
        data={regs}
        keyExtractor={(item, idx) => String(item?.registration_id ?? item?._id ?? `reg-${idx}`)}
        contentContainerStyle={{ gap: 12 }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const eventDate = item?.event_date ? new Date(item.event_date) : null;
          const hideCancel =
            !eventDate ||
            eventDate < startOfToday ||
            ['attended', 'cancelled'].includes(item?.registration_status);

          const status = (item?.registration_status || '').toLowerCase();
          const pill = pillStyle(status);

          return (
            <View style={styles.cardRow}>
              {/* Left accent bar */}
              <View style={[styles.accent, { backgroundColor: pill.bar }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  {/* Event name */}
                  <Text style={styles.eventName}>{item?.event_name || 'Event'}</Text>
                </View>

                {/* ✅ Status pill on its own line */}
                <View style={{ marginTop: 6 }}>
                  <View style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                    <Text style={[styles.pillText, { color: pill.text }]}>
                      {(item?.registration_status || 'STATUS').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {!!eventDate && (
                  <Text style={styles.meta}>
                    {eventDate.toLocaleDateString()}
                    {item?.event_time ? `  •  ${item.event_time}` : ''}
                  </Text>
                )}
                {!!item?.event_location && <Text style={styles.meta}>{item.event_location}</Text>}
                {status === 'waitlist' && item?.waitlist_position != null && (
                  <Text style={styles.meta}>Waitlist Position: {item.waitlist_position}</Text>
                )}

                <View style={styles.actionsRow}>
                  {!hideCancel && (
                    <TouchableOpacity style={[styles.ghostBtn]} onPress={() => cancelRegistration(item.registration_id)}>
                      <Text style={[styles.ghostBtnText, { color: C.danger }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* QR */}
              <View style={styles.qrWrap}>
                {item?.qr_code ? (
                  <Image source={{ uri: item.qr_code }} style={styles.qrImage} />
                ) : (
                  <QRCode
                    value={JSON.stringify({
                      t: 'event_reg',
                      regId: item?.registration_id,
                      eventId: item?.event_id,
                      userId: user?._id,
                    })}
                    size={88}
                    backgroundColor="transparent"
                    color="#0F172A"
                  />
                )}
                <Text style={styles.qrCaption}>Check-in</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ------------------ My Lab Test Results ------------------ */
function MyLabTestResults() {
  const { user } = useAuth();
  const userId = user?._id;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  const makeAbsUrl = (urlOrPath) => {
    if (!urlOrPath) return null;
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    const base = getApiBaseUrl().replace(/\/+$/, '');
    return `${base}/${urlOrPath.replace(/^\/+/, '')}`;
  };

  const viewReport = async (rawUrl, id) => {
    try {
      const url = makeAbsUrl(rawUrl) || `${getApiBaseUrl()}/api/lab-tests/${id}/download`;
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Unable to open', 'Could not open the report link.');
    }
  };

  const guessExt = (s = '') => {
    const m = s.match(/\.(pdf|png|jpe?g|webp|heic|gif|tiff)(\?.*)?$/i);
    return m ? `.${m[1].toLowerCase()}` : '.pdf';
  };

  const downloadReport = async (rawUrl, id, displayName) => {
    setDownloadingId(id);
    try {
      const url = makeAbsUrl(rawUrl) || `${getApiBaseUrl()}/api/lab-tests/${id}/download`;
      const ext = guessExt(url);
      const safeName = (displayName || 'report').replace(/[^\w\-]+/g, '_');
      const localUri = `${FileSystem.documentDirectory}${safeName}${ext}`;

      const { status, uri } = await FileSystem.downloadAsync(url, localUri);
      if (status !== 200) throw new Error(`HTTP ${status}`);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Downloaded', `Saved to: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Download failed', e?.message || 'Could not download the report.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    if (!userId) {
      setResults([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        let res = await fetch(
          `${getApiBaseUrl()}/api/lab-tests/user/${encodeURIComponent(userId)}`,
          { headers: { Authorization: `Bearer ${t}` } }
        );
        if (res.status === 404) {
          res = await fetch(
            `${getApiBaseUrl()}/api/lab-tests?user_id=${encodeURIComponent(userId)}`,
            { headers: { Authorization: `Bearer ${t}` } }
          );
        }
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          setResults(items.filter((r) => (r?.user_id?._id || r?.user_id || r?.userId) === userId));
          await AsyncStorage.setItem('my_lab_results', JSON.stringify(items));
          setLoading(false);
          return;
        }

        const localStr = await AsyncStorage.getItem('my_lab_results');
        setResults(localStr ? JSON.parse(localStr) : []);
      } catch {
        const localStr = await AsyncStorage.getItem('my_lab_results');
        setResults(localStr ? JSON.parse(localStr) : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" />
        <Text style={styles.stateText}>Loading lab test results…</Text>
      </View>
    );
  }

  if (!results.length) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>No lab results available yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>My Lab Test Results</Text>
      <FlatList
        data={results}
        keyExtractor={(item, idx) => item?._id ?? `lab-${idx}`}
        contentContainerStyle={{ gap: 12 }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const testName = item?.testOrEvent_name || item?.test?.name || 'Lab Test';
          const uploadedAt = item?.uploaded_at || item?.createdAt;
          const rawFileUrl =
            item?.file_path || item?.result_file_url || item?.pdf_url || item?.reportUrl;

          return (
            <View style={styles.cardRow}>
              <View style={[styles.accent, { backgroundColor: '#9CC2FF' }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.eventName}>{testName}</Text>
                  <View style={[styles.pill, { backgroundColor: '#ECF3FF', borderColor: '#C9D9FF' }]}>
                    <Text style={[styles.pillText, { color: '#3B82F6' }]}>REPORT</Text>
                  </View>
                </View>

                {!!uploadedAt && (
                  <Text style={styles.meta}>
                    Uploaded: {new Date(uploadedAt).toLocaleDateString()}
                  </Text>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.softBtn} onPress={() => viewReport(rawFileUrl, item._id)}>
                    <Text style={[styles.softBtnText, { color: C.success }]}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.softBtn}
                    onPress={() => downloadReport(rawFileUrl, item._id, testName)}
                    disabled={downloadingId === item._id}
                  >
                    {downloadingId === item._id ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={[styles.softBtnText, { color: C.info }]}>Download</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ------------------ styles ------------------ */
function shadow(elev = 4) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.08,
      shadowRadius: elev,
    },
    android: { elevation: elev },
    default: {},
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: 2,
  },

  /* Header (with gradient) */
  headerWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
    borderRadius: 18,
    backgroundColor: C.primarySoft,
    ...shadow(0),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#DCE7FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#BFD4FF',
    ...shadow(2),
  },
  avatarText: { color: C.text, fontSize: 18, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 2 },
  subTitle: { fontSize: 14, color: C.sub, marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D9E2F2',
    ...shadow(2),
  },
  roleBadgeText: { color: C.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },

  /* ✅ Compact profile details */
  kvGrid: {
    marginTop: 1,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.card,
    overflow: 'hidden',
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  kKey: { color: C.sub, fontSize: 13 },
  kVal: { color: C.text, fontSize: 14, fontWeight: '600', maxWidth: '65%' },

  /* Segmented control */
  segment: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    backgroundColor: C.chipBg,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1, borderColor: C.border,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  segmentText: { color: C.text, fontWeight: '700' },

  /* States */
  stateBox: {
    padding: 16, alignItems: 'center',
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    ...shadow(2),
  },
  stateText: { marginTop: 6, color: C.sub, fontWeight: '600' },

  /* Section */
  sectionTitle: { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 10 },

  /* Card row with accent bar */
  cardRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    ...shadow(4),
  },
  accent: { width: 6, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  eventName: { fontSize: 16, fontWeight: '800', color: C.text },
  meta: { color: C.sub, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },

  pill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  /* Buttons */
  ghostBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFF4F4',
    borderWidth: 1, borderColor: '#FAD1D1',
  },
  ghostBtnText: { fontWeight: '800', letterSpacing: 0.2 },

  softBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFF',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  softBtnText: { fontWeight: '800', letterSpacing: 0.2 },

  /* QR */
  qrWrap: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  qrImage: {
    width: 88, height: 88, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FAFAFA',
  },
  qrCaption: { marginTop: 6, fontSize: 11, color: C.sub, fontWeight: '600' },
});

export {};
