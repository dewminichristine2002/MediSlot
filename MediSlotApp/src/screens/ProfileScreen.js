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
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from '../api/config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0F172A',
  sub: '#475569',
  primary: '#2563EB',
  g1: '#2563EB',
  g2: '#06B6D4',
  g3: '#10B981',
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

  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = ['admin', 'superadmin', 'manager'].includes(role);

  const [showRegs, setShowRegs] = useState(true);
  const [showLab, setShowLab] = useState(false);
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isAdmin && route?.params?.openLab) {
      setShowLab(true);
      setShowRegs(false);
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 200);
    }
  }, [route?.params?.openLab, isAdmin]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const initials =
    (user?.name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>
              {getGreeting()}, {user?.name || 'User'}!
            </Text>
            <Text style={styles.subTitle}>
              {dateStr} • {timeStr}
            </Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person-circle-outline" size={14} color={C.primary} />
              <Text style={styles.roleBadgeText}>{user?.user_category || 'User'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.kvWrap}>
          <View style={styles.kvRow}>
            <Text style={styles.kKey}>Name</Text>
            <Text style={styles.kVal}>{user?.name || '-'}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kKey}>Email</Text>
            <Text style={styles.kVal}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kKey}>Phone</Text>
            <Text style={styles.kVal}>{user?.contact_no || '-'}</Text>
          </View>
          <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.kKey}>Address</Text>
            <Text style={styles.kVal}>{user?.address || '-'}</Text>
          </View>
        </View>

        {!isAdmin && (
          <View style={styles.segmentWrapper}>
            <View style={styles.segment}>
              <SegmentButton
                icon="calendar-outline"
                active={showRegs}
                label="Event Registrations"
                onPress={() => {
                  setShowRegs(true);
                  setShowLab(false);
                }}
              />
              <SegmentButton
                icon="flask-outline"
                active={showLab}
                label="Lab Test Results"
                onPress={() => {
                  setShowLab(true);
                  setShowRegs(false);
                }}
              />
            </View>

            <View style={styles.segment}>
              <SegmentButton
                icon="clipboard-outline"
                label="My Bookings"
                onPress={() => navigation.navigate('HomeTab', { screen: 'BookingHistory' })}
              />
              <SegmentButton
                icon="checkmark-done-outline"
                label="My Check List"
                onPress={() => navigation.navigate('UserChecklist')}
              />
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingTop: 0 }}>
        {isAdmin ? (
          <View style={styles.stateBox}>
            <Ionicons name="shield-checkmark" size={22} color={C.sub} />
            <Text style={[styles.stateText, { marginTop: 6, textAlign: 'center' }]}>
              Admin accounts don’t have personal event registrations or lab results.
            </Text>
          </View>
        ) : (
          <>
            {showRegs && <MyEventRegs />}
            {showLab && <MyLabTestResults />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* Segmented Button */
function SegmentButton({ active, label, icon, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Ionicons name={icon} size={16} color={active ? C.primary : C.text} style={{ marginRight: 6 }} />
      <Text style={[styles.segmentText, active && { color: C.primary, fontWeight: '800' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ------------------ MyEventRegs (Detailed) ------------------ */
function MyEventRegs() {
  const { user } = useAuth();
  const patientId = user?._id;
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState([]);

  const cancelRegistration = async (registration_id) => {
  try {
    const t = await AsyncStorage.getItem('token');
    if (!t) throw new Error('Not authenticated');

    const res = await fetch(
      `${getApiBaseUrl()}/api/event-registrations/${registration_id}/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) throw new Error('Cancel failed');
    Alert.alert('Cancelled', 'Your registration was cancelled.');
    await refresh(); // re-fetch updated list
  } catch (e) {
    Alert.alert('Error', e.message || 'Could not cancel registration.');
  }
};

  const refresh = async () => {
    try {
      const t = await AsyncStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/event-registrations/events-by-user/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setRegs(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setRegs([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { refresh(); }, []));

  if (loading)
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={C.primary} />
        <Text style={styles.stateText}>Loading registrations…</Text>
      </View>
    );

  if (!regs.length)
    return (
      <View style={styles.stateBox}>
        <Ionicons name="calendar-outline" size={22} color={C.sub} />
        <Text style={[styles.stateText, { marginTop: 6 }]}>No event registrations yet.</Text>
      </View>
    );

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
        keyExtractor={(item, idx) => String(item?._id ?? `reg-${idx}`)}
        contentContainerStyle={{ gap: 12 }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const status = (item?.registration_status || '').toLowerCase();
          const pill = pillStyle(status);
          const eventDate = item?.event_date ? new Date(item.event_date) : null;
          const hideCancel =
            !eventDate || eventDate < startOfToday || ['attended', 'cancelled'].includes(status);

          return (
            <LinearGradient colors={[C.g1, C.g2]} style={styles.cardOutline}>
              <View style={styles.cardRow}>
                <View style={[styles.accent, { backgroundColor: pill.bar }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.eventName}>{item?.event_name || 'Event'}</Text>
                    <View style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                      <Text style={[styles.pillText, { color: pill.text }]}>{status.toUpperCase()}</Text>
                    </View>
                  </View>
                  {!!eventDate && (
                    <Text style={styles.meta}>
                      {eventDate.toLocaleDateString()}
                      {item?.event_time ? `  •  ${item.event_time}` : ''}
                    </Text>
                  )}
                  {!!item?.event_location && <Text style={styles.meta}>{item.event_location}</Text>}
                   <View style={styles.actionsRow}>
                    {!hideCancel && (
                      <TouchableOpacity style={[styles.softBtn, { backgroundColor: '#FFF4F4', borderColor: '#FAD1D1' }]}
                        onPress={() => cancelRegistration(item.registration_id)}
                      >
                        <Ionicons name="close-circle" size={16} color={C.danger} style={{ marginRight: 6 }} />
                        <Text style={[styles.softBtnText, { color: C.danger }]}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
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
            </LinearGradient>
          );
        }}
      />
    </View>
  );
}

/* ------------------ MyLabTestResults (Detailed) ------------------ */
function MyLabTestResults() {
  const { user } = useAuth();
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
      let url = makeAbsUrl(rawUrl) || `${getApiBaseUrl()}/api/lab-tests/${id}/download`;
      if (url.includes('/image/upload/') && url.endsWith('.pdf')) {
        url = url.replace('/image/upload/', '/raw/upload/');
      }
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
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else Alert.alert('Downloaded', `Saved to: ${uri}`);
    } catch (e) {
      Alert.alert('Download failed', e?.message || 'Could not download the report.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        const res = await fetch(`${getApiBaseUrl()}/api/lab-tests/user/${encodeURIComponent(user._id)}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        setResults(Array.isArray(data?.items) ? data.items : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);




  if (loading)
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={C.primary} />
        <Text style={styles.stateText}>Loading lab test results…</Text>
      </View>
    );

  if (!results.length)
    return (
      <View style={styles.stateBox}>
        <Ionicons name="flask-outline" size={22} color={C.sub} />
        <Text style={[styles.stateText, { marginTop: 6 }]}>No lab results available yet.</Text>
      </View>
    );

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>My Lab Test Results</Text>
      <FlatList
        data={results}
        keyExtractor={(item, idx) => item?._id ?? `lab-${idx}`}
        contentContainerStyle={{ gap: 12 }}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const testName = item?.testOrEvent_name || 'Lab Test';
          const uploadedAt = item?.uploaded_at || item?.createdAt;
          const rawFileUrl = item?.file_path || item?.result_file_url || item?.pdf_url || item?.reportUrl;
          return (
            <LinearGradient colors={[C.g1, C.g2]} style={styles.cardOutline}>
              <View style={styles.cardRow}>
                <View style={[styles.accent, { backgroundColor: '#9CC2FF' }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.eventName}>{testName}</Text>
                    <View style={[styles.pill, { backgroundColor: '#ECF3FF', borderColor: '#C9D9FF' }]}>
                      <Text style={[styles.pillText, { color: '#3B82F6' }]}>REPORT</Text>
                    </View>
                  </View>
                  {!!uploadedAt && <Text style={styles.meta}>Uploaded: {new Date(uploadedAt).toLocaleDateString()}</Text>}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.softBtn} onPress={() => viewReport(rawFileUrl, item._id)}>
                      <Ionicons name="open-outline" size={16} color={C.success} style={{ marginRight: 6 }} />
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
                        <>
                          <Ionicons name="download-outline" size={16} color={C.info} style={{ marginRight: 6 }} />
                          <Text style={[styles.softBtnText, { color: C.info }]}>Download</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>
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

const R = 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -60,
    ...shadow(4),
  },
  headerBack: {
    position: 'absolute',
    left: 12,
    top: 10,
    zIndex: 10,
    marginTop: 70,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft:30
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    marginTop: 70,
  },
  headerTextBlock: {
    flex: 1,
    marginTop: 70,
  },
  avatarText: { color: C.text, fontSize: 18, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  subTitle: { fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 4 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D9E2F2',
  },
  roleBadgeText: { color: C.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },

  /* Compact KV card */
  kvWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  kKey: { color: C.sub, fontSize: 13 },
  kVal: { color: C.text, fontSize: 14, fontWeight: '700', maxWidth: '65%' },

  /* Segment */
  segment: {
    marginTop: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderColor: C.primary,
    ...shadow(6),
  },
  segmentText: { color: C.text, fontWeight: '700' },

  /* Section */
  sectionTitle: { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 10 },

  /* States */
  stateBox: {
    padding: 16, alignItems: 'center',
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    ...shadow(2),
  },
  stateText: { color: C.sub, fontWeight: '600' },

  /* Gradient outline wrapper for cards */
  cardOutline: {
    borderRadius: R + 2,
    padding: 1.5,
    ...shadow(3),
  },

  /* Card row with accent + QR */
  cardRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: R,
    borderWidth: 1, borderColor: C.border,
  },
  accent: { width: 6, borderTopLeftRadius: R, borderBottomLeftRadius: R },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  eventName: { fontSize: 16, fontWeight: '900', color: C.text, paddingRight: 8 },
  meta: { color: C.sub, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },

  pill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },

  softBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  softBtnText: { fontWeight: '800', letterSpacing: 0.2 },

  /* QR */
  qrWrap: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  qrImage: {
    width: 88, height: 88, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FAFAFA',
  },
  qrCaption: { marginTop: 6, fontSize: 11, color: C.sub, fontWeight: '700' },
});

export {};
