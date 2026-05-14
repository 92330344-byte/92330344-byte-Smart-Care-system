import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function BackButton({ navigation }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <Text style={styles.back}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});