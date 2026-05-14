import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { auth, db, realtimeDb } from "./firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import * as Location from "expo-location";

export default function PatientHomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [linkCode, setLinkCode] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [latestHeartRate, setLatestHeartRate] = useState(0);
  const [latestOxygen, setLatestOxygen] = useState(0);

  const currentStatus =
    latestHeartRate > 100 || (latestOxygen > 0 && latestOxygen < 95)
      ? "Needs Attention"
      : "Normal";

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          Alert.alert("Error", "No user found");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setLinkCode(data.linkCode || "");
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
   const uid = auth.currentUser?.uid;

     if (!uid) return;

    const patientRef = ref(realtimeDb, `patients/${uid}`);

    const unsubscribe = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setLatestHeartRate(data.heartRate ?? 0);
        setLatestOxygen(data.spo2 ?? 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  const createLinkCode = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      const code = generateCode();

      await updateDoc(doc(db, "users", user.uid), {
        linkCode: code,
      });

      setLinkCode(code);
      Alert.alert("Success", `Link code created: ${code}`);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const saveCurrentLocation = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      setSavingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Error", "Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await updateDoc(doc(db, "users", user.uid), {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationUpdatedAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Location saved successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hello</Text>
          <Text style={styles.userName}>
            {userData?.fullName?.trim() ? userData.fullName : "Patient"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
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
            {currentStatus === "Normal"
              ? "Your vitals are stable"
              : "Please check your vitals"}
          </Text>
        </View>

        <View style={styles.shieldCircle}>
          <Text style={styles.shield}>🛡️</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.vitalCard}
        onPress={() => navigation.navigate("HeartRateDetails")}
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
          
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.vitalCard}
        onPress={() => navigation.navigate("OxygenDetails")}
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
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.listCard}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={async () => {
            await saveCurrentLocation();
            navigation.navigate("Location");
          }}
        >
          <View style={styles.smallIconCircle}>
            <Text style={styles.smallIcon}>📍</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>Location</Text>
            <Text style={styles.listSub}>
              {savingLocation
                ? "Saving current location..."
                : "View current patient location"}
            </Text>
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
            <Text style={styles.listSub}>Check latest reminders and alerts</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate("PatientEmergencyButton")}
        >
          <View style={styles.sosCircle}>
            <Text style={styles.sosIcon}>SOS</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency</Text>
            <Text style={styles.listSub}>Send an urgent alert</Text>
          </View>

          <Text style={styles.redArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linkCard}>
        <View style={styles.linkHeaderRow}>
          <View style={styles.line} />
          <Text style={styles.linkTitle}>Caregiver Link Code</Text>
          <View style={styles.line} />
        </View>

        {linkCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.linkCode}>{linkCode}</Text>
          </View>
        ) : (
          <Text style={styles.linkHint}>
            Generate a code and share it with your caregiver
          </Text>
        )}

        <TouchableOpacity style={styles.linkButton} onPress={createLinkCode}>
          <Text style={styles.linkButtonText}>↗  Generate New Code</Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          Share this code with your caregiver to connect
        </Text>
      </View>
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
    color: "#1677F2",
    fontSize: 18,
    fontWeight: "500",
  },

  userName: {
    color: "#082B6F",
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

  smallBlue: {
    color: "#1677F2",
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
    color: "#082B6F",
    fontSize: 18,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  bigNumber: {
    color: "#1677F2",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44,
  },

  unit: {
    color: "#1677F2",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },

  ecg: {
    color: "#1677F2",
    fontSize: 16,
    marginTop: -2,
    letterSpacing: 1,
  },

  arrow: {
    color: "#1677F2",
    fontSize: 40,
    fontWeight: "300",
  },

  redArrow: {
    color: "#E31B3F",
    fontSize: 40,
    fontWeight: "300",
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
    color: "#082B6F",
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

  sosCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  sosIcon: {
    backgroundColor: "#F3324B",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 7,
    borderRadius: 8,
    overflow: "hidden",
  },

  emergencyTitle: {
    color: "#E31B3F",
    fontSize: 16,
    fontWeight: "900",
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
    color: "#1677F2",
    fontSize: 16,
    fontWeight: "900",
    marginHorizontal: 12,
  },

  codeBox: {
    backgroundColor: "#EAF4FF",
    borderRadius: 9,
    paddingVertical: 9,
    alignSelf: "center",
    minWidth: 210,
    marginBottom: 12,
  },

  linkCode: {
    color: "#1677F2",
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 7,
  },

  linkHint: {
    color: "#6F7F95",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 12,
  },

  linkButton: {
    backgroundColor: "#1677F2",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },

  linkButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  footerHint: {
    color: "#8A97A8",
    textAlign: "center",
    fontSize: 12,
    marginTop: 10,
  },
});