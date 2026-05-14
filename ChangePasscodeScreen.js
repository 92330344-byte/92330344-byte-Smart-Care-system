import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { auth } from "./firebaseConfig";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

const PASSCODE_LENGTH = 4;
const buildAuthPassword = (code) => `${code}00`;

export default function ChangePasscodeScreen({ navigation }) {
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleNumber = async (num) => {
    if (loading) return;

    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        Alert.alert("Error", "No user found");
        return;
      }

      if (step === 1) {
        if (oldCode.length < PASSCODE_LENGTH) {
          const value = oldCode + num;
          setOldCode(value);

          if (value.length === PASSCODE_LENGTH) {
            setLoading(true);

            try {
              const credential = EmailAuthProvider.credential(
                user.email,
                buildAuthPassword(value)
              );

              await reauthenticateWithCredential(user, credential);

              setTimeout(() => {
                setStep(2);
                setLoading(false);
              }, 150);
            } catch (error) {
              setTimeout(() => {
                setLoading(false);
                setOldCode("");
                Alert.alert("Error", "Wrong current passcode");
              }, 100);
            }
          }
        }
      } else {
        if (newCode.length < PASSCODE_LENGTH) {
          const value = newCode + num;
          setNewCode(value);

          if (value.length === PASSCODE_LENGTH) {
            setLoading(true);

            await updatePassword(user, buildAuthPassword(value));

            setTimeout(() => {
              setLoading(false);
              Alert.alert("Success", "Passcode changed successfully", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            }, 100);
          }
        }
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", error.message);
    }
  };

  const handleDelete = () => {
    if (loading) return;

    if (step === 1) setOldCode((prev) => prev.slice(0, -1));
    else setNewCode((prev) => prev.slice(0, -1));
  };

  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  const renderDots = (value) => (
    <View style={styles.dotsRow}>
      {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, value.length > i && styles.dotFilled]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Change Passcode</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          {step === 1 ? "Enter Current Passcode" : "Enter New Passcode"}
        </Text>

        {renderDots(step === 1 ? oldCode : newCode)}

        <Text style={styles.helper}>
          {loading
            ? "Please wait..."
            : step === 1
            ? "Verify your current code"
            : "Enter your new 4-digit code"}
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
                    else if (item) handleNumber(item);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
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
    paddingTop: 55,
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

  headerText: {
    color: "#082B6F",
    fontSize: 23,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    marginTop: 20,
    elevation: 4,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#082B6F",
    textAlign: "center",
    marginBottom: 12,
  },

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
    marginTop: 12,
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