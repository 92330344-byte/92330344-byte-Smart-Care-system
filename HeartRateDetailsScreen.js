import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ref, onValue } from "firebase/database";
import { realtimeDb, auth } from "./firebaseConfig";

const screenWidth = Dimensions.get("window").width;
const PRIMARY = "#1677F2";
const DARK = "#082B6F";

export default function HeartRateDetailsScreen({ navigation }) {
  const [latestHeartRate, setLatestHeartRate] = useState(0);
  const [heartRateData, setHeartRateData] = useState([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

if (!uid) return;

const patientRef = ref(realtimeDb, `patients/${uid}`);
    const unsubscribe = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const currentHeartRate = data.heartRate ?? 0;
        setLatestHeartRate(currentHeartRate);

        setHeartRateData((prev) => {
          const updated = [...prev, currentHeartRate];
          return updated.slice(-6);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const labels = ["-5", "-4", "-3", "-2", "-1", "Now"];

  const safeHeartRateData = useMemo(() => {
    return heartRateData.map((value) => (typeof value === "number" ? value : 0));
  }, [heartRateData]);

  const average =
    safeHeartRateData.length > 0
      ? Math.round(
          safeHeartRateData.reduce((sum, value) => sum + value, 0) /
            safeHeartRateData.length
        )
      : 0;

  const minValue =
    safeHeartRateData.length > 0 ? Math.min(...safeHeartRateData) : 0;

  const maxValue =
    safeHeartRateData.length > 0 ? Math.max(...safeHeartRateData) : 0;

  const status =
    latestHeartRate > 100 || (latestHeartRate > 0 && latestHeartRate < 50)
      ? "Needs Attention"
      : "Normal";

  const observationText =
    latestHeartRate > 100
      ? "The heart rate is currently above the normal range and may need attention."
      : latestHeartRate > 0 && latestHeartRate < 50
      ? "The heart rate is currently below the normal range and may need attention."
      : "The heart rate is currently stable and updated live from Firebase.";

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 119, 242, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(111, 127, 149, ${opacity})`,
    strokeWidth: 2,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: PRIMARY,
    },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.blueCircle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>Heart Rate</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mainCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.heartIcon}>💙</Text>
        </View>

        <Text style={styles.value}>
          {latestHeartRate > 0 ? latestHeartRate : "--"}
          <Text style={styles.unit}> bpm</Text>
        </Text>

        <Text style={[styles.status, status === "Needs Attention" && styles.danger]}>
          {status}
        </Text>

        <Text style={styles.observation}>{observationText}</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Live Heart Rate Graph</Text>

        <LineChart
          data={{
            labels,
            datasets: [{ data: safeHeartRateData }],
          }}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          withInnerLines={false}
          withOuterLines={false}
          style={styles.chart}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{average}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{minValue}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{maxValue}</Text>
        </View>
      </View>
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

  headerSpacer: {
    width: 44,
    height: 44,
  },

  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  heartIcon: {
    fontSize: 46,
  },

  value: {
    color: PRIMARY,
    fontSize: 44,
    fontWeight: "900",
  },

  unit: {
    fontSize: 20,
    fontWeight: "800",
  },

  status: {
    color: "#1FA463",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  danger: {
    color: "#E53935",
  },

  observation: {
    color: "#6F7F95",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 12,
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 3,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
  },

  cardTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  chart: {
    borderRadius: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EEF8",
    elevation: 2,
    shadowColor: "#A8C7EE",
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  statLabel: {
    color: "#6F7F95",
    fontSize: 12,
    fontWeight: "700",
  },

  statValue: {
    color: PRIMARY,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
});