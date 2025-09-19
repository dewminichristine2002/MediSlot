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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from '../api/config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showRegs, setShowRegs] = useState(false);
  const [showLab, setShowLab] = useState(false);
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

  return (
    <View style={{ flex: 1, paddingTop: 60 }}>
      {/* Profile header */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 16 }}>My Profile</Text>
        <Text style={{ marginBottom: 6 }}>Name: {user?.name}</Text>
        <Text style={{ marginBottom: 6 }}>Email: {user?.email}</Text>
        <Text style={{ marginBottom: 6 }}>Phone: {user?.contact_no}</Text>
        <Text style={{ marginBottom: 6 }}>Role: {user?.user_category}</Text>
        <Text style={{ marginBottom: 20 }}>Address: {user?.address}</Text>

        {/* Buttons row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={[styles.btn, styles.primary]}
            activeOpacity={0.85}
            onPress={() => setShowRegs((s) => !s)}
          >
            <Text style={[styles.btnText, styles.primaryText]}>
              {showRegs ? 'Hide My Events' : 'My Event Registrations'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.secondary]}
            activeOpacity={0.85}
            onPress={() => setShowLab((s) => !s)}
          >
            <Text style={[styles.btnText, styles.secondaryText]}>
              {showLab ? 'Hide My Lab Results' : 'My Lab Test Results'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable lists */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
      >
        {showRegs && <MyEventRegs />}
        {showLab && <MyLabTestResults />}
      </ScrollView>
    </View>
  );
}

/* ------------------ Event Registrations ------------------ */
function MyEventRegs() {
  const { user } = useAuth();
  const patientId = user?._id;

  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState([]);

  // Group-sort: Upcoming/TODAY (ascending), then Past (descending)
  const sortByUpcomingFirst = (arr) => {
    const items = Array.isArray(arr) ? [...arr] : [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];
    const noDate = [];

    for (const it of items) {
      const d = it?.event_date ? new Date(it.event_date) : null;
      if (!d || isNaN(d.getTime())) {
        noDate.push(it);
      } else if (d >= todayStart) {
        upcoming.push(it);
      } else {
        past.push(it);
      }
    }

    // Upcoming: earliest first
    upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    // Past: most recent first
    past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    // Upcoming at top, then past, then items with no date at the bottom
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
      console.warn('Loading registrations failed → using local cache:', err.message);
      const localStr = await AsyncStorage.getItem('my_event_regs');
      const local = localStr ? JSON.parse(localStr) : [];
      setRegs(sortByUpcomingFirst(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!patientId) {
      setRegs([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      if (patientId) refresh();
    }, [patientId])
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
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" />
        <Text style={{ marginTop: 6 }}>Loading registrations…</Text>
      </View>
    );
  }

  if (!regs.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={{ color: '#666' }}>No event registrations yet.</Text>
      </View>
    );
  }

  // Start of today for consistent checks
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>My Event Registrations</Text>
      <FlatList
        data={regs}
        keyExtractor={(item, idx) => String(item?.registration_id ?? item?._id ?? `reg-${idx}`)}
        contentContainerStyle={{ gap: 12 }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const eventDate = item?.event_date ? new Date(item.event_date) : null;

          // Hide cancel if the day has passed (i.e., event date < start of today),
          // or already attended/cancelled.
          const hideCancel =
            !eventDate ||
            eventDate < startOfToday ||
            ['attended', 'cancelled'].includes(item?.registration_status);

          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{item?.event_name || 'Event'}</Text>

                {!!eventDate && (
                  <Text style={styles.meta}>
                    {eventDate.toLocaleDateString()}
                    {item?.event_time ? ` at ${item.event_time}` : ''}
                  </Text>
                )}

                {!!item?.event_location && <Text style={styles.meta}>{item.event_location}</Text>}

                <Text style={styles.status}>
                  Status: {item?.registration_status}
                  {item?.registration_status === 'waitlist' && item?.waitlist_position != null
                    ? ` (Pos ${item.waitlist_position})`
                    : ''}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {!hideCancel && (
                    <TouchableOpacity
                      style={[styles.linkBtn, { borderColor: '#EF4444' }]}
                      onPress={() => cancelRegistration(item.registration_id)}
                    >
                      <Text style={[styles.linkBtnText, { color: '#EF4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.qrBox}>
                {item?.qr_code ? (
                  <Image
                    source={{ uri: item.qr_code }}
                    style={{ width: 96, height: 96, borderRadius: 8 }}
                  />
                ) : (
                  <QRCode
                    value={JSON.stringify({
                      t: 'event_reg',
                      regId: item?.registration_id,
                      eventId: item?.event_id,
                      userId: patientId,
                    })}
                    size={96}
                  />
                )}
                <Text style={styles.qrCaption}>Show this at check-in</Text>
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
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" />
        <Text style={{ marginTop: 6 }}>Loading lab test results…</Text>
      </View>
    );
  }

  if (!results.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={{ color: '#666' }}>No lab results available yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>My Lab Test Results</Text>
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
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{testName}</Text>
                {!!uploadedAt && (
                  <Text style={styles.meta}>
                    Uploaded: {new Date(uploadedAt).toLocaleDateString()}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.linkBtn, { borderColor: '#10B981' }]}
                    onPress={() => viewReport(rawFileUrl, item._id)}
                  >
                    <Text style={[styles.linkBtnText, { color: '#10B981' }]}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.linkBtn, { borderColor: '#2563EB' }]}
                    onPress={() => downloadReport(rawFileUrl, item._id, testName)}
                    disabled={downloadingId === item._id}
                  >
                    {downloadingId === item._id ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={[styles.linkBtnText, { color: '#2563EB' }]}>Download</Text>
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
const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  primary: { backgroundColor: '#2563EB' },
  primaryText: { color: '#fff' },
  secondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryText: { color: '#111827' },
  btnText: { fontWeight: '700', fontSize: 16 },

  loadingBox: { padding: 16, alignItems: 'center' },
  emptyBox: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  eventName: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#555', marginTop: 2 },
  status: { marginTop: 6, fontWeight: '600' },
  qrBox: { alignItems: 'center', paddingLeft: 8 },
  qrCaption: { marginTop: 6, fontSize: 12, color: '#666' },

  linkBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  linkBtnText: { fontWeight: '700' },
});

export {};
