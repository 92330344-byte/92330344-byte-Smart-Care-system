import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { auth, db } from "./firebaseConfig";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

const PRIMARY = "#1677F2";
const DARK = "#082B6F";

export default function AddMedicationScreen({ navigation, route }) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [pills, setPills] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !time.trim() || !pills.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      setSaving(true);

      let finalTargetUserId = route?.params?.targetUserId || user.uid;

      if (!route?.params?.targetUserId) {
        const currentUserRef = doc(db, "users", user.uid);
        const currentUserSnap = await getDoc(currentUserRef);

        if (currentUserSnap.exists()) {
          const currentUserData = currentUserSnap.data();

          if (
            currentUserData.role === "Caregiver" &&
            currentUserData.patientId
          ) {
            finalTargetUserId = currentUserData.patientId;
          }
        }
      }

      await addDoc(collection(db, "users", finalTargetUserId, "medications"), {
        name: name.trim(),
        time: time.trim(),
        pills: pills.trim(),
        createdAt: new Date(),
      });

      Alert.alert("Success", "Medication added successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.blueCircle} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerText}>Add Medication</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mainCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>💊</Text>
          </View>

          <Text style={styles.title}>Medication Details</Text>
          <Text style={styles.subtitle}>
            Add the medication name, time, and number of pills.
          </Text>

          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Example: Panadol"
            placeholderTextColor="#9AA9BA"
          />

          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="Example: 08:00 AM"
            placeholderTextColor="#9AA9BA"
          />

          <Text style={styles.label}>Pills</Text>
          <TextInput
            style={styles.input}
            value={pills}
            onChangeText={setPills}
            placeholder="Example: 1"
            placeholderTextColor="#9AA9BA"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, saving && styles.disabledButton]}
            onPress={handleAdd}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save Medication"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

  headerSpacer: {
    width: 44,
    height: 44,
  },

  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 4,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  icon: {
    fontSize: 38,
  },

  title: {
    color: DARK,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "#6F7F95",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },

  label: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: DARK,
    fontSize: 15,
    fontWeight: "600",
  },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});