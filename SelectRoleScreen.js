import React from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SelectRoleScreen({ navigation }) {
  const saveRole = async (selectedRole) => {
    try {
      await AsyncStorage.setItem("pending_role", selectedRole);

      if (selectedRole === "Patient") {
        navigation.replace("PatientBasicInfo");
      } else {
        navigation.replace("CaregiverInfo");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.symbolWrap}>
        <Text style={styles.symbol}>⚕</Text>
      </View>

      <Text style={styles.title}>Choose Your Role</Text>
      <Text style={styles.subtitle}>Select how you want to use Smart Care System</Text>

      <View style={styles.cardsWrapper}>
        <TouchableOpacity style={styles.roleCard} onPress={() => saveRole("Patient")}>
          <View style={styles.iconCircle}>
            <Text style={styles.roleIcon}>🧑‍⚕️</Text>
          </View>
          <Text style={styles.roleTitle}>Patient</Text>
          <Text style={styles.roleDesc}>Track your health data and stay protected</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleCard} onPress={() => saveRole("Caregiver")}>
          <View style={styles.iconCircle}>
            <Text style={styles.roleIcon}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.roleTitle}>Caregiver</Text>
          <Text style={styles.roleDesc}>Monitor patient status and respond to alerts</Text>
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

  cardsWrapper: {
    width: "100%",
  },

  roleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    marginBottom: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  roleIcon: {
    fontSize: 34,
  },

  roleTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#082B6F",
    marginBottom: 8,
  },

  roleDesc: {
    fontSize: 14,
    color: "#6F7F95",
    textAlign: "center",
    lineHeight: 20,
  },
});