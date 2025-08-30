// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { getApiBaseUrl } from '../api/config';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 16 }}>My Profile</Text>
      <Text style={{ marginBottom: 6 }}>Name: {user?.name}</Text>
      <Text style={{ marginBottom: 6 }}>Email: {user?.email}</Text>
      <Text style={{ marginBottom: 6 }}>Phone: {user?.contact_no}</Text>
      <Text style={{ marginBottom: 6 }}>Role: {user?.user_category}</Text>
      <Text style={{ marginBottom: 20 }}>Address: {user?.address}</Text>

      {/* Event registrations + QR codes */}
      <MyEventRegs />
    </View>
  );
}

function MyEventRegs() {
  const { user } = useAuth(); // get logged-in user
  const patientId = user?._id;

  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState([]);

  useEffect(() => {
    if (!patientId) {
      setRegs([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');

        if (t) {
          // Preferred: dedicated "mine" endpoint
          let res = await fetch(
            `${getApiBaseUrl()}/api/event-registrations/mine?patientId=${encodeURIComponent(patientId)}`,
            { headers: { Authorization: `Bearer ${t}` } }
          );

          // Fallback: generic endpoint with query param if /mine isn't implemented
          if (res.status === 404) {
            res = await fetch(
              `${getApiBaseUrl()}/api/event-registrations?patientId=${encodeURIComponent(patientId)}`,
              { headers: { Authorization: `Bearer ${t}` } }
            );
          }

          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

            // Safety client-side filter
            const mine = items.filter((r) => {
              const pid = r?.patient?._id || r?.patient_id || r?.user?._id;
              return pid === patientId;
            });

            setRegs(mine);
            await AsyncStorage.setItem('my_event_regs', JSON.stringify(mine));
            setLoading(false);
            return;
          }
        }

        // Offline / API error / no token ⇒ use cached, filtered
        const localStr = await AsyncStorage.getItem('my_event_regs');
        const local = localStr ? JSON.parse(localStr) : [];
        const mineLocal = local.filter((r) => {
          const pid = r?.patient?._id || r?.patient_id || r?.user?._id;
          return pid === patientId;
        });
        setRegs(mineLocal);
      } catch (err) {
        console.warn('Loading registrations failed → using local cache:', err.message);
        const localStr = await AsyncStorage.getItem('my_event_regs');
        const local = localStr ? JSON.parse(localStr) : [];
        const mineLocal = local.filter((r) => {
          const pid = r?.patient?._id || r?.patient_id || r?.user?._id;
          return pid === patientId;
        });
        setRegs(mineLocal);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

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

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>
        My Event Registrations
      </Text>
      <FlatList
        data={regs}
        keyExtractor={(item, idx) => item?._id ?? `reg-${idx}`}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventName}>{item?.event?.name || 'Event'}</Text>
              {!!item?.event?.date && (
                <Text style={styles.meta}>
                  {new Date(item.event.date).toLocaleDateString()}
                  {item.event.time ? ` at ${item.event.time}` : ''}
                </Text>
              )}
              {!!item?.event?.location && <Text style={styles.meta}>{item.event.location}</Text>}
              <Text style={styles.status}>
                Status: {item.status}
                {item.status === 'waitlist' && item.waitlist_position != null
                  ? ` (Pos ${item.waitlist_position})`
                  : ''}
              </Text>
            </View>

            <View style={styles.qrBox}>
              <QRCode
                value={
                  item.qrString
                    ? item.qrString
                    : JSON.stringify({
                        t: 'event_reg',
                        regId: item._id,
                        eventId: item?.event?._id,
                        userId: patientId,
                      })
                }
                size={96}
              />
              <Text style={styles.qrCaption}>Show this at check-in</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
