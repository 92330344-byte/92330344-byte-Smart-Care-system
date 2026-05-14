import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PatientBasicInfoScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

  const savePatientInfo = async () => {
    try {
      if (!fullName.trim() || !age.trim() || !email.trim()) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      await AsyncStorage.setItem(
        "pending_user_info",
        JSON.stringify({
          role: "Patient",
          fullName: fullName.trim(),
          age: age.trim(),
          email: email.trim().toLowerCase(),
        })
      );

      navigation.replace("PasscodeSetup");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.blueCircle} />

        <View style={styles.symbolWrap}>
          <Text style={styles.symbol}>⚕</Text>
        </View>

        <Text style={styles.title}>Patient Information</Text>
        <Text style={styles.subtitle}>Enter your basic information to continue</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor="#9AA9BA"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#9AA9BA"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#9AA9BA"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={savePatientInfo}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    paddingVertical: 24,
    paddingHorizontal: 20,
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
    marginTop: 10,
  },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#082B6F",
    fontSize: 15,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#1677F2",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 22,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});