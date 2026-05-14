import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";

const PRIMARY = "#1677F2";
const DARK = "#082B6F";

export default function MedicationsScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [targetUserId, setTargetUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadMedications = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMedications([]);
        setFilteredMedications([]);
        return;
      }

      const currentUserRef = doc(db, "users", user.uid);
      const currentUserSnap = await getDoc(currentUserRef);

      if (!currentUserSnap.exists()) {
        setMedications([]);
        setFilteredMedications([]);
        return;
      }

      const currentUserData = currentUserSnap.data();
      let finalTargetUserId = user.uid;
      const role = currentUserData.role || "";

      if (role === "Caregiver") {
        if (!currentUserData.patientId) {
          setMedications([]);
          setFilteredMedications([]);
          return;
        }

        finalTargetUserId = currentUserData.patientId;
      }

      setTargetUserId(finalTargetUserId);
      setCurrentRole(role);

      const q = query(
        collection(db, "users", finalTargetUserId, "medications"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      const list = [];
      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });

      setMedications(list);

      if (!search.trim()) {
        setFilteredMedications(list);
      } else {
        const keyword = search.trim().toLowerCase();
        setFilteredMedications(
          list.filter((item) =>
            item.name?.toLowerCase().includes(keyword)
          )
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearch(text);

    if (!text.trim()) {
      setFilteredMedications(medications);
      return;
    }

    const keyword = text.trim().toLowerCase();
    setFilteredMedications(
      medications.filter((item) =>
        item.name?.toLowerCase().includes(keyword)
      )
    );
  };

  const deleteMedication = async (medicationId) => {
    try {
      if (!targetUserId) return;

      await deleteDoc(doc(db, "users", targetUserId, "medications", medicationId));
      await loadMedications();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const confirmDelete = (medicationId) => {
    Alert.alert("Delete Medication", "Are you sure you want to delete it?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMedication(medicationId),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Medications</Text>

        <TouchableOpacity
          style={styles.addTopButton}
          onPress={() =>
            navigation.navigate("AddMedication", {
              targetUserId,
            })
          }
        >
          <Text style={styles.addTopText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Text style={styles.summaryEmoji}>💊</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>Medication Reminders</Text>
          <Text style={styles.summarySub}>
            {currentRole === "Caregiver"
              ? "Manage the linked patient medications"
              : "Manage your medication schedule"}
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={handleSearch}
        placeholder="Search medication..."
        placeholderTextColor="#9AA9BA"
      />

      {filteredMedications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Medications</Text>
          <Text style={styles.emptySub}>
            Add a medication reminder to see it here.
          </Text>
        </View>
      ) : (
        filteredMedications.map((item) => (
          <View key={item.id} style={styles.medCard}>
            <View style={styles.medIconCircle}>
              <Text style={styles.medIcon}>💊</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{item.name || "Medication"}</Text>
              <Text style={styles.medDetails}>
                Time: {item.time || "--"}  •  Pills: {item.pills || "--"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item.id)}
            >
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate("AddMedication", {
            targetUserId,
          })
        }
      >
        <Text style={styles.addButtonText}>＋ Add Medication</Text>
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
    fontSize: 26,
    fontWeight: "900",
  },

  addTopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7BAFFF",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  addTopText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: -2,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  summaryEmoji: {
    fontSize: 28,
  },

  summaryTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
  },

  summarySub: {
    color: "#6F7F95",
    fontSize: 13,
    marginTop: 4,
  },

  searchInput: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D8E9FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: DARK,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: "900",
  },

  emptySub: {
    color: "#6F7F95",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  medCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  medIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  medIcon: {
    fontSize: 24,
  },

  medName: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
  },

  medDetails: {
    color: "#6F7F95",
    fontSize: 12,
    marginTop: 4,
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: "#E31B3F",
    fontSize: 24,
    fontWeight: "700",
    marginTop: -2,
  },

  addButton: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});