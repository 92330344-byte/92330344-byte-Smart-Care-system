import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          Alert.alert("Error", "No user found");
          navigation.goBack();
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.fullName || "");
          setEmail(data.email || "");
          setAge(data.age ? String(data.age) : "");
          setRole(data.role || "Patient");
        } else {
          await setDoc(
            doc(db, "users", user.uid),
            {
              fullName: "",
              email: user.email || "",
              age: "",
              role: "Patient",
            },
            { merge: true }
          );
          setRole("Patient");
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      if (!fullName.trim() || !email.trim() || !age.trim()) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      setSaving(true);

      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          age: age.trim(),
          role: role || "Patient",
        },
        { merge: true }
      );

      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#1677F2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

          <Text style={styles.headerText}>Profile</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.avatarName}>
            {fullName.trim() ? fullName : "Patient"}
          </Text>
          <Text style={styles.avatarRole}>{role || "Patient"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor="#9AA9BA"
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

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#9AA9BA"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Role</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText}>{role || "Patient"}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

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

  avatarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarIcon: {
    fontSize: 42,
  },

  avatarName: {
    color: "#082B6F",
    fontSize: 23,
    fontWeight: "900",
  },

  avatarRole: {
    color: "#1677F2",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    marginBottom: 28,
    elevation: 3,
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
    marginTop: 12,
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

  readOnlyBox: {
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  readOnlyText: {
    color: "#1677F2",
    fontSize: 15,
    fontWeight: "900",
  },

  saveButton: {
    backgroundColor: "#1677F2",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});