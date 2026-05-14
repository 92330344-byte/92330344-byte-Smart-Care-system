import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Vibration,
  Linking,
} from "react-native";
import { db, realtimeDb } from "./firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { ref, update } from "firebase/database";
import { Audio } from "expo-av";

export default function SOSScreen({ route, navigation }) {
  const {
    patientId,
    alertId,
    patientName,
    caregiverPhoneNumber,
    emergencyNumber,
    message,
    source,
  } = route.params || {};

  const soundRef = useRef(null);

  useEffect(() => {
    const startAlert = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("./assets/alarm.mp3"),
          { isLooping: true }
        );

        soundRef.current = sound;
        await sound.playAsync();

        const pattern = [0, 800, 400, 800];
        Vibration.vibrate(pattern, true);
      } catch (error) {
        console.log("Sound error:", error);
      }
    };

    startAlert();

    return () => {
      stopAlert();
    };
  }, []);

  const stopAlert = async () => {
    try {
      Vibration.cancel();

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCallCaregiver = async () => {
    if (!caregiverPhoneNumber) {
      Alert.alert("No Number", "Caregiver phone number is not available");
      return;
    }

    await Linking.openURL(`tel:${caregiverPhoneNumber}`);
  };

  const handleCallEmergency = async () => {
    if (!emergencyNumber) {
      Alert.alert("No Number", "Emergency number is not available");
      return;
    }

    await Linking.openURL(`tel:${emergencyNumber}`);
  };

  const handleDone = async () => {
    try {
      if (source === "bracelet") {
        await update(ref(realtimeDb, `patients/${patientId}`), {
          sosPressed: false,
          alert: "NONE",
          fallDetected: false,
          abnormalHeartRate: false,
        });
      }

      if (source !== "bracelet" && patientId && alertId) {
        await updateDoc(doc(db, "users", patientId, "alerts", alertId), {
          seenByCaregiver: true,
          status: "resolved",
        });
      }

      await stopAlert();
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.redCircle} />
      <View style={styles.blueCircle} />

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🚨</Text>
        </View>

        <Text style={styles.title}>CRITICAL ALERT</Text>

        <Text style={styles.subtitle}>{patientName || "Emergency detected"}</Text>

        <Text style={styles.message}>
          {message || "Patient needs urgent attention"}
        </Text>

        <TouchableOpacity style={styles.callBtn} onPress={handleCallCaregiver}>
          <Text style={styles.callText}>Call Caregiver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emergencyBtn} onPress={handleCallEmergency}>
          <Text style={styles.emergencyText}>Call Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneText}>Resolve Alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  redCircle: {
    position: "absolute",
    top: -90,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#FFE1E6",
  },

  blueCircle: {
    position: "absolute",
    bottom: -90,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EAF4FF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: "#FFD7DE",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#FFC2CC",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  icon: {
    fontSize: 54,
  },

  title: {
    color: "#E31B3F",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
  },

  subtitle: {
    color: "#082B6F",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },

  message: {
    color: "#6F7F95",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },

  callBtn: {
    backgroundColor: "#1677F2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },

  callText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  emergencyBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },

  emergencyText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  doneBtn: {
    backgroundColor: "#EAF4FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },

  doneText: {
    color: "#1677F2",
    fontWeight: "900",
  },
});