import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const cleanInvalidAccounts = async () => {
      try {
        const accountsJson = await AsyncStorage.getItem("saved_accounts");
        const currentUserJson = await AsyncStorage.getItem("current_user");

        const savedAccounts = accountsJson ? JSON.parse(accountsJson) : [];
        const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;

        if (!savedAccounts.length) return [];

        const validAccounts = [];

        for (const account of savedAccounts) {
          try {
            if (!account?.email) continue;

            if (!account?.uid) {
              validAccounts.push(account);
              continue;
            }

            const userDocRef = doc(db, "users", account.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) validAccounts.push(account);
          } catch (error) {
            console.log("Account validation error:", error);
          }
        }

        await AsyncStorage.setItem("saved_accounts", JSON.stringify(validAccounts));

        if (currentUser?.email) {
          const stillExists = validAccounts.find(
            (item) =>
              item.email?.toLowerCase() === currentUser.email?.toLowerCase()
          );

          if (!stillExists) {
            await AsyncStorage.removeItem("current_user");
          }
        }

        return validAccounts;
      } catch (error) {
        console.log("Clean invalid accounts error:", error);
        return [];
      }
    };

    const init = async () => {
      try {
        const validAccounts = await cleanInvalidAccounts();

        setTimeout(() => {
          if (validAccounts.length > 0) {
            navigation.replace("EnterPasscode");
          } else {
            navigation.replace("SelectRole");
          }
        }, 3200);
      } catch (error) {
        console.log("Splash error:", error);
        navigation.replace("SelectRole");
      }
    };

    init();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />
      <View style={styles.softCircle} />

      <View style={styles.logoCircle}>
        <Text style={styles.logo}>⚕</Text>
      </View>

      <Text style={styles.title}>Smart Care System</Text>

      <Text style={styles.subtitle}>
        Advanced patient monitoring for safer, smarter,
      </Text>
      <Text style={styles.subtitle}>and more connected healthcare</Text>

      <View style={styles.ecgContainer}>
        <View style={styles.ecgLine} />
        <Text style={styles.ecgPulse}>༻✧༻✧༻✧</Text>
        <View style={styles.ecgLine} />
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },

  blueCircle: {
    position: "absolute",
    top: -110,
    right: -120,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "#DCEBFF",
  },

  softCircle: {
    position: "absolute",
    bottom: -90,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EEF6FF",
  },

  logoCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 8,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 22,
  },

  logo: {
    fontSize: 86,
    color: "#1677F2",
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#082B6F",
    textAlign: "center",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 15,
    color: "#6F7F95",
    textAlign: "center",
    lineHeight: 22,
  },

  ecgContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 28,
    width: "100%",
  },

  ecgLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#CFE0F7",
  },

  ecgPulse: {
    color: "#1677F2",
    fontSize: 26,
    marginHorizontal: 10,
    fontWeight: "900",
  },

  loadingText: {
    position: "absolute",
    bottom: 48,
    color: "#1677F2",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});