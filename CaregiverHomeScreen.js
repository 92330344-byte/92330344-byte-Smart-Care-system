import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { auth, db, realtimeDb } from "./firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";

const PRIMARY_COLOR = "#1677F2";
const DARK_BLUE = "#082B6F";
const screenWidth = Dimensions.get("window").width;

export default function CaregiverHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [caregiverData, setCaregiverData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const [liveHeartRate, setLiveHeartRate] = useState(0);
  const [liveOxygen, setLiveOxygen] = useState(0);
  const [liveAlert, setLiveAlert] = useState("NONE");
  const [liveFallDetected, setLiveFallDetected] = useState(false);
  const [liveAbnormalHeartRate, setLiveAbnormalHeartRate] = useState(false);

  const hasOpenedSOS = useRef(false);
  const hasOpenedBraceletSOS = useRef(false);

  const [heartRateHistory, setHeartRateHistory] = useState([0, 0, 0, 0, 0, 0]);
  const [oxygenHistory, setOxygenHistory] = useState([0, 0, 0, 0, 0, 0]);

  const labels = useMemo(() => ["-5", "-4", "-3", "-2", "-1", "Now"], []);

  const latestHeartRate = heartRateHistory[heartRateHistory.length - 1] || 0;
  const previousHeartRate = heartRateHistory[heartRateHistory.length - 2] || 0;
  const latestOxygen = oxygenHistory[oxygenHistory.length - 1] || 0;
  const previousOxygen = oxygenHistory[oxygenHistory.length - 2] || 0;

  const heartTrend =
    latestHeartRate > previousHeartRate
      ? "↑ Rising"
      : latestHeartRate < previousHeartRate
      ? "↓ Falling"
      : "→ Stable";

  const oxygenTrend =
    latestOxygen > previousOxygen
      ? "↑ Rising"
      : latestOxygen < previousOxygen
      ? "↓ Falling"
      : "→ Stable";

  const currentStatus =
    liveAlert === "SOS" ||
    liveFallDetected ||
    liveAbnormalHeartRate ||
    latestHeartRate > 100 ||
    (latestOxygen > 0 && latestOxygen < 95)
      ? "Needs Attention"
      : "Normal";

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 119, 242, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(111, 127, 149, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: PRIMARY_COLOR,
    },
    strokeWidth: 2,
  };

  useEffect(() => {
    let unsubscribeAlerts = null;
    let unsubscribeRealtime = null;

    const loadData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          Alert.alert("Error", "No caregiver found");
          navigation.replace("EnterPasscode");
          return;
        }

        const caregiverRef = doc(db, "users", user.uid);
        const caregiverSnap = await getDoc(caregiverRef);

        if (!caregiverSnap.exists()) {
          Alert.alert("Error", "Caregiver data not found");
          navigation.replace("EnterPasscode");
          return;
        }

        const caregiverInfo = caregiverSnap.data();
        setCaregiverData(caregiverInfo);

        if (!caregiverInfo.patientId) {
          navigation.replace("CaregiverSetup");
          return;
        }

        const patientRef = doc(db, "users", caregiverInfo.patientId);
        const patientSnap = await getDoc(patientRef);

        if (!patientSnap.exists()) {
          Alert.alert("Error", "Patient data not found");
          navigation.replace("CaregiverSetup");
          return;
        }

        const patientInfo = patientSnap.data();
        setPatientData(patientInfo);

        const alertsQuery = query(
          collection(db, "users", caregiverInfo.patientId, "alerts"),
          orderBy("createdAt", "desc")
        );

        unsubscribeAlerts = onSnapshot(
          alertsQuery,
          (snapshot) => {
            const alertsList = snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }));

            setAlerts(alertsList);

            const criticalAlert = alertsList.find(
              (alertItem) =>
                alertItem.priority === "critical" &&
                alertItem.status !== "resolved" &&
                !alertItem.seenByCaregiver
            );

            if (criticalAlert && patientInfo && !hasOpenedSOS.current) {
              hasOpenedSOS.current = true;

              navigation.navigate("SOS", {
                patientId: caregiverInfo.patientId,
                alertId: criticalAlert.id,
                patientName: patientInfo.fullName || "Patient",
                caregiverPhoneNumber:
                  caregiverInfo.phoneNumber ||
                  caregiverInfo.emergencyNumber ||
                  "",
                emergencyNumber:
                  patientInfo.emergencyNumber ||
                  caregiverInfo.emergencyNumber ||
                  "",
                message: criticalAlert.message || "Critical alert detected",
                source: "firestore",
              });
            }

            if (!criticalAlert) {
              hasOpenedSOS.current = false;
            }
          },
          (error) => {
            console.log("Alerts listener error:", error.message);
          }
        );

        const livePatientRef = ref(realtimeDb, "patient");

        unsubscribeRealtime = onValue(livePatientRef, (snapshot) => {
          const liveData = snapshot.val();

          if (!liveData) {
            setLiveHeartRate(0);
            setLiveOxygen(0);
            setLiveAlert("NONE");
            setLiveFallDetected(false);
            setLiveAbnormalHeartRate(false);
            setHeartRateHistory([0, 0, 0, 0, 0, 0]);
            setOxygenHistory([0, 0, 0, 0, 0, 0]);
            hasOpenedBraceletSOS.current = false;
            return;
          }

          const hr = liveData.heartRate ?? 0;
          const spo2 = liveData.spo2 ?? 0;
          const alertValue = liveData.alert ?? "NONE";
          const fallDetected = liveData.fallDetected ?? false;
          const abnormalHeartRate = liveData.abnormalHeartRate ?? false;

          setLiveHeartRate(hr);
          setLiveOxygen(spo2);
          setLiveAlert(alertValue);
          setLiveFallDetected(fallDetected);
          setLiveAbnormalHeartRate(abnormalHeartRate);

          setHeartRateHistory((prev) => [...prev, hr].slice(-6));
          setOxygenHistory((prev) => [...prev, spo2].slice(-6));

          if (alertValue === "SOS" && !hasOpenedBraceletSOS.current) {
            hasOpenedBraceletSOS.current = true;

            navigation.navigate("SOS", {
              patientName: patientInfo.fullName || "Patient",
              caregiverPhoneNumber:
                caregiverInfo.phoneNumber ||
                caregiverInfo.emergencyNumber ||
                "",
              emergencyNumber:
                patientInfo.emergencyNumber ||
                caregiverInfo.emergencyNumber ||
                "",
              message: "SOS button was pressed from the bracelet.",
              source: "bracelet",
            });
          }

          if (alertValue === "NONE") {
            hasOpenedBraceletSOS.current = false;
          }
        });
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeAlerts) unsubscribeAlerts();
      if (unsubscribeRealtime) unsubscribeRealtime();
    };
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Monitoring</Text>
          <Text style={styles.userName}>
            {patientData?.fullName?.trim() ? patientData.fullName : "Patient"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("CaregiverSettings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusDot,
            currentStatus === "Needs Attention" && styles.statusDotDanger,
          ]}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.smallBlue}>Current Status</Text>
          <Text
            style={[
              styles.statusValue,
              currentStatus === "Needs Attention" && styles.warningText,
            ]}
          >
            {currentStatus}
          </Text>
          <Text style={styles.statusSubText}>
            Caregiver: {caregiverData?.fullName || "Caregiver"}
          </Text>
        </View>

        <View style={styles.shieldCircle}>
          <Text style={styles.shield}>🛡️</Text>
        </View>
      </View>

      {liveAlert !== "NONE" && (
        <View style={styles.alertCard}>
          <View style={styles.alertIconCircle}>
            <Text style={styles.alertIcon}>⚠️</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Live Emergency Alert</Text>
            <Text style={styles.alertText}>
              {liveAlert === "SOS"
                ? "SOS button was pressed from the bracelet."
                : liveAlert === "FALL"
                ? "Fall was detected by the bracelet."
                : "Abnormal heart rate was detected by the bracelet."}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.vitalCard}
        onPress={() =>
          navigation.navigate("HeartRateDetails", {
            latestHeartRate: liveHeartRate,
          })
        }
      >
        <View style={styles.iconCircle}>
          <Text style={styles.heartIcon}>💙</Text>
        </View>

        <View style={styles.vitalInfo}>
          <Text style={styles.vitalTitle}>Heart Rate</Text>
          <View style={styles.row}>
            <Text style={styles.bigNumber}>
              {latestHeartRate > 0 ? latestHeartRate : "--"}
            </Text>
            <Text style={styles.unit}> bpm</Text>
          </View>
          <Text style={styles.trend}>{heartTrend}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.vitalCard}
        onPress={() =>
          navigation.navigate("OxygenDetails", {
            latestOxygen: liveOxygen,
          })
        }
      >
        <View style={styles.iconCircle}>
          <Text style={styles.dropIcon}>💧</Text>
          <Text style={styles.o2}>O₂</Text>
        </View>

        <View style={styles.vitalInfo}>
          <Text style={styles.vitalTitle}>Oxygen</Text>
          <View style={styles.row}>
            <Text style={styles.bigNumber}>
              {latestOxygen > 0 ? latestOxygen : "--"}
            </Text>
            <Text style={styles.unit}> %</Text>
          </View>
          <Text style={styles.trend}>{oxygenTrend}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      

      <View style={styles.listCard}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate("Location")}
        >
          <View style={styles.smallIconCircle}>
            <Text style={styles.smallIcon}>📍</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>Location</Text>
            <Text style={styles.listSub}>View patient current location</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate("MedicationNotifications")}
        >
          <View style={styles.smallIconCircle}>
            <Text style={styles.smallIcon}>🔔</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>Notifications</Text>
            <Text style={styles.listSub}>
              {alerts.length > 0
                ? `${alerts.length} alert(s) available`
                : "Check latest reminders and alerts"}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linkCard}>
        <View style={styles.linkHeaderRow}>
          <View style={styles.line} />
          <Text style={styles.linkTitle}>Linked Patient</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.linkName}>{patientData?.fullName || "Not linked"}</Text>
        <Text style={styles.linkEmail}>
          {patientData?.email || "No email available"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },

  blueCircle: {
    position: "absolute",
    top: -125,
    right: -115,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#DCEBFF",
  },

  header: {
    paddingTop: 44,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hello: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: "500",
  },

  userName: {
    color: DARK_BLUE,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },

  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  settingsIcon: {
    fontSize: 24,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
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

  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#20B26B",
    marginRight: 10,
  },

  statusDotDanger: {
    backgroundColor: "#E53935",
  },

  smallBlue: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: "600",
  },

  statusValue: {
    color: "#1FA463",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },

  warningText: {
    color: "#E53935",
  },

  statusSubText: {
    color: "#6F7F95",
    fontSize: 13,
    marginTop: 2,
  },

  shieldCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  shield: {
    fontSize: 28,
  },

  alertCard: {
    backgroundColor: "#FFF7F8",
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFD7DE",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#FFC2CC",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  alertIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  alertIcon: {
    fontSize: 23,
  },

  alertTitle: {
    color: "#E31B3F",
    fontSize: 16,
    fontWeight: "900",
  },

  alertText: {
    color: "#6F7F95",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },

  vitalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
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

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  heartIcon: {
    fontSize: 38,
  },

  dropIcon: {
    fontSize: 40,
  },

  o2: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    bottom: 19,
  },

  vitalInfo: {
    flex: 1,
  },

  vitalTitle: {
    color: DARK_BLUE,
    fontSize: 18,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  bigNumber: {
    color: PRIMARY_COLOR,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44,
  },

  unit: {
    color: PRIMARY_COLOR,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },

  trend: {
    color: "#6F7F95",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  arrow: {
    color: PRIMARY_COLOR,
    fontSize: 40,
    fontWeight: "300",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
  },

  chartTitle: {
    color: DARK_BLUE,
    fontSize: 17,
    fontWeight: "900",
    alignSelf: "flex-start",
    marginBottom: 8,
  },

  chart: {
    borderRadius: 16,
  },

  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  smallIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  smallIcon: {
    fontSize: 23,
  },

  listTitle: {
    color: DARK_BLUE,
    fontSize: 16,
    fontWeight: "900",
  },

  listSub: {
    color: "#6F7F95",
    fontSize: 12,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF3FA",
    marginLeft: 74,
  },

  linkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  linkHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#CFE0F7",
  },

  linkTitle: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: "900",
    marginHorizontal: 12,
  },

  linkName: {
    color: DARK_BLUE,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
  },

  linkEmail: {
    color: "#6F7F95",
    textAlign: "center",
    fontSize: 13,
    marginTop: 5,
  },
});