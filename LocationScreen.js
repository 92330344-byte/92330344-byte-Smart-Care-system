import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const PRIMARY = "#1677F2";
const DARK = "#082B6F";

export default function LocationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
  const [targetName, setTargetName] = useState("");

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLocation();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchLocation = async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "No user found");
        navigation.goBack();
        return;
      }

      const currentUserRef = doc(db, "users", user.uid);
      const currentUserSnap = await getDoc(currentUserRef);

      if (!currentUserSnap.exists()) {
        Alert.alert("Error", "User data not found");
        navigation.goBack();
        return;
      }

      const currentUserData = currentUserSnap.data();
      let displayName = currentUserData.fullName || "Patient";

      if (currentUserData.role === "Caregiver") {
        if (!currentUserData.patientId) {
          Alert.alert("Error", "No patient linked");
          setLoading(false);
          return;
        }

        const patientRef = doc(db, "users", currentUserData.patientId);
        const patientSnap = await getDoc(patientRef);

        if (!patientSnap.exists()) {
          Alert.alert("Error", "Patient not found");
          setLoading(false);
          return;
        }

        const patientData = patientSnap.data();
        displayName = patientData.fullName || "Patient";

        setLocationData({
          latitude: patientData.latitude,
          longitude: patientData.longitude,
          updatedAt: patientData.locationUpdatedAt || "",
        });
        setTargetName(displayName);
        return;
      }

      setLocationData({
        latitude: currentUserData.latitude,
        longitude: currentUserData.longitude,
        updatedAt: currentUserData.locationUpdatedAt || "",
      });
      setTargetName(displayName);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
    if (!locationData?.latitude || !locationData?.longitude) return;

    const url = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const hasLocation = locationData?.latitude && locationData?.longitude;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Location</Text>

        <View style={styles.headerSpacer} />
      </View>

      {!hasLocation ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No Location Saved</Text>
          <Text style={styles.emptySub}>
            Save the patient location first from the patient dashboard.
          </Text>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>📍</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{targetName || "Patient"}</Text>
              <Text style={styles.sub}>
                Last update: {locationData.updatedAt || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.mapCard}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              region={{
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                }}
                title={targetName || "Patient"}
                description="Saved patient location"
              />
            </MapView>
          </View>

          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Coordinates</Text>
            <Text style={styles.coordsText}>Latitude: {locationData.latitude}</Text>
            <Text style={styles.coordsText}>Longitude: {locationData.longitude}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={openMaps}>
            <Text style={styles.buttonText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
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

  headerSpacer: {
    width: 44,
    height: 44,
  },

  infoCard: {
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

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  icon: {
    fontSize: 28,
  },

  name: {
    color: DARK,
    fontSize: 19,
    fontWeight: "900",
  },

  sub: {
    color: "#6F7F95",
    fontSize: 12,
    marginTop: 4,
  },

  mapCard: {
    height: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 14,
  },

  map: {
    flex: 1,
  },

  coordsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 2,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 14,
  },

  coordsTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  coordsText: {
    color: "#6F7F95",
    fontSize: 13,
    marginBottom: 4,
  },

  button: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 28,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 80,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 21,
    fontWeight: "900",
  },

  emptySub: {
    color: "#6F7F95",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },

  refreshButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
  },

  refreshText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});