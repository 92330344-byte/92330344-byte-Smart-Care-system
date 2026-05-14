import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./SplashScreen";
import PasscodeSetupScreen from "./PasscodeSetupScreen";
import EnterPasscodeScreen from "./EnterPasscodeScreen";
import SelectRoleScreen from "./SelectRoleScreen";
import PatientHomeScreen from "./PatientHomeScreen";
import CaregiverHomeScreen from "./CaregiverHomeScreen";
import SettingsScreen from "./SettingsScreen";
import ProfileScreen from "./ProfileScreen";
import MedicationsScreen from "./MedicationsScreen";
import AddMedicationScreen from "./AddMedicationScreen";
import MedicationNotificationsScreen from "./MedicationNotificationsScreen";
import LocationScreen from "./LocationScreen";
import CaregiverSettingsScreen from "./CaregiverSettingsScreen";
import CaregiverProfileScreen from "./CaregiverProfileScreen";
import CaregiverSetupScreen from "./CaregiverSetupScreen";
import SOSScreen from "./SOSScreen";
import PatientEmergencyButtonScreen from "./PatientEmergencyButtonScreen";
import ChangePasscodeScreen from "./ChangePasscodeScreen";
import HeartRateDetailsScreen from "./HeartRateDetailsScreen";
import OxygenDetailsScreen from "./OxygenDetailsScreen";
import PatientBasicInfoScreen from "./PatientBasicInfoScreen";
import CaregiverInfoScreen from "./CaregiverInfoScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="PasscodeSetup" component={PasscodeSetupScreen} />
        <Stack.Screen name="EnterPasscode" component={EnterPasscodeScreen} />
        <Stack.Screen name="SelectRole" component={SelectRoleScreen} />
        <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
        <Stack.Screen name="CaregiverHome" component={CaregiverHomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Medications" component={MedicationsScreen} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
        <Stack.Screen name="MedicationNotifications" component={MedicationNotificationsScreen}/>
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="CaregiverSetup" component={CaregiverSetupScreen} />
        <Stack.Screen name="CaregiverSettings" component={CaregiverSettingsScreen} />
        <Stack.Screen name="CaregiverProfile" component={CaregiverProfileScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
        <Stack.Screen name="PatientEmergencyButton" component={PatientEmergencyButtonScreen} />
        <Stack.Screen name="ChangePasscode" component={ChangePasscodeScreen} />
        <Stack.Screen name="HeartRateDetails" component={HeartRateDetailsScreen}/>
        <Stack.Screen name="OxygenDetails" component={OxygenDetailsScreen}/>
        <Stack.Screen name="PatientBasicInfo" component={PatientBasicInfoScreen} />
        <Stack.Screen name="CaregiverInfo" component={CaregiverInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}