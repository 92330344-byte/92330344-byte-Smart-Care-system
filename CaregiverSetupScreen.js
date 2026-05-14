import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function CaregiverSetupScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const linkPatient = async () => {
    try {
      const caregiver = auth.currentUser;

      if (!caregiver) {
        Alert.alert("Error", "No user found");
        return;
      }

      if (!code.trim()) {
        Alert.alert("Error", "Please enter the link code");
        return;
      }

      setLoading(true);

      const q = query(
        collection(db, "users"),
        where("linkCode", "==", code.trim().toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Error", "Invalid code");
        return;
      }

      const patientDoc = snapshot.docs[0];

      await updateDoc(doc(db, "users", caregiver.uid), {
        patientId: patientDoc.id,
      });

      await updateDoc(doc(db, "users", patientDoc.id), {
        caregiverId: caregiver.uid,
      });

      Alert.alert("Success", "Connected successfully", [
        {
          text: "OK",
          onPress: () => navigation.replace("CaregiverHome"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.symbolWrap}>
        <Text style={styles.symbol}>⚕</Text>
      </View>

      <Text style={styles.title}>Link Patient</Text>
      <Text style={styles.subtitle}>
        Enter the patient link code to connect and monitor
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Patient Code</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter patient code"
          placeholderTextColor="#9AA9BA"
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={linkPatient}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Connecting..." : "Connect"}
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
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

  symbolWrap: {
    width: 115,
    height: 115,
    borderRadius: 58,
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
    marginBottom: 22,
  },

  symbol: {
    fontSize: 58,
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
    marginBottom: 30,
    paddingHorizontal: 10,
  },

  card: {
    width: "100%",
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

  label: {
    color: "#082B6F",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    color: "#082B6F",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#1677F2",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
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