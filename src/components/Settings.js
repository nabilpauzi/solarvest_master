import BackgroundFetch from "react-native-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  FlatList,
} from "react-native";
import axios from "axios";
import { defaultCategories } from "../const/data";
import {
  getCustomCategoryNames,
  updateCategoryName,
  resetCategoryNames,
} from "../utils/categoryUtils";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome6";


export const Settings = ({ navigation }) => {
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [clientId, setClientId] = useState();
  const [clientSecret, setClientSecret] = useState();
  const [tenantId, setTenantId] = useState();
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  // Category name editing state
  const [categoryNames, setCategoryNames] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  // Load category names when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCategoryNames();
    }, [])
  );

  const loadCategoryNames = async () => {
    try {
      const customNames = await getCustomCategoryNames();
      // Initialize with default names, then override with custom names
      const initialNames = {};
      defaultCategories.forEach((cat) => {
        initialNames[cat.name] = customNames[cat.name] || cat.name;
      });
      setCategoryNames(initialNames);
    } catch (error) {
      console.error("Error loading category names:", error);
    }
  };

  const handleCategoryNameChange = (originalName, newName) => {
    setCategoryNames((prev) => ({
      ...prev,
      [originalName]: newName,
    }));
  };

  const saveCategoryName = async (originalName) => {
    try {
      const newName = categoryNames[originalName];
      const success = await updateCategoryName(originalName, newName);
      if (success) {
        Alert.alert("Success", "Category name saved successfully!");
        setEditingCategory(null);
        // Reload to ensure consistency
        await loadCategoryNames();
      } else {
        Alert.alert("Error", "Failed to save category name");
      }
    } catch (error) {
      console.error("Error saving category name:", error);
      Alert.alert("Error", "Failed to save category name");
    }
  };

  const resetAllCategoryNames = async () => {
    Alert.alert(
      "Reset Category Names",
      "Are you sure you want to reset all category names to default?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetCategoryNames();
              await loadCategoryNames();
              Alert.alert("Success", "All category names have been reset to default");
            } catch (error) {
              console.error("Error resetting category names:", error);
              Alert.alert("Error", "Failed to reset category names");
            }
          },
        },
      ]
    );
  };

  const logout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            AsyncStorage.setItem("isLoggedIn", JSON.stringify(false));
            Alert.alert("User Loged Out!");
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  const changeSharepointCredentials = async () => {
    const userCredentialsJSON = await AsyncStorage.getItem("userCredentials");
    const userCredentials = JSON.parse(userCredentialsJSON);
    if (userCredentials.login) {
      console.log(clientId);
      if (clientId == null || clientSecret == null || tenantId == null) {
        Alert.alert("Each input need to be filled!");
        return;
      }
      const newCredential = {
        clientId: clientId,
        clientSecret: clientSecret,
        tenantId: tenantId,
      };
      const jsonString = JSON.stringify(newCredential);

      AsyncStorage.setItem("sharepointCredentials", jsonString)
        .then(() => {
          Alert.alert(
            "Credentials for Sharepoint have been changed Please Restart the Application"
          );
          console.log("sharepoint credentials changed");
        })
        .catch((error) => {
          console.log("Error storing user credentials:", error);
        });
    } else {
      Alert.alert("It seems you are not logged in!");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        flexDirection: "column",
        rowGap: 20,
      }}
    >
      {/* Category Name Editor Section */}
      <View style={{ rowGap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>Category Names</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryEditor(!showCategoryEditor)}
            style={{
              padding: 8,
              borderRadius: 5,
              backgroundColor: "#8829A0",
            }}
          >
            <Icon
              name={showCategoryEditor ? "chevron-up" : "chevron-down"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {showCategoryEditor && (
          <View>
            <FlatList
              data={defaultCategories}
              keyExtractor={(item) => item.name}
              style={{ maxHeight: 500 }}
              contentContainerStyle={{ rowGap: 15, paddingBottom: 10 }}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              renderItem={({ item: category }) => (
                <View style={{ rowGap: 5 }}>
                  <Text style={styles.labelText}>
                    {category.name} {category.icon && `(${category.icon})`}
                  </Text>
                  <View style={{ flexDirection: "row", columnGap: 10 }}>
                    <TextInput
                      style={[
                        styles.inputContainer,
                        { flex: 1 },
                        editingCategory === category.name && {
                          borderColor: "#8829A0",
                          borderWidth: 2,
                        },
                      ]}
                      placeholder="Enter custom name"
                      placeholderTextColor="#4b4b4b"
                      value={categoryNames[category.name] || ""}
                      onChangeText={(text) =>
                        handleCategoryNameChange(category.name, text)
                      }
                      onFocus={() => setEditingCategory(category.name)}
                      editable={true}
                    />
                    {editingCategory === category.name && (
                      <TouchableOpacity
                        onPress={() => saveCategoryName(category.name)}
                        style={{
                          backgroundColor: "#8829A0",
                          padding: 10,
                          borderRadius: 5,
                          justifyContent: "center",
                          alignItems: "center",
                          minWidth: 60,
                        }}
                      >
                        <Icon name="check" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              ListFooterComponent={
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Reset All to Default"
                    onPress={resetAllCategoryNames}
                    color="#ff6b6b"
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#666",
                      fontStyle: "italic",
                      marginTop: 10,
                    }}
                  >
                    Note: Changes will take effect after restarting the app or
                    navigating away and back.
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Sharepoint Feature Login</Text>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Username :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setUsername}
                        value={clientId}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Password :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setPassword}
                        value={clientId}
                    />
                </View>
                <Button title='LogOut' onPress={logout} />
            </View> */}
      <Button title="LogOut" onPress={logout} />
      {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Phone Storage Save</Text>
                <View style={{ flexDirection: 'row', columnGap: 30 }}>
                    <Text style={{ ...styles.labelText, marginBottom: 0 }}>Client-ID :</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#8829A0' }}
                        thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
                        ios_backgroundColor="#8829A0"
                        onValueChange={toggleSwitch}
                        value={isEnabled}
                    />
                </View>
            </View> */}
      {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Sharepoint Credentials</Text>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Client-ID :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setClientId}
                        value={clientId}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Client-Secret :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client Secret"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setClientSecret}
                        value={clientSecret}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Tenant-ID :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Tenant ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setTenantId}
                        value={tenantId}
                    />
                </View>
                <Button title='Set Credentials' onPress={changeSharepointCredentials} />
            </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#8829A0",
  },
  textInputView: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  labelText: {
    color: "#000000",
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
  },
  inputContainer: {
    padding: 10,
    color: "#000000",
    fontSize: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    width: "100%",
  },
});
