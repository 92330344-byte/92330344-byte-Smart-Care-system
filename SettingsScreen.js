import React from "react";
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

export default function SettingsScreen({ navigation }) {
  const switchUser = () => {
    Alert.alert("Switch User", "Do you want to switch to another account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("app_locked");
            navigation.replace("EnterPasscode");
          } catch (error) {
            console.log("Switch error:", error);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Settings</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>👤</Text>
          </View>

          <View style={styles.optionInfo}>
            <Text style={styles.optionText}>Profile</Text>
            <Text style={styles.optionSub}>Edit your personal information</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("ChangePasscode")}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <View style={styles.optionInfo}>
            <Text style={styles.optionText}>Change Passcode</Text>
            <Text style={styles.optionSub}>Update your security code</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("Medications")}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>💊</Text>
          </View>

          <View style={styles.optionInfo}>
            <Text style={styles.optionText}>Medications</Text>
            <Text style={styles.optionSub}>Manage medication reminders</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.switchCard} onPress={switchUser}>
        <View style={styles.switchIconCircle}>
          <Text style={styles.switchIcon}>⇄</Text>
        </View>

        <View style={styles.optionInfo}>
          <Text style={styles.switchText}>Switch User</Text>
          <Text style={styles.optionSub}>Go to another saved account</Text>
        </View>

        <Text style={styles.redArrow}>›</Text>
      </TouchableOpacity>
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
    top: -120,
    right: -110,
    width: 290,
    height: 290,
    borderRadius: 145,
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
    color: "#1677F2",
    fontSize: 34,
    fontWeight: "400",
    marginTop: -3,
  },

  headerText: {
    color: "#082B6F",
    fontSize: 26,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  icon: {
    fontSize: 23,
  },

  optionInfo: {
    flex: 1,
  },

  optionText: {
    color: "#082B6F",
    fontSize: 17,
    fontWeight: "900",
  },

  optionSub: {
    color: "#6F7F95",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: "#1677F2",
    fontSize: 36,
    fontWeight: "300",
  },

  redArrow: {
    color: "#E31B3F",
    fontSize: 36,
    fontWeight: "300",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF3FA",
    marginLeft: 78,
  },

  switchCard: {
    backgroundColor: "#FFF7F8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD7DE",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#FFC2CC",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  switchIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  switchIcon: {
    color: "#E31B3F",
    fontSize: 24,
    fontWeight: "900",
  },

  switchText: {
    color: "#E31B3F",
    fontSize: 17,
    fontWeight: "900",
  },
});