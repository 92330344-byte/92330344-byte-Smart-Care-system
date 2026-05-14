import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from "react-native";
import { auth } from "./firebaseConfig";
import { createPatientAlert } from "./PatientAlertHelper";

export default function PatientEmergencyButtonScreen({ navigation }) {
  const [sending, setSending] = useState(false);

  const handleCriticalAlert = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No patient found");
        return;
      }

      if (sending) return;

      setSending(true);

      await createPatientAlert(user.uid, {
        type: "bracelet_press",
        message: "Patient pressed emergency button - urgent attention needed",
        priority: "critical",
      });

      Alert.alert("Success", "Emergency alert sent successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Emergency</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mainCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🚨</Text>
        </View>

        <Text style={styles.title}>Emergency Alert</Text>
        <Text style={styles.subtitle}>
          Press the button below to send an urgent alert immediately
        </Text>

        <TouchableOpacity
          style={[styles.emergencyButton, sending && styles.disabledButton]}
          onPress={handleCriticalAlert}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? "Sending..." : "Send Emergency Alert"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    overflow: "hidden",
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
    paddingBottom: 24,
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
    color: "#1677F2",
    fontSize: 34,
    fontWeight: "400",
    marginTop: -3,
  },

  headerTitle: {
    color: "#082B6F",
    fontSize: 26,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  mainCard: {
    marginTop: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "#FFD7DE",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#FFC2CC",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  icon: {
    fontSize: 46,
  },

  title: {
    color: "#082B6F",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    color: "#6F7F95",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  emergencyButton: {
    backgroundColor: "#E53935",
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});