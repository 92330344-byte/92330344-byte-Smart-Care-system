import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { auth, db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";

const PRIMARY = "#1677F2";
const DARK = "#082B6F";

export default function MedicationNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setNotifications([]);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setNotifications([]);
        return;
      }

      const userData = userSnap.data();
      let targetUserId = user.uid;
      let list = [];

      if (userData.role === "Caregiver") {
        if (!userData.patientId) {
          setNotifications([]);
          return;
        }
        targetUserId = userData.patientId;
      }

      try {
        const medsQuery = query(
          collection(db, "users", targetUserId, "medications"),
          orderBy("createdAt", "desc")
        );

        const medsSnap = await getDocs(medsQuery);

        medsSnap.forEach((docItem) => {
          const data = docItem.data();

          list.push({
            id: `med-${docItem.id}`,
            type: "medication",
            title: "Medication Reminder",
            message: `Take ${data.name || "Medication"} at ${
              data.time || "scheduled time"
            }`,
            createdAt: data.createdAt || null,
          });
        });
      } catch (e) {
        console.log("Medications fetch error:", e.message);
      }

      try {
        const alertsQuery = query(
          collection(db, "users", targetUserId, "alerts"),
          orderBy("createdAt", "desc")
        );

        const alertsSnap = await getDocs(alertsQuery);

        alertsSnap.forEach((docItem) => {
          const data = docItem.data();

          list.push({
            id: `alert-${docItem.id}`,
            type: "alert",
            title: data.priority === "critical" ? "Critical Alert" : "Health Alert",
            message: data.message || "New alert",
            createdAt: data.createdAt || null,
          });
        });
      } catch (e) {
        console.log("Alerts fetch error:", e.message);
      }

      setNotifications(list);
    } catch (error) {
      console.log("Notifications error:", error.message);
      setNotifications([]);
    }
  };

  const formatDate = (createdAt) => {
    try {
      if (!createdAt) return "No date";

      if (createdAt?.toDate) {
        return createdAt.toDate().toLocaleString();
      }

      if (createdAt instanceof Date) {
        return createdAt.toLocaleString();
      }

      return String(createdAt);
    } catch {
      return "No date";
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Notifications</Text>

        <TouchableOpacity style={styles.refreshButton} onPress={loadNotifications}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Text style={styles.summaryEmoji}>🔔</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>Reminders & Alerts</Text>
          <Text style={styles.summarySub}>
            Medication reminders and health alerts appear here.
          </Text>
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySub}>
            There are no medication reminders or alerts yet.
          </Text>
        </View>
      ) : (
        notifications.map((item) => {
          const isAlert = item.type === "alert";

          return (
            <View
              key={item.id}
              style={[styles.notificationCard, isAlert && styles.alertCard]}
            >
              <View
                style={[
                  styles.iconCircle,
                  isAlert && styles.alertIconCircle,
                ]}
              >
                <Text style={styles.icon}>{isAlert ? "⚠️" : "💊"}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.notificationTitle,
                    isAlert && styles.alertTitle,
                  ]}
                >
                  {item.title}
                </Text>

                <Text style={styles.notificationMessage}>{item.message}</Text>

                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },

  blueCircle: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#DCEBFF",
  },

  header: {
    paddingTop: 50,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  back: {
    color: PRIMARY,
    fontSize: 34,
    fontWeight: "400",
    marginTop: -3,
  },

  headerText: {
    color: DARK,
    fontSize: 24,
    fontWeight: "900",
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: -2,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  summaryEmoji: {
    fontSize: 28,
  },

  summaryTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
  },

  summarySub: {
    color: "#6F7F95",
    fontSize: 13,
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: "900",
  },

  emptySub: {
    color: "#6F7F95",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  alertCard: {
    borderColor: "#FFD7DE",
    backgroundColor: "#FFF7F8",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  alertIconCircle: {
    backgroundColor: "#FFE1E6",
  },

  icon: {
    fontSize: 24,
  },

  notificationTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: "900",
  },

  alertTitle: {
    color: "#E31B3F",
  },

  notificationMessage: {
    color: "#6F7F95",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },

  dateText: {
    color: "#9AA9BA",
    fontSize: 11,
    marginTop: 6,
  },
});