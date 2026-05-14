import React, { useEffect, useState } from "react";
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
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const PASSCODE_LENGTH = 4;
const buildAuthPassword = (code) => `${code}00`;

export default function EnterPasscodeScreen({ navigation }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const normalizeRole = (role) => {
    if (!role) return "";
    const r = String(role).toLowerCase().trim();

    if (r === "patient") return "Patient";
    if (r === "caregiver") return "Caregiver";

    return role;
  };

  const getAccountKey = (account) => {
    return (
      account?.email?.trim()?.toLowerCase() ||
      account?.uid ||
      account?.id ||
      null
    );
  };

  const mergeAccounts = (localAccounts, firebaseAccounts) => {
    const map = new Map();

    [...firebaseAccounts, ...localAccounts].forEach((account) => {
      const key = getAccountKey(account);
      if (!key) return;

      const existing = map.get(key) || {};

      map.set(key, {
        ...existing,
        ...account,
        uid: account.uid || account.id || existing.uid || existing.id || "",
        email: account.email || existing.email || "",
        fullName:
          account.fullName ||
          account.name ||
          existing.fullName ||
          existing.name ||
          "",
        role: normalizeRole(account.role || existing.role || ""),
        patientId: account.patientId || existing.patientId || "",
      });
    });

    return Array.from(map.values());
  };

  const loadAccounts = async () => {
    try {
      const accountsJson = await AsyncStorage.getItem("saved_accounts");
      const currentUserJson = await AsyncStorage.getItem("current_user");

      const localAccounts = accountsJson ? JSON.parse(accountsJson) : [];
      const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;

      let firebaseAccounts = [];

      try {
        const snapshot = await getDocs(collection(db, "users"));

        firebaseAccounts = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            uid: docSnap.id,
            email: data.email || "",
            fullName: data.fullName || data.name || "",
            role: normalizeRole(data.role || ""),
            patientId: data.patientId || "",
          };
        });
      } catch (firestoreError) {
        console.log("Error loading Firebase users:", firestoreError);
      }

      const firebaseKeys = new Set(
        firebaseAccounts.map((acc) => getAccountKey(acc)).filter(Boolean)
      );

      const filteredLocalAccounts = localAccounts.filter((acc) => {
        const key = getAccountKey(acc);
        return key && firebaseKeys.has(key);
      });

      const mergedAccounts = mergeAccounts(
        filteredLocalAccounts,
        firebaseAccounts
      );

      await AsyncStorage.setItem(
        "saved_accounts",
        JSON.stringify(mergedAccounts)
      );

      let nextSelected = mergedAccounts[0] || null;

      if (currentUser) {
        const stillExists = mergedAccounts.find(
          (item) =>
            item.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
            item.uid === currentUser.uid
        );

        if (!stillExists) {
          await AsyncStorage.removeItem("current_user");
          await AsyncStorage.removeItem("app_locked");
          nextSelected = mergedAccounts[0] || null;
        } else {
          nextSelected = stillExists;
        }
      }

      setSavedAccounts(mergedAccounts);
      setSelectedAccount(nextSelected);

      if (!mergedAccounts.length) {
        navigation.replace("SelectRole");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const removeDeletedAccountLocally = async (emailToRemove, uidToRemove = "") => {
    try {
      const existingJson = await AsyncStorage.getItem("saved_accounts");
      const currentUserJson = await AsyncStorage.getItem("current_user");

      const existing = existingJson ? JSON.parse(existingJson) : [];
      const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;

      const filtered = existing.filter((acc) => {
        const sameEmail =
          emailToRemove &&
          acc.email?.toLowerCase() === emailToRemove.toLowerCase();

        const sameUid = uidToRemove && acc.uid === uidToRemove;

        return !(sameEmail || sameUid);
      });

      await AsyncStorage.setItem("saved_accounts", JSON.stringify(filtered));

      if (
        currentUser &&
        ((emailToRemove &&
          currentUser.email?.toLowerCase() === emailToRemove.toLowerCase()) ||
          (uidToRemove && currentUser.uid === uidToRemove))
      ) {
        await AsyncStorage.removeItem("current_user");
        await AsyncStorage.removeItem("app_locked");
      }

      setSavedAccounts(filtered);
      setSelectedAccount(filtered[0] || null);

      if (!filtered.length) {
        navigation.replace("SelectRole");
      }
    } catch (e) {
      console.log("Error removing deleted account locally:", e);
    }
  };

  const checkPasscode = async (enteredCode) => {
    try {
      if (!selectedAccount?.email) {
        Alert.alert("Error", "Please select an account");
        setInput("");
        return;
      }

      setLoading(true);

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (e) {}

      const authPassword = buildAuthPassword(enteredCode);

      const credential = await signInWithEmailAndPassword(
        auth,
        selectedAccount.email,
        authPassword
      );

      const user = credential.user;
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        await removeDeletedAccountLocally(selectedAccount.email, user.uid);
        setInput("");
        Alert.alert("Error", "This account was removed from Firebase");
        return;
      }

      const userData = userSnap.data();
      const normalizedRole = normalizeRole(userData.role);

      const currentUserData = {
        uid: user.uid,
        email: userData.email || selectedAccount.email,
        fullName: userData.fullName || selectedAccount.fullName || "",
        role: normalizedRole || selectedAccount.role || "",
        patientId: userData.patientId || "",
      };

      await AsyncStorage.setItem(
        "current_user",
        JSON.stringify(currentUserData)
      );
      await AsyncStorage.setItem("hasAccount", "true");
      await AsyncStorage.removeItem("app_locked");

      const existingJson = await AsyncStorage.getItem("saved_accounts");
      const existing = existingJson ? JSON.parse(existingJson) : [];
      const updatedAccounts = mergeAccounts(existing, [currentUserData]);

      await AsyncStorage.setItem(
        "saved_accounts",
        JSON.stringify(updatedAccounts)
      );
      setSavedAccounts(updatedAccounts);

      if (!normalizedRole) {
        navigation.replace("SelectRole");
      } else if (normalizedRole === "Patient") {
        navigation.replace("PatientHome");
      } else if (normalizedRole === "Caregiver") {
        if (userData.patientId) {
          navigation.replace("CaregiverHome");
        } else {
          navigation.replace("CaregiverSetup");
        }
      } else {
        navigation.replace("SelectRole");
      }
    } catch (error) {
      console.log("Passcode check error:", error);

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        await removeDeletedAccountLocally(
          selectedAccount?.email || "",
          selectedAccount?.uid || ""
        );
      }

      let message = "Wrong passcode";

      if (error.code === "auth/user-not-found") {
        message = "This account was removed from Firebase";
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        message = "Wrong passcode";
      }

      setInput("");
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = async (num) => {
    if (loading) return;
    if (input.length >= PASSCODE_LENGTH) return;

    const newValue = input + num;
    setInput(newValue);

    if (newValue.length === PASSCODE_LENGTH) {
      setTimeout(async () => {
        await checkPasscode(newValue);
      }, 150);
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setInput((prev) => prev.slice(0, -1));
  };

  const handleCreateNewAccount = () => {
    navigation.replace("SelectRole");
  };

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

        <Text style={styles.title}>Enter Passcode</Text>
        <Text style={styles.subtitle}>
          Select your account and enter your 4-digit code
        </Text>

        <View style={styles.card}>
          {!!savedAccounts.length && (
            <>
              <Text style={styles.accountTitle}>Saved Accounts</Text>

              <View style={styles.accountsWrap}>
                {savedAccounts.map((account, index) => {
                  const isActive =
                    selectedAccount?.email?.toLowerCase() ===
                      account.email?.toLowerCase() ||
                    (selectedAccount?.uid &&
                      selectedAccount?.uid === account.uid);

                  return (
                    <TouchableOpacity
                      key={`${account.email || account.uid || "account"}-${index}`}
                      style={[
                        styles.accountChip,
                        isActive && styles.accountChipActive,
                      ]}
                      onPress={() => {
                        if (loading) return;
                        setSelectedAccount(account);
                        setInput("");
                      }}
                    >
                      <Text
                        style={[
                          styles.accountName,
                          isActive && styles.accountNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {account.fullName?.trim() || account.role || "Account"}
                      </Text>

                      <Text
                        style={[
                          styles.accountEmail,
                          isActive && styles.accountEmailActive,
                        ]}
                        numberOfLines={1}
                      >
                        {account.email || "No Email"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Passcode</Text>

          <View style={styles.dotsRow}>
            {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, input.length > i && styles.dotFilled]}
              />
            ))}
          </View>

          <Text style={styles.helper}>
            {loading ? "Please wait..." : "Enter your passcode"}
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

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNewAccount}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>Create New Account</Text>
          </TouchableOpacity>

          <Text style={styles.stepText}>{loading ? "Checking..." : ""}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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

  accountTitle: {
    color: "#082B6F",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },

  accountsWrap: {
    marginBottom: 16,
  },

  accountChip: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  accountChipActive: {
    borderColor: "#1677F2",
    backgroundColor: "#EAF4FF",
  },

  accountName: {
    color: "#082B6F",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },

  accountNameActive: {
    color: "#1677F2",
  },

  accountEmail: {
    color: "#6F7F95",
    fontSize: 12,
  },

  accountEmailActive: {
    color: "#1677F2",
  },

  label: {
    fontSize: 15,
    fontWeight: "900",
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
    borderWidth: 0,
  },

  keyText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1677F2",
  },

  createButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
  },

  createButtonText: {
    color: "#1677F2",
    fontSize: 14,
    fontWeight: "900",
  },

  stepText: {
    textAlign: "center",
    marginTop: 10,
    color: "#1677F2",
    fontWeight: "800",
    minHeight: 20,
  },
});