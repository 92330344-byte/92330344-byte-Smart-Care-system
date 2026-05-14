import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db, realtimeDb } from "./firebaseConfig";
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const PASSCODE_LENGTH = 4;
const buildAuthPassword = (code) => `${code}00`;

export default function PasscodeSetupScreen({ navigation }) {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const goNext = async () => {
    try {
      setLoading(true);

      const pendingInfoString = await AsyncStorage.getItem("pending_user_info");
      const pendingInfo = pendingInfoString ? JSON.parse(pendingInfoString) : null;

      if (!pendingInfo) {
        Alert.alert("Error", "Missing account information");
        navigation.replace("SelectRole");
        return;
      }

      const email = (pendingInfo.email || "").trim().toLowerCase();
      const role = pendingInfo.role || "";

      if (!email || !role) {
        Alert.alert("Error", "Incomplete account information");
        navigation.replace("SelectRole");
        return;
      }

      const authPassword = buildAuthPassword(passcode);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        authPassword
      );

      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        role,
        fullName: pendingInfo.fullName || "",
        email,
        age: pendingInfo.age || "",
        phoneNumber: pendingInfo.phoneNumber || "",
        emergencyNumber: pendingInfo.emergencyNumber || "",
        patientId: pendingInfo.patientId || "",
        caregiverId: pendingInfo.caregiverId || "",
        linkCode: "",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), userData, { merge: true });

       console.log("USER DATA:", userData);

        await set(ref(realtimeDb, "users/" + user.uid), {
          uid: user.uid,
          fullName: userData.fullName || "Test Name",
          email: userData.email || "test@test.com",
          role: userData.role || "patient",
        });
      const savedAccount = {
        uid: user.uid,
        email,
        fullName: pendingInfo.fullName || "",
        role,
      };

      const accountsJson = await AsyncStorage.getItem("saved_accounts");
      let savedAccounts = accountsJson ? JSON.parse(accountsJson) : [];

      const exists = savedAccounts.some(
        (item) => item.email?.toLowerCase() === email
      );

      if (!exists) savedAccounts.push(savedAccount);
      else {
        savedAccounts = savedAccounts.map((item) =>
          item.email?.toLowerCase() === email ? savedAccount : item
        );
      }

      await AsyncStorage.setItem("saved_accounts", JSON.stringify(savedAccounts));
      await AsyncStorage.setItem("current_user", JSON.stringify(savedAccount));
      await AsyncStorage.setItem("hasAccount", "true");
      await AsyncStorage.removeItem("pending_user_info");
      await AsyncStorage.removeItem("pending_role");
      await AsyncStorage.removeItem("app_locked");

      if (role === "Patient") navigation.replace("PatientHome");
      else if (role === "Caregiver") navigation.replace("CaregiverSetup");
      else navigation.replace("SelectRole");
    } catch (error) {
      let message = error.message;

      if (error.code === "auth/email-already-in-use") {
        message = "This account already exists. Use Enter Passcode.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Passcode is too weak.";
      }

      Alert.alert("Error", message);
      setPasscode("");
      setConfirmPasscode("");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = async (num) => {
    if (loading) return;

    if (step === 1) {
      if (passcode.length >= PASSCODE_LENGTH) return;
      const newValue = passcode + num;
      setPasscode(newValue);
      if (newValue.length === PASSCODE_LENGTH) {
        setTimeout(() => setStep(2), 150);
      }
    } else {
      if (confirmPasscode.length >= PASSCODE_LENGTH) return;
      const newValue = confirmPasscode + num;
      setConfirmPasscode(newValue);

      if (newValue.length === PASSCODE_LENGTH) {
        if (newValue !== passcode) {
          setTimeout(() => {
            Alert.alert("Error", "Passcodes do not match");
            setPasscode("");
            setConfirmPasscode("");
            setStep(1);
          }, 150);
        } else {
          setTimeout(async () => {
            await goNext();
          }, 150);
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    if (step === 1) setPasscode((prev) => prev.slice(0, -1));
    else setConfirmPasscode((prev) => prev.slice(0, -1));
  };

  const renderDots = (value, label, isActive) => (
    <View style={styles.section}>
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>

      <View style={styles.dotsRow}>
        {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, value.length > i && styles.dotFilled]}
          />
        ))}
      </View>
    </View>
  );

  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.symbolWrap}>
          <Text style={styles.symbol}>⚕</Text>
        </View>

        <Text style={styles.title}>Create Passcode</Text>
        <Text style={styles.subtitle}>
          Secure your Smart Care System with a 4-digit code
        </Text>

        <View style={styles.card}>
          {renderDots(passcode, "Create Passcode", step === 1)}
          {renderDots(confirmPasscode, "Confirm Passcode", step === 2)}

          <Text style={styles.helper}>
            {loading
              ? "Please wait..."
              : step === 1
              ? "Enter 4 digits for your new passcode"
              : "Re-enter the same code to confirm"}
          </Text>

          <View style={{ marginTop: 14 }}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.key, !item && styles.emptyKey]}
                    onPress={() => {
                      if (item === "⌫") handleDelete();
                      else if (item) handleNumberPress(item);
                    }}
                    disabled={!item || loading}
                  >
                    <Text style={styles.keyText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.stepText}>
            {loading ? "Saving..." : step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  blueCircle: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#DCEBFF",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  symbolWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 6,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    alignSelf: "center",
    marginBottom: 22,
  },

  symbol: {
    fontSize: 66,
    color: "#1677F2",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#082B6F",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6F7F95",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 4,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  section: { marginBottom: 18 },

  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6F7F95",
    textAlign: "center",
    marginBottom: 12,
  },

  activeLabel: { color: "#1677F2" },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },

  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1677F2",
    marginHorizontal: 8,
    backgroundColor: "transparent",
  },

  dotFilled: {
    backgroundColor: "#1677F2",
  },

  helper: {
    textAlign: "center",
    color: "#6F7F95",
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13,
  },

  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14,
  },

  key: {
    width: 72,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyKey: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  keyText: {
    color: "#1677F2",
    fontSize: 24,
    fontWeight: "900",
  },

  stepText: {
    textAlign: "center",
    color: "#1677F2",
    fontWeight: "800",
    fontSize: 13,
    marginTop: 4,
  },
});