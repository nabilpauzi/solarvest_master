/** CODING MADE BY FAAEZ AMIRUDDIN (WARNING: DO NOT REMOVE AUTHOR'S NAME)
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import "react-native-gesture-handler";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
/*import * as Progress from 'react-native-progress';*/
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Linking, Platform, TouchableWithoutFeedback } from "react-native";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  TextInput,
  Button,
  Alert,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from "react-native";
import {
  NavigationContainer,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from "react-native/Libraries/NewAppScreen";
import Icon from "react-native-vector-icons/FontAwesome6";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import pptxgen from "pptxgenjs";
import RNFS from "react-native-fs";
import { ListItem } from "@rneui/themed";
import CheckBox from "@react-native-community/checkbox";
import axios from "axios";
import Pinchable from "react-native-pinchable";
import { btoa, atob, toByteArray} from "react-native-quick-base64";
import { Settings } from "./src/components/Settings.js";
import { retrieveAccessToken } from "./src/utils/sharePointUtils.js";

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import TestScreen from "./src/components/test";

import {
  backgroundImg,
  titleBackgroundImg,
  mainBackground,
  titleLogo,
  siteInfoLogo,
  dropPointIcon,
} from "./src/assets/images.js";
import {
  CategoryScreen,
  token,
  formDigest,
  CameraScreen,
} from "./src/components/Category";
import BackgroundFetch from "react-native-background-fetch";
import { LogBox } from "react-native";

import shareFile, { saveToDownloads } from "./src/utils/shareUtils.js";

import { categories } from "./src/const/data.js";

import { generateUniqueId } from "./src/utils/commonUtils.js";

LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

// Define the order sequence for categories in PowerPoint presentation
// This ensures categories appear in the correct order in the PPT
const categoryOrderMap = categories.reduce((acc, category, index) => {
  acc[category.name] = index + 1; // Start from 1, not 0
  return acc;
}, {});

const Stack = createNativeStackNavigator();

export const SettingsContext = createContext();

//////////////////////////// Project Screen ////////////////////////////////////////////////////////

const ProjectScreen = ({ navigation }) => {
  const [project, setProject] = useState("");
  const [projectNames, setProjectNames] = useState([]);
  const [tokenData, setTokenData] = useState("");

  const goCategory = async (project) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    navigation.navigate("Categories", {
      project: project,
    });
  };

  const createProject = async () => {
    if (project.trim() === "") {
      Alert.alert("Error", "Please enter a project name");
      return;
    }
    try {
      // await AsyncStorage.removeItem('projectName');
      const existingProjects = await AsyncStorage.getItem("projectName");
      const parsedExistingProjects = existingProjects
        ? JSON.parse(existingProjects)
        : [];

      const isProjectNameExists = parsedExistingProjects.some(
        (existingProject) => existingProject === project
      );

      if (isProjectNameExists) {
        Alert.alert("Error", "Project name already exists");
        return;
      }

      const updatedProjects = [...parsedExistingProjects, project];

      await AsyncStorage.setItem(
        "projectName",
        JSON.stringify(updatedProjects)
      );
      //************Sharepoint Folder Upload **************/
      try {
        const [accessToken, formDigest] = await retrieveAccessToken();
        const folderUploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
        if (accessToken && formDigest) {
          const response = await axios({
            method: "POST",
            url: folderUploadUri,
            data: {
              __metadata: {
                type: "SP.Folder",
              },
              ServerRelativeUrl: `ListofImage/${project}`,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-RequestDigest": formDigest,
            },
          });
          console.log("project created:" + project);
        }
      } catch (error) {
        console.log("error in creating project", error);
      }

      Alert.alert("Project Created", "Project name saved successfully", [
        { text: "OK", onPress: () => goCategory(project) },
      ]);
    } catch (error) {
      console.error("Error saving project name to AsyncStorage:", error);
    }
  };

  /* CODING MADE BY FAAEZ AMIRUDDIN */
  const loadProjects = async () => {
    try {
      const storedProjectNames = await AsyncStorage.getItem("projectName");
      const existingProjectNames = storedProjectNames
        ? JSON.parse(storedProjectNames)
        : [];

      setProjectNames(existingProjectNames);
      // if(TokenCredentials.login){
      //   try{
      //     const fetchUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage')?$expand=Folders`;
      //     const response = await axios({
      //       method: 'GET',
      //       url: fetchUri,
      //       headers: {
      //         'Authorization': `Bearer ${TokenCredentials.token}`,
      //         'Accept': 'application/json; odata=verbose',
      //       },
      //     });

      //     const responseData = response.data.d.Folders.results;

      //     // Extract folder names from SharePoint response
      //     const newProjectNames = responseData.map(folder => folder.Name);
      //     console.log(newProjectNames);
      //     // Merge newProjectNames with existingProjectNames and remove duplicates
      //     const updatedProjectNamesSet = new Set([...existingProjectNames, ...newProjectNames]);
      //     const updatedProjectNames = Array.from(updatedProjectNamesSet);

      //     // Update project names state
      //     setProjectNames(updatedProjectNames);
      //     console.log("Retrieved Project from Sharepoint");
      //   }catch(error){
      //     console.log(error.response.data);
      //   }
      // }
    } catch (error) {
      console.error("Error loading project name from AsyncStorage:", error);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [])
  );

  const deleteProject = async (projectName) => {
    Alert.alert(
      "Delete Project?",
      "Deleting this Project means all the picture inside will be permanently deleted on your phone\n\nEnsure the Picture have been uploaded to sharepoint first",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            const storedProjectNames = await AsyncStorage.getItem(
              "projectName"
            );
            const storedImages = await AsyncStorage.getItem("imageCategory");
            const projectNamesArray = JSON.parse(storedProjectNames);
            const imagesArray = JSON.parse(storedImages);

            const deletedProject = projectNamesArray.filter(
              (project) => project == projectName
            );

            const deletedImages = imagesArray.filter(
              (image) => image.project == projectName
            );
            deletedImages.forEach((item) => {
              RNFS.unlink(item.picture)
                .then(() => {
                  console.log("FILE DELETED from local");
                })
                .catch((err) => {
                  console.log(err.message);
                });
            });

            const updatedProjectNames = projectNamesArray.filter(
              (project) => project !== projectName
            );
            const updatedImages = imagesArray.filter(
              (image) => image.project !== projectName
            );

            await AsyncStorage.setItem(
              "projectName",
              JSON.stringify(updatedProjectNames)
            );
            await AsyncStorage.setItem(
              "imageCategory",
              JSON.stringify(updatedImages)
            );
            loadProjects();
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={{ flex: 1, rowGap: 10, padding: 20 }}>
      <TextInput
        style={{
          ...styles.inputContainer,
          padding: 25,
          color: "#4b4b4b",
          fontSize: 25,
        }}
        placeholder="Project Name"
        placeholderTextColor="#4b4b4b"
        onChangeText={setProject}
      />

      <Button
        title="CREATE PROJECT"
        onPress={() => {
          Alert.alert(
            "Create Project?",
            "Ensure your project name is unique so it doesnt clash with the one existing in sharepoint!",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "OK",
                onPress: createProject, // Assuming createProject is your function to create a project
              },
            ],
            { cancelable: false }
          );
        }}
      />
      <Text>{tokenData}</Text>
      <Text style={[styles.title, { marginTop: 10 }]}>Project History</Text>
      <FlatList
        data={projectNames}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => goCategory(item)}
          >
            <Text style={styles.projectName}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

//////////////////////////// Home Screen ////////////////////////////////////////////////////////

const HomeScreen = ({ setCategoryName, route, navigation }) => {
  const { project } = route.params;
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [tempHolder, setTempHolder] = useState("");

  const goCategory = (name) => {
    setCategoryName(name);
    setTempHolder(name);
    setShouldNavigate(true);
  };

  useEffect(() => {
    const navigateAsync = async () => {
      if (shouldNavigate) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigation.navigate(tempHolder, {
          project: project,
          category: tempHolder,
          amount: categories.find((item) => item.name === tempHolder).amount,
          categoryId: null,
        });
        setShouldNavigate(false);
      }
    };

    navigateAsync();
  }, [shouldNavigate]);

  const [isDataFetched, setIsDataFetched] = useState(false);
  const projectRef = useRef(null);
  const [data, setData] = useState();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accessToken, formDigest] = await retrieveAccessToken();

        const storedDataJSON = await AsyncStorage.getItem("sharePointData");

        // if (storedDataJSON || projectRef.current === project) {
        //   console.log(storedDataJSON);
        //   setIsDataFetched(true);
        //   return;
        // }

        // ************Fetch Sharepoint Data***********
        const fetchUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${project}')?$expand=Folders`;
        const response = await axios({
          method: "GET",
          url: fetchUri,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json; odata=verbose",
          },
        });

        const responseData = response.data.d.Folders.results;
        let newData = [];
        await Promise.all(
          responseData.map(async (folder) => {
            const folderName = folder.Name;
            const foldersUri = folder.Folders.__deferred.uri;

            try {
              // Fetch the CategoryID
              const foldersResponse = await axios({
                method: "GET",
                url: foldersUri,
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/json;odata=verbose",
                },
              });

              if (
                foldersResponse.status === 200 &&
                foldersResponse.data.d.results
              ) {
                const subfolder = foldersResponse.data.d.results;
                // Fetch files inside the Category ID
                for (const subfiles of subfolder) {
                  const subfilesName = subfiles.Name;
                  const filesUri = subfiles.Files.__deferred.uri + "/$value";
                  try {
                    // fetch cateogry ID
                    const filesResponse = await axios({
                      method: "GET",
                      url: filesUri,
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json; odata=verbose",
                        "Content-Type": "image/jpg",
                      },
                      responseType: "arraybuffer",
                    });
                    // const arrayBuffer = await toByteArray(filesResponse);
                    if (
                      filesResponse.status === 200 &&
                      filesResponse.data.d.results
                    ) {
                      if (filesResponse.data.d.results.length !== 0) {
                        // const fileNamesInSubfolder = filesResponse.data.d.results.map(file => file.Name);
                        const files = filesResponse.data.d.results;
                        console.log("the files are: " + files);
                        // console.log(files);
                        for (const file of files) {
                          const pictureName = file.Name;
                          const picture = file.ServerRelativeUrl;
                          // console.log(picture)
                          newData.push({
                            id: generateUniqueId(),
                            project: project,
                            category: folderName,
                            categoryId: subfilesName,
                            picture: `https://solarvest.sharepoint.com${picture}`,
                            description: pictureName
                              .split("_")
                              .slice(-2, -1)[0]
                              .replace(".jpg", ""),
                            opt: null,
                          });
                          // console.log(`https://solarvest.sharepoint.com${picture}`);
                        }
                      }
                      // console.log(`Files inside ${folderName} No ${subfilesName}:`, files);
                    } else {
                      console.log(`No files found inside ${subfilesName}`);
                    }
                  } catch (error) {
                    console.error(
                      `Error fetching files for ${subfilesName}:`,
                      error
                    );
                  }
                }
              } else {
                console.log(`No subfolders found inside ${folderName}`);
              }
            } catch (error) {
              console.error(`Error fetching data for ${folderName}:`, error);
            }
          })
        );
        // console.log("new data is :" + newData);
        // Store fileNames in AsyncStorage
        await AsyncStorage.setItem("sharePointData", JSON.stringify(newData));
        setData(newData);
      } catch (error) {
        console.log("Error in fetching data: " + error);
      }
    };

    if (!isDataFetched || projectRef.current !== project) {
      projectRef.current = project;
    }
    // if (TokenCredentials.login) {
    //   fetchData();
    // }
  }, []);

  const [projectData, setProjectData] = useState([]);

  const formatData = (storedData, project) => {
    const filteredData = storedData.filter(
      (item) => item.project === project && item.opt != "delete"
    );

    const sections = filteredData.reduce((acc, item) => {
      const categoryKey = `${item.category}`;
      const categoryIdKey = `${item.categoryId}`;

      if (!acc[categoryKey]) {
        acc[categoryKey] = {};
      }

      if (!acc[categoryKey][categoryIdKey]) {
        acc[categoryKey][categoryIdKey] = [];
      }

      acc[categoryKey][categoryIdKey].push({
        ...item,
      });

      return acc;
    }, {});

    return categories
      .map(({ name }) => {
        const categoryData = sections[name] || {};
        return {
          title: name,
          data: Object.entries(categoryData).map(([categoryId, items]) => ({
            title: `No. ${categoryId}`,
            data: items.map((item, index) => {
              const nextIndex =
                index < items.length - 1
                  ? storedData.findIndex(
                      (elem) => elem.id === items[index + 1].id
                    )
                  : null;
              const prevIndex =
                index !== 0
                  ? storedData.findIndex(
                      (elem) => elem.id === items[index - 1].id
                    )
                  : null;
              const currentIndex = storedData.findIndex(
                (elem) => elem.id === item.id
              );
              // const nextIndex = index < items.length - 1 ? storedData.indexOf(items[index + 1]) : null;
              // const prevIndex = index != 0 ? storedData.indexOf(items[index - 1]) : null;
              // const currentIndex = storedData.indexOf(item);
              return {
                ...item,
                nextIndex,
                prevIndex,
                currentIndex,
              };
            }),
          })),
        };
      })
      .filter(({ data }) => data.length > 0);
  };

  const tempFetch = async () => {
    //temporary data Fetching
    try {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

      setProjectData(formatData(storedData, project));
    } catch (error) {
      console.log(error);
    }
  };

  const swapPictureItems = async (currentIndex, newIndex) => {
    try {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
      const removedItem = storedData.splice(currentIndex, 1)[0];
      storedData.splice(newIndex, 0, removedItem);

      await AsyncStorage.setItem("imageCategory", JSON.stringify(storedData));

      setProjectData(formatData(storedData, project));
    } catch (error) {
      console.error("Error swapping picture items:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      tempFetch();
    }, [])
  );

  const [expandedSections, setExpandedSections] = useState({});
  const toggleSection = (sectionTitle) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle],
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, rowGap: 15 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={{ width: "50%" }}
            onPress={() => goCategory(item.name)}
          >
            <View style={styles.itemContainer}>
              <Icon name={item.icon} size={20} color="#8829A0" />
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <PptModal projectData={projectData} project={project} />
      {/* <Button title="get data" onPress={fetchSharePointData} /> */}
      <View>
        <Text style={styles.title}>Pictures</Text>
        {projectData.map((category) => (
          <ListItem.Accordion
            key={category.title}
            content={
              <>
                <Text style={styles.sectionHeader}>{category.title}</Text>
              </>
            }
            isExpanded={expandedSections[category.title] || false}
            onPress={() => toggleSection(category.title)}
            containerStyle={{ backgroundColor: "transparent" }}
          >
            {category.data.map((categoryIdGroup) => (
              <ListItem.Accordion
                key={`category-${category.title}-${categoryIdGroup.title}`}
                content={
                  <>
                    <Text
                      style={{
                        ...styles.sectionHeader,
                        backgroundColor: "#8829A0",
                      }}
                    >
                      {categoryIdGroup.title}
                    </Text>
                  </>
                }
                isExpanded={
                  expandedSections[
                    `category-${category.title}-${categoryIdGroup.title}`
                  ] || false
                }
                onPress={() =>
                  toggleSection(
                    `category-${category.title}-${categoryIdGroup.title}`
                  )
                }
                containerStyle={{ backgroundColor: "transparent" }}
              >
                {categoryIdGroup.data.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.displayPictureContainer}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          columnGap: 15,
                          marginBottom: 5,
                          alignItems: "flex-end",
                          justifyContent: "flex-end",
                        }}
                      >
                        {index > 0 && (
                          <TouchableOpacity
                            onPress={() =>
                              swapPictureItems(
                                item.currentIndex,
                                item.prevIndex
                              )
                            }
                          >
                            <FontAwesome5
                              name="arrow-up"
                              size={17}
                              color="black"
                            />
                          </TouchableOpacity>
                        )}
                        {index < categoryIdGroup.data.length - 1 && (
                          <TouchableOpacity
                            onPress={() =>
                              swapPictureItems(
                                item.currentIndex,
                                item.nextIndex
                              )
                            }
                          >
                            <FontAwesome5
                              name="arrow-down"
                              size={17}
                              color="black"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Pinchable>
                          <Image
                            source={
                              item.picture == "null" || item.picture != null
                                ? { uri: item.picture }
                                : require("./src/assets/SolarvestFrontLogo.png")
                            }
                            style={styles.imageItem}
                          />
                        </Pinchable>
                        <Text style={styles.name}>
                          {item.category} - No. {item.categoryId}
                        </Text>
                        <Text style={styles.description}>
                          Description: {item.description || "no description"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ListItem.Accordion>
            ))}
          </ListItem.Accordion>
        ))}
        {/* {Object.values(data).map(item => (
            <View style={{flex:1}} key={item.id}>
              <Text>{item.category} - No. {item.categoryId}</Text>
              <Text>Description: {item.description || "no description"}</Text>
              <Text>{item.picture}</Text>
              <Image source={{ uri: item.picture }} style={{ width: 100, height: 100 }} />
              <Image source ={{uri: 'https://solarvest.sharepoint.com/:i:/r/sites/ProjectDevelopment/ListofImage/testing/TNB%20PE/1/171286429110116_undefined_TNB%20PE_1_.jpg?csf=1&web=1&e=gehA6u'}} style={{ width: 100, height: 100 }} />
            </View>
          ))} */}
        {/* <Button title="see fetched Data" onPress={async () => {
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            console.log(storedData);
          }} /> */}
      </View>
    </ScrollView>
  );
};

/* CODING MADE BY FAAEZ AMIRUDDIN */
const photoItems = [
  { color: "#0070C0", text: "inverter" },
  { color: "#000000", text: "Client MSB" },
  { color: "#FFC000", text: "Client SSB" },
  { color: "#7030A0", text: "PV-MSB" },
  { color: "#00B050", text: "TNB P/E" },
  { icon: dropPointIcon, text: "Cable Drop Point" },
  { shape: "#FF0000", text: "AC Cable" },
  { shape: "#FFC000", text: "DC Cable" },
];

const PptModal = ({ projectData, project }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Please wait...");

  useEffect(() => {
    console.log("Project data loaded:", projectData);
    const initialSelectedHeaders = projectData.map(
      (category) => category.title
    );

    const initialSelectedItems = projectData.reduce((acc, category) => {
      return acc.concat(
        category.data.reduce((innerAcc, categoryIdGroup) => {
          return innerAcc.concat(
            categoryIdGroup.data.map(
              (item) => `${item.category}No. ${item.categoryId}`
            )
          );
        }, [])
      );
    }, []);

    const uniqueInitialSelectedItems = [...new Set(initialSelectedItems)];

    setSelectedHeaders(initialSelectedHeaders);
    setSelectedItems(uniqueInitialSelectedItems);
    console.log("Initial selected headers:", initialSelectedHeaders);
    console.log("Initial selected items:", uniqueInitialSelectedItems);
  }, [projectData]);

  useEffect(() => {
    console.log("Selected headers updated:", selectedHeaders);
    const filteredSelectedHeaders = selectedHeaders.filter((header) => {
      return projectData.some((category) => category.title === header);
    });
    setSelectedHeaders(filteredSelectedHeaders);
    console.log("Filtered selected headers:", filteredSelectedHeaders);
  }, [selectedItems]);

  const handleHeaderCheck = (headerName, isChecked) => {
    if (isChecked) {
      setSelectedHeaders((prevHeaders) => [...prevHeaders, headerName]);
      console.log("Header added:", headerName);
      console.log("Header removed:", headerName);
    } else {
      setSelectedHeaders((prevHeaders) =>
        prevHeaders.filter((header) => header !== headerName)
      );
    }
  };

  const handleItemCheck = (itemName, isChecked) => {
    if (isChecked) {
      setSelectedItems((prevItems) => [...prevItems, itemName]);
      console.log("Item added:", itemName);
    } else {
      setSelectedItems((prevItems) =>
        prevItems.filter((item) => item !== itemName)
      );
      console.log("Item removed:", itemName);
    }
  };

  const uploadReport = async (fileDataABuffer, reportName, filePath) => {
    try {
      // Check if file size exceeds 200MB
      const fileLength = fileDataABuffer.byteLength
      console.log(fileLength)
      const fileInMB = (fileLength / (1000000)).toFixed(2); //Report size using base-10 (decimal) MB instead of base-2 (binary)
      console.log(fileInMB)
      if ( fileInMB > 200) {
        setTimeout(() => {
          Alert.alert(
            "File Size Exceeded",
            "The file size is more than 200MB. Please upload the file manually to Sharepoint.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Go to sharepoint",
                onPress: () => {
                  Linking.openURL(
                    `https://solarvest.sharepoint.com/sites/ProjectDevelopment/ListofImage/`
                  );
                },
              },
            ]
          );
        }, 100)
        return false;
      }


      setLoadingMessage("Report upload inprogress, it will take several minutes. Please wait...")
      setLoadingModal(true);
      const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${project}\')/Files/add(url=\'${reportName}\',overwrite=true)`;


      const [accessToken, formDigest] = await retrieveAccessToken();

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "X-RequestDigest": formDigest,
        Accept: "application/json; odata=verbose",
        "Content-Type": "application/octet-stream", // Required for binary
      }; 

      const response = await axios({
        method: "POST",
        url: fileUploadUrl,
        data: fileDataABuffer,
        headers: headers,
        maxBodyLength: Infinity,          // ← Important
        maxContentLength: Infinity,       // ← Important
        timeout: 10 * 60 * 1000,          // ← Optional: 10 min timeout
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percent}%`);
        },
        validateStatus: function (status) {
          console.log('Response status from SharePoint:', status);
          return true; // prevent throwing error for non-200
        },
      });

      // console.log(response.status)
      if (response.data.d.Exists) {
        console.log("Report Uploaded to Sharepoint: " + reportName);
        Alert.alert("PowerPoint Report Uploaded Successfully!", reportName);
        return true;
      }
    } catch (error) {
      console.log("Error Uploading Data in Sharepoint", error);
      // Alert.alert("Error Uploading Data in Sharepoint", error?.message || String(error));
      Alert.alert(
        "File Size Exceeded",
        "The file size is more than allowed limit by Sharepoint. Please upload the file manually to Sharepoint.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Go to sharepoint",
            onPress: () => {
              Linking.openURL(
                `https://solarvest.sharepoint.com/sites/ProjectDevelopment/ListofImage/`
              );
            },
          },
        ]
      );
      return false;
    } finally {
      setLoadingModal(false);
    }
  };

  const generatePowerpoint = async () => {
    console.log("Generating PowerPoint...");
    await generateTemplate();
    console.log("PowerPoint generated");
  };

  useEffect(() => {
    console.log("modalVisible:", modalVisible);
  }, [modalVisible]);

  useEffect(() => {
    console.log("loadingModal:", loadingModal);
  }, [loadingModal]);

  const writeFileInChunks = async (
    filePath,
    base64String,
    chunkSize = 1024 * 1024
  ) => {
    const totalChunks = Math.ceil(base64String.length / chunkSize);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = base64String.substring(i * chunkSize, (i + 1) * chunkSize);
      try {
        await RNFS.appendFile(filePath, chunk, "base64");
      } catch (error) {
        console.error("Error writing chunk to file:", error);
        throw error;
      }
    }
  };

  const writeLargePPTInChunks = async (filePath, arrayBuffer, chunkSize = 1024 * 1024)=> {
    const uint8Array = new Uint8Array(arrayBuffer);
    const totalSize = uint8Array.length;
    console.log(`Starting to write file: ${filePath}, Total size: ${totalSize} bytes, Chunks: ${Math.ceil(totalSize / chunkSize)}`);
    
    // Ensure directory exists
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    const dirExists = await RNFS.exists(dirPath);
    if (!dirExists) {
      console.log(`Directory does not exist, creating: ${dirPath}`);
      await RNFS.mkdir(dirPath);
    }
    
    // Clear file before writing (start fresh)
    try {
      await RNFS.writeFile(filePath, '', 'utf8');
    } catch (error) {
      console.warn("Warning: Could not clear file before writing:", error);
    }
    
    let bytesWritten = 0;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      const base64Chunk = Buffer.from(chunk).toString('base64');
      try {
        await RNFS.appendFile(filePath, base64Chunk, 'base64');
        bytesWritten += chunk.length;
        if ((i / chunkSize) % 10 === 0 || i + chunkSize >= totalSize) {
          console.log(`Progress: ${bytesWritten}/${totalSize} bytes (${((bytesWritten / totalSize) * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        console.error(`Error writing chunk ${i / chunkSize + 1} to file:`, error);
        console.error(`Error details:`, JSON.stringify(error, null, 2));
        throw error;
      }
    }
    console.log(`File write completed. Total bytes written: ${bytesWritten}`);
  }

  const generateTemplate = async () => {
    setLoadingModal(true);
    const font = "Century Gothic";
    try {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
      const filteredData = storedData.filter((item) => {
        const isItemChecked = selectedItems.includes(
          `${item.category}No. ${item.categoryId}`
        );
        const matchProject = item.project === project;
        const isNotDeleted = item.opt !== "delete";

        //
        /* let progressInterval = setInterval(() => {
           setProgress(prevProgress => {
             const newProgress = prevProgress + 0.01; // Increase progress by 1% each time
             return newProgress >= 1 ? 1 : newProgress; // Cap progress at 100%
           });
         }, 50); // Update progress every 50 milliseconds
       
         // Simulate PowerPoint generation
         setTimeout(() => {
           clearInterval(progressInterval); // Stop updating progress
           setIsGenerating(false);
           Alert.alert('PowerPoint generated successfully!');
         }, 5000); // Simulate a 5-second generation process
         // */

        return isItemChecked && matchProject && isNotDeleted;
      });

      let ppt = new pptxgen();

      // Sort data by category order (from categoryOrderMap) and then by categoryId within each category
      const sortedData = filteredData.sort((a, b) => {
        // First, sort by category order (using categoryOrderMap)
        const orderA = categoryOrderMap[a.category] !== undefined ? categoryOrderMap[a.category] : 9999;
        const orderB = categoryOrderMap[b.category] !== undefined ? categoryOrderMap[b.category] : 9999;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // If same category, sort by categoryId (convert to number for proper numeric sorting)
        const categoryIdA = parseInt(a.categoryId) || 0;
        const categoryIdB = parseInt(b.categoryId) || 0;
        return categoryIdA - categoryIdB;
      });

      const groupedData = {};
      let ttlCat, ttlCatItem;
      ttlCatItem = sortedData.length;
      sortedData.forEach((item) => {
        const { category } = item;
        if (!groupedData[category]) {
          groupedData[category] = [];
        }
        groupedData[category].push(item);
      });
      
      // Ensure items within each category are sorted by categoryId
      Object.keys(groupedData).forEach((category) => {
        groupedData[category].sort((a, b) => {
          const categoryIdA = parseInt(a.categoryId) || 0;
          const categoryIdB = parseInt(b.categoryId) || 0;
          return categoryIdA - categoryIdB;
        });
      });
      
      // Log sequence for verification
      console.log("=== PPT SEQUENCE VERIFICATION ===");
      const sortedCategories = Object.keys(groupedData).sort((catA, catB) => {
        const orderA = categoryOrderMap[catA] || 9999;
        const orderB = categoryOrderMap[catB] || 9999;
        return orderA - orderB;
      });
      sortedCategories.forEach((category, index) => {
        const items = groupedData[category];
        console.log(`${index + 1}. ${category} (Order: ${categoryOrderMap[category] || 'Unknown'}) - ${items.length} items`);
      });
      console.log("=== END SEQUENCE VERIFICATION ===");
      ttlCat =  Object.keys(groupedData).length;

      const firstPage = ppt.addSlide();
      firstPage.background = { data: backgroundImg };
      firstPage.addText("Client:", {
        x: 2.5,
        y: 1.6,
        w: "15%",
        h: 1,
        fontSize: 16,
        bold: true,
        color: "#666666",
        fontFace: font,
      });
      firstPage.addText("LOGO", {
        x: 2.5,
        y: 3,
        w: "15%",
        h: 1,
        fontSize: 20,
        bold: true,
        color: "#666666",
        fontFace: font,
      });
      firstPage.addText(project.toUpperCase(), {
        x: 5.5,
        y: 3,
        w: "50%",
        h: 1,
        fontSize: 20,
        bold: true,
        color: "#666666",
        fontFace: font,
      });
      const formattedDate = new Date()
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .replace(",", "")
        .replace(/(\d)(st|nd|rd|th)/, "$1$2");
      firstPage.addText(`Brief Summary| ${formattedDate}`, {
        x: 3,
        y: 4,
        w: "50%",
        h: 1,
        fontSize: 20,
        color: "#666666",
        fontFace: font,
      });
      const siteInformation = ppt.addSlide();
      siteInformation.background = { data: titleBackgroundImg };
      siteInformation.addText("SITE INFORMATION", {
        x: 0.5,
        y: 2,
        w: "50%",
        h: 1,
        fontSize: 28,
        bold: true,
        color: "#FFFFFF",
        fontFace: font,
      });
      siteInformation.addImage({
        data: siteInfoLogo,
        x: "90%",
        y: "90%",
        w: "30%",
        h: 1,
      });
      
      // Sort groupedData entries according to predefined category order
      const sortedGroupedEntries = Object.entries(groupedData).sort(([categoryA], [categoryB]) => {
        const orderA = categoryOrderMap[categoryA] !== undefined ? categoryOrderMap[categoryA] : 9999;
        const orderB = categoryOrderMap[categoryB] !== undefined ? categoryOrderMap[categoryB] : 9999;
        return orderA - orderB;
      });

      for (const [category, items] of sortedGroupedEntries) {
        // Add a new slide for the category
        const categorySlide = ppt.addSlide();
        categorySlide.background = { data: titleBackgroundImg };
        categorySlide.addText(`PROPOSED ${category.toUpperCase()}`, {
          x: 0.5,
          y: 2,
          w: "75%",
          h: 0.75,
          fontSize: 28,
          bold: true,
          color: "#FFFFFF",
        });
        categorySlide.addImage({
          data: titleLogo,
          x: "90%",
          y: "90%",
          w: "30%",
          h: 1,
        });

        //   // Iterate over the items under the current category to create slides
        //   items.forEach((item, index) => {
        //     const { categoryId, picture, description, orientation } = item;
        //     const itemSlide = ppt.addSlide();
        //     itemSlide.background = { data: mainBackground };
        //     // Add categoryId as a small header
        //     itemSlide.addText(`${category} - No. ${categoryId}`, {
        //       x: 0.2,
        //       y: 0.2,
        //       w: "40%",
        //       h: 0.5,
        //       fontSize: 24,
        //       bold: true,
        //       underline: true,
        //       color: "#BC1498",
        //       fontFace: font,
        //     });
        //     let yVal = 1;
        //     photoItems.forEach((item) => {
        //       if (item.color) {
        //         itemSlide.addShape(ppt.ShapeType.rect, {
        //           fill: { color: item.color, transparency: 80 },
        //           line: { color: item.color, width: 2 },
        //           x: 0.2,
        //           y: yVal,
        //           w: "2%",
        //           h: "3%",
        //         });
        //       } else if (item.icon) {
        //         itemSlide.addImage({
        //           data: dropPointIcon,
        //           x: 0.2,
        //           y: yVal,
        //           w: "2%",
        //           h: "3%",
        //         });
        //       } else if (item.shape) {
        //         itemSlide.addShape(ppt.ShapeType.line, {
        //           x: 0.2,
        //           y: yVal + 0.05,
        //           w: "2%",
        //           h: 0,
        //           line: {
        //             color: item.shape,
        //             width: 1.5,
        //           },
        //         });
        //       }
        //       itemSlide.addText(item.text, {
        //         x: 0.4,
        //         y: yVal,
        //         w: "20%",
        //         h: "3%",
        //         fontSize: 11,
        //         color: "#000000",
        //         fontFace: font,
        //       });
        //       yVal += 0.25;
        //     });

        //     // Add description as text
        //     itemSlide.addText(description || "No Description", {
        //       x: 0.2,
        //       y: 3,
        //       w: "25%",
        //       h: "45%",
        //       fontSize: 18,
        //       color: "#BC1498",
        //       fontFace: font,
        //     });
        //     console.log(
        //       "///////////////////////////////////////////// Orientation //////////////////////////////////"
        //     );
        //     console.log(orientation);

        //     // Add picture as an image
        //     itemSlide.addImage({
        //       path: picture,
        //       x:
        //         orientation == "PORTRAIT" || orientation == "PORTRAIT-UPSIDEDOWN"
        //           ? 4
        //           : 3,
        //       y: 1,
        //       w: "60%",
        //       h: "60%",
        //       // w:
        //       //   orientation == 'PORTRAIT' || orientation == 'PORTRAIT-UPSIDEDOWN'
        //       //     ? '45%'
        //       //     : '65%',
        //       // h:
        //       //   orientation == 'PORTRAIT' || orientation == 'PORTRAIT-UPSIDEDOWN'
        //       //     ? '60%'
        //       //     : '80%',
        //       sizing: {
        //         type: "contain", // Ensures the image is scaled proportionally
        //         // scale: 1,                    // Scale factor to preserve aspect ratio
        //       },
        //       rotate:
        //         orientation == "PORTRAIT"
        //           ? 0 // No rotation for portrait mode
        //           : orientation == "LANDSCAPE-RIGHT"
        //           ? 90 // Rotate by 90 degrees for landscape
        //           : orientation == "PORTRAIT-UPSIDEDOWN"
        //           ? 180 // Rotate by 180 degrees for upside down portrait
        //           : 270, // Rot
        //       // rotate:
        //       //   orientation == 'PORTRAIT-UPSIDEDOWN'
        //       //     ? 270
        //       //     : orientation == 'LANDSCAPE-RIGHT'
        //       //     ? 180
        //       //     : orientation == 'PORTRAIT'
        //       //     ? 90
        //       //     : 0,
        //     });
        //   });
        // }

        // Iterate over the items under the current category to create slides
        for (const item of items) {
          // console.log(item)
          const { categoryId, picture, description, orientation } = item;
          const itemSlide = ppt.addSlide();

          let imageWidth = 0;
          let imageHeight = 0;
          let aspectRatio = 1;

          // console.log("orientation", orientation);

          if (picture) {
            console.log(picture);
            // Get the image size first
            const imageDimensions = await new Promise((resolve, reject) => {
              Image.getSize(
                picture,
                (width, height) => resolve({ width, height }),
                (error) => reject(error)
              );
            });

            const { width, height } = imageDimensions;

            // Calculate aspect ratio
            aspectRatio = width / height;

            // Set a maximum width or height
            const maxWidth = 6.5; // Example max width in inches (adjust accordingly)
            const maxHeight = 4.5; // Example max height in inches (adjust accordingly)

            // Scale the image proportionally
            if (width > height) {
              // Scale by width
              imageWidth = maxWidth;
              imageHeight = maxWidth / aspectRatio;
              if (imageHeight > maxHeight) {
                imageHeight = maxHeight;
              }
            } else {
              // Scale by height
              imageHeight = maxHeight;
              imageWidth = maxHeight * aspectRatio;
            }
          } else {
            console.log("No image path found in AsyncStorage");
          }

          itemSlide.addText(`${category} - No. ${categoryId}`, {
            x: 0.2,
            y: 0.2,
            w: "40%",
            h: 0.5,
            fontSize: 24,
            bold: true,
            underline: true,
            color: "#BC1498",
            fontFace: font,
          });

          // Add photo items
          let yVal = 1;
          photoItems.forEach((item) => {
            if (item.color) {
              itemSlide.addShape(ppt.ShapeType.rect, {
                fill: { color: item.color, transparency: 80 },
                line: { color: item.color, width: 2 },
                x: 0.2,
                y: yVal,
                w: "2%",
                h: "3%",
              });
            } else if (item.icon) {
              itemSlide.addImage({
                data: dropPointIcon,
                x: 0.2,
                y: yVal,
                w: "2%",
                h: "3%",
              });
            } else if (item.shape) {
              itemSlide.addShape(ppt.ShapeType.line, {
                x: 0.2,
                y: yVal + 0.05,
                w: "2%",
                h: 0,
                line: { color: item.shape, width: 1.5 },
              });
            }
            itemSlide.addText(item.text, {
              x: 0.4,
              y: yVal,
              w: "20%",
              h: "3%",
              fontSize: 11,
              color: "#000000",
              fontFace: font,
            });
            yVal += 0.25;
          });

          // Add description as text
          itemSlide.addText(description || "No Description", {
            x: 0.2,
            y: 3,
            w: "25%",
            h: "45%",
            fontSize: 18,
            color: "#BC1498",
            fontFace: font,
          });

          // Add picture as an image
          // Get image dimensions

          // itemSlide.addImage({
          //   path: picture,
          //   x: imageWidth < 3 ? 5 : imageWidth < 5 ? 4 : 3,
          //   y: imageHeight < 3 ? 1.5 : imageHeight < 3.5 ? 1.25 : 0.75,
          //   w: imageWidth, // Keep percentage values for width
          //   h: imageHeight, // Keep percentage values for height
          //   sizing: {
          //     type: "contain",
          //     w: imageWidth,
          //     h: imageHeight,
          //   },
          //   rotate:
          //     orientation == "PORTRAIT"
          //       ? 0 // No rotation for portrait mode
          //       : orientation == "LANDSCAPE-RIGHT"
          //       ? 90 // Rotate by 90 degrees for landscape
          //       : orientation == "PORTRAIT-UPSIDEDOWN"
          //       ? 180 // Rotate by 180 degrees for upside down portrait
          //       : 270, // Rot
          // });

          // Add picture as an image
          // itemSlide.addImage({
          //   path: picture,
          //   x:
          //     orientation == "PORTRAIT" || orientation == "PORTRAIT-UPSIDEDOWN"
          //       ? 4
          //       : 3,
          //   y: 1,
          //   w: "60%",
          //   h: "60%",
          //   // w:
          //   //   orientation == 'PORTRAIT' || orientation == 'PORTRAIT-UPSIDEDOWN'
          //   //     ? '45%'
          //   //     : '65%',
          //   // h:
          //   //   orientation == 'PORTRAIT' || orientation == 'PORTRAIT-UPSIDEDOWN'
          //   //     ? '60%'
          //   //     : '80%',
          //   sizing: {
          //     type: "contain", // Ensures the image is scaled proportionally
          //     // scale: 1,                    // Scale factor to preserve aspect ratio
          //   },
          //   // rotate:
          //   //   orientation == "PORTRAIT"
          //   //     ? 0 // No rotation for portrait mode
          //   //     : orientation == "LANDSCAPE-RIGHT"
          //   //     ? 90 // Rotate by 90 degrees for landscape
          //   //     : orientation == "PORTRAIT-UPSIDEDOWN"
          //   //     ? 180 // Rotate by 180 degrees for upside down portrait
          //   //     : 270, // Rot
          //   // rotate:
          //   //   orientation == 'PORTRAIT-UPSIDEDOWN'
          //   //     ? 270
          //   //     : orientation == 'LANDSCAPE-RIGHT'
          //   //     ? 180
          //   //     : orientation == 'PORTRAIT'
          //   //     ? 90
          //   //     : 0,
          // });

          if (picture) {
            const imageDimensions = await new Promise((resolve, reject) => {
              Image.getSize(
                picture,
                (width, height) => resolve({ width, height }),
                (error) => reject(error)
              );
            });

            const { width, height } = imageDimensions;
            const aspectRatio = width / height;

            const maxWidth = 6.5; // Maximum width in inches
            const maxHeight = 4.5; // Maximum height in inches

            let imageWidth, imageHeight;

            if (width > height) {
              imageWidth = maxWidth;
              imageHeight = maxWidth / aspectRatio;
              if (imageHeight > maxHeight) {
                imageHeight = maxHeight;
                imageWidth = maxHeight * aspectRatio;
              }
            } else {
              imageHeight = maxHeight;
              imageWidth = maxHeight * aspectRatio;
              if (imageWidth > maxWidth) {
                imageWidth = maxWidth;
                imageHeight = maxWidth / aspectRatio;
              }
            }

            console.log("imageDimensions inches W x H ->", `${imageWidth} x ${imageHeight}`);

            itemSlide.addImage({
              path: picture,
              x: (10 - imageWidth) / 2 + 1, // Center horizontally (10 is the default slide width in inches)
              y: (5.63 - imageHeight) / 2, // Center vertically (5.63 is the default slide height in inches)
              // x: 3,
              // y: 1,
              w: imageWidth,
              h: imageHeight,
              sizing: {
                type: "contain",
              },
            });
          }
        }
      }
      
      console.log("Total Category and subitems:", `${ttlCat} & ${ttlCatItem}`);

      const additionalNoteSlide = ppt.addSlide();
      additionalNoteSlide.background = { data: mainBackground };
      additionalNoteSlide.addText("Additional Notes", {
        x: 0.2,
        y: 0.2,
        w: "30%",
        h: 0.5,
        fontSize: 24,
        underline: true,
        bold: true,
        color: "#BC1498",
        fontFace: font,
      });
      additionalNoteSlide.addShape(ppt.ShapeType.rect, {
        fill: { color: "#EDEDED" },
        x: 0.2,
        y: 0.7,
        w: "95%",
        h: "80%",
      });
      const noteText = {
        fontSize: 16,
        color: "#BC1498",
        fontFace: font,
        isTextBox: true,
        bold: true,
        breakline: true,
      };
      const textObj = [
        { text: "-Problem:", options: noteText },
        { text: " Solution:", options: noteText },
      ];
      additionalNoteSlide.addText(textObj, { x: 0.5, y: 1.5 });

      const footerSlide = ppt.addSlide();
      footerSlide.background = { data: mainBackground };

      let startTime = Date.now();
      // const base64 = await ppt.write("base64");
      const arrayBuffer = await ppt.write("arraybuffer");
      let endTime = Date.now();
      console.log("ppt.write took", (endTime - startTime) / 1000, "seconds");

      const reportName = `${project}_${new Date().getTime()}.pptx`;
      var filePath;
      
      // Always save to app's document directory first (guaranteed to work)
      // On Android 10+, Downloads folder requires MediaStore API to be visible in file manager
      filePath = `${RNFS.DocumentDirectoryPath}/${reportName}`;
      
      console.log(`File path PowerPoint before save: ${filePath}`);
      console.log(`Platform: ${Platform.OS}, DocumentDirectoryPath: ${RNFS.DocumentDirectoryPath}`);
      if (Platform.OS === "android") {
        console.log(`DownloadDirectoryPath: ${RNFS.DownloadDirectoryPath}`);
      }

      startTime = Date.now();
      
      try {
        // Save file to app's document directory
        await writeLargePPTInChunks(filePath, arrayBuffer);
        
        // Verify file exists after writing
        const fileExists = await RNFS.exists(filePath);
        if (!fileExists) {
          throw new Error(`File was not created at ${filePath}. The write operation may have failed silently.`);
        }
        
        const fileStats = await RNFS.stat(filePath);
        console.log(`File saved successfully at: ${filePath}`);
        console.log(`File size: ${fileStats.size} bytes`);
        
        // On Android, automatically attempt to save to Downloads folder
        // This uses MediaStore API and makes the file visible in file manager
        if (Platform.OS === "android") {
          try {
            console.log("Attempting to save file to Downloads folder (visible in file manager)...");
            const saved = await saveToDownloads(filePath, reportName);
            if (saved) {
              console.log("File successfully saved to Downloads folder!");
            } else {
              console.log("File saved to app directory. User can use 'Save to Downloads' option to copy it.");
            }
          } catch (downloadsError) {
            console.log("Could not automatically save to Downloads, but file is saved in app directory:", downloadsError.message);
            // File is still accessible at filePath for upload
          }
        }
      } catch (error) {
        console.error("Error during file write:", error);
        throw error;
      }
      
      endTime = Date.now();
      console.log("pptWriteChunks took", (endTime - startTime) / 1000, "seconds");

      setLoadingModal(false);
      
      // Show success message with options
      setTimeout(()=>{
        Alert.alert(
          "PowerPoint Report Generated Successful!",
          `File saved: ${reportName}\n\nWhat would you like to do?`,
          [
            {
              text: "Save to Downloads",
              onPress: async () => {
                if (Platform.OS === "android") {
                  const saved = await saveToDownloads(filePath, reportName);
                  if (saved) {
                    Alert.alert("Success", "File saved to Downloads folder!");
                  }
                } else {
                  Alert.alert("Info", "On iOS, file is saved in app directory.");
                }
              },
            },
            {
              text: "Upload to Sharepoint",
              onPress: async () => {
                startTime = Date.now();
                await uploadReport(arrayBuffer, reportName, filePath);
                endTime = Date.now();
                console.log("uploadReport took", (endTime - startTime) / 1000, "seconds");
              },
            },
            {
              text: "Skip",
              style: "cancel",
            },
          ]
        );
      }, 300);
    } catch (error) {
      console.error("Error saving the PowerPoint file:", error);
      Alert.alert("Error saving the PowerPoint file", error?.message || String(error));
      setLoadingModal(false);
    }
  };

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {projectData.map((category, index) => (
                <Accordion
                  key={index}
                  category={category}
                  onHeaderCheck={handleHeaderCheck}
                  onItemCheck={handleItemCheck}
                />
              ))}
            </ScrollView>
            <Button title={"GENERATE"} onPress={()=>{
              setLoadingMessage("Report generating inprogress, it will take several minutes. Please wait...")
              generatePowerpoint();
            }} />
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => {
                setModalVisible(!modalVisible);
                setLoadingModal(false);
              }}
            >
              <Text style={styles.textStyle}>CLOSE</Text>
            </Pressable>
            <LoadingModal visible={loadingModal} message={loadingMessage} />
          </View>
        </View>
      </Modal>
      <Button title="GENERATE REPORT" onPress={() => setModalVisible(true)} />

      {/* <LoadingModal visible={loadingModal} /> */}
    </View>
  );
};

/* CODING MADE BY FAAEZAMIRUDDIN */
const LoadingModal = ({ visible, progress, message = "Please wait..." }) => {
  return (
    // <Modal
    //   animationType="slide"
    //   transparent={true}
    //   visible={visible}
    //   onRequestClose={() => {
    //     Alert.alert("Modal has been closed.");
    //     // setModalVisible(!modalVisible);
    //   }}
    // >
    //   <View style={styles.loadingView}>
    //     <View style={styles.backView}>
    //       <View style={{ flex: 1 }}>
    //         <ActivityIndicator size="large" color="#ffffff" />
    //       </View>
    //     </View>
    //   </View>
    // </Modal>

    <Modal visible={visible} transparent={true} animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
        <View
          style={{width: '90%',padding: 20, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', }}>
          <ActivityIndicator size="large" color="#8829A0" />
          <Text style={{marginTop: 5, fontSize:16, color:"#000"}}>
            {/* {progress.current}/{progress.total} % */}
            {message}
            {/* Report Generating Inprogress, it will take several minutes.
            Please wait... */}
          </Text>
        </View>
      </View>
  </Modal>
  );
};

const Accordion = ({ category, onHeaderCheck, onItemCheck }) => {
  const [expanded, setExpanded] = useState(false);

  // Initialize itemCheckedState with all checkboxes set to true
  const initialItemCheckedState = {};
  category.data.forEach((categoryIdGroup) => {
    initialItemCheckedState[`${category.title}${categoryIdGroup.title}`] = true;
  });

  const [itemCheckedState, setItemCheckedState] = useState(
    initialItemCheckedState
  );

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionTitle) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle],
    });
  };

  const handleItemCheck = (item, isChecked) => {
    const updatedItemCheckedState = {
      ...itemCheckedState,
      [item]: isChecked,
    };

    setItemCheckedState(updatedItemCheckedState);
    onItemCheck(item, isChecked);
  };

  const handleHeaderCheck = (headerTitle, isChecked) => {
    const updatedItemCheckedState = {};
    category.data.forEach((categoryIdGroup, index) => {
      updatedItemCheckedState[`${headerTitle}${categoryIdGroup.title}`] =
        isChecked;
      onItemCheck(`${headerTitle}${categoryIdGroup.title}`, isChecked);
    });
    setItemCheckedState(updatedItemCheckedState);

    onHeaderCheck(headerTitle, isChecked);
  };

  return (
    <ListItem.Accordion
      content={
        <>
          <CheckBox
            value={Object.values(itemCheckedState).some(Boolean)}
            onValueChange={(newValue) => {
              handleHeaderCheck(category.title, newValue);
            }}
          />
          <Text>{category.title}</Text>
        </>
      }
      isExpanded={expanded}
      onPress={() => {
        setExpanded(!expanded);
      }}
      containerStyle={{ backgroundColor: "transparent" }}
    >
      {category.data.map((categoryIdGroup) => (
        <ListItem.Accordion
          key={`${category.title}${categoryIdGroup.title}`}
          content={
            <>
              <CheckBox
                value={
                  itemCheckedState[`${category.title}${categoryIdGroup.title}`]
                }
                onValueChange={(newValue) =>
                  handleItemCheck(
                    `${category.title}${categoryIdGroup.title}`,
                    newValue
                  )
                }
              />
              <Text>{categoryIdGroup.title}</Text>
            </>
          }
          isExpanded={
            expandedSections[`${category.title}${categoryIdGroup.title}`] ||
            false
          }
          onPress={() =>
            toggleSection(`${category.title}${categoryIdGroup.title}`)
          }
          containerStyle={{ backgroundColor: "transparent" }}
        >
          {categoryIdGroup.data.map((item) => (
            <View key={item.id}>
              <View style={styles.displayPictureContainer}>
                <View style={{ alignItems: "center" }}>
                  <Image
                    source={
                      item.picture == "null" || item.picture != null
                        ? { uri: item.picture }
                        : require("./src/assets/SolarvestFrontLogo.png")
                    }
                    style={styles.imageItem}
                  />
                  <Text style={styles.name}>
                    {item.category} - No. {item.categoryId}
                  </Text>
                  <Text style={styles.description}>
                    Description: {item.description || "no description"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ListItem.Accordion>
      ))}
    </ListItem.Accordion>
  );
};

const LoginPage = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const doUserLogIn = async () => {
    // Usernames with their passwords
    const credentials = {
      Solarvestpd001: "Preconstruction001",
      Solarvestpd002: "Preconstruction002",
      TestUser: "Test1234",
      // SolarvestSiteSurvey00: "SV890432",
      // SLVYX: "SLV001",
      // SLVAdam: "SLV002",
      // SLVNabil: "SLV003",
      // SLVReuben: "SLV004",
      // SLVFaaez: "SLV005",
      // SLVB1: "SLVB001",
      // SLVB2: "SLVB002",
      // SLVB3: "SLVB003",
      // SLVB4: "SLVB004",
      // SLVB5: "SLVB005",
      // SLVB6: "SLVB006",
      // SLVB7: "SLVB007",
      // SLVB8: "SLVB008",
      // SLVB9: "SLVB009",
      // SLVB10: "SLVB010",
      // SLVB11: "SLVB011",
      // SLVB12: "SLVB012",
      // SLVB13: "SLVB013",
      // SLVB14: "SLVB014",
      // SLVB15: "SLVB015",
      // SLVB16: "SLVB016",
      // SLVB17: "SLVB017",
      // SLVB18: "SLVB018",
      // SLVB19: "SLVB019",
      // SLVB20: "SLVB020",
      // SLVB21: "SLVB021",
      // SLVB22: "SLVB022",
      // SLVB23: "SLVB023",
      // SLVB24: "SLVB024",
      // SLVB25: "SLVB025",
      // SLVB26: "SLVB026",
      // SLVB27: "SLVB027",
      // SLVB28: "SLVB028",
      // SLVB29: "SLVB029",
      // SLVB30: "SLVB030",
    };

    // Check if the username exists and the password matches
    if (
      credentials[username] === password ||
      (password === "AppTesting" && new Date() < new Date("2024-01-06"))
    ) {
      Alert.alert("Login Successful", "You have successfully logged in!");
      await AsyncStorage.setItem("isLoggedIn", JSON.stringify(true)); // Save login state
      navigation.replace("Project");
    } else {
      Alert.alert("Login Failed", "Invalid username or password.");
    }
  };
  /*const doUserLogIn = async () => {
    // if (username === 'SiteSurveSolarvesty00' && password === 'SV890432') ,, 'Faaez','Nabil','Adam','Reuben''SolarvestPJ' {
    if (username === 'SolarvestSiteSurvey00', 'SLVFaaez', 'SLVNabil', 'SLVAdam', 'SLVReuben', 'SLVYongXuan' && (password === 'SV890432', 'SLV001', 'SLV002', 'SLV003', 'SLV004', 'SLV005' ||
      (password === "AppTesting" && new Date() < new Date('2024-01-06')))) {
      Alert.alert('Login Successful', 'You have successfully logged in!');
      await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true)); // Save login state
      navigation.replace('Project');
    } else {
      Alert.alert('Login Failed', 'Invalid username or password.');
    }
  };*/

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, }}>
          <View style={styles.loginForm}>
            <Image
                  source={require("./src/assets/solarvestlogo.png")}
                  style={{
                    resizeMode: "contain",
                    width: "100%",
                    height: "100%",
                    maxHeight: 400,
                  }}
                />
            <TextInput
              style={styles.inputField}
              value={username}
              placeholder={"Username"}
              placeholderTextColor="black"
              onChangeText={(text) => setUsername(text)}
              autoCapitalize={"none"}
              keyboardType={"email-address"}
              autoComplete="off"
              textContentType="oneTimeCode"          
              importantForAutofill="no"
              enablesReturnKeyAutomatically
            />
            <View
              style={[
                styles.inputField,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <TextInput
                style={{ flex: 1, color: "black" }}
                value={password}
                placeholder="Password"
                placeholderTextColor="black"
                secureTextEntry={!showPassword}
                onChangeText={(text) => setPassword(text)}
                autoCapitalize="none"
                autoComplete="off"       // ✅ Add this
                textContentType="none"   // ✅ Add this
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome5
                  name={showPassword ? "eye-slash" : "eye"}
                  size={24}
                  color="gray"
                  style={{ marginRight: 8 }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={doUserLogIn}>
              <View style={styles.loginButton}>
                <Text style={styles.buttonText}>{"Sign in"}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

function HeaderButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
      <Icon name={"user-gear"} size={25} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

////////////////////////// Main App ///////////////////////////////////////////////////////

function App() {
  const isDarkMode = useColorScheme() === "dark";
  const [AccessToken, setAccessToken] = useState(null);
  const [formDigest, setFormDigest] = useState(null);
  const [login, setLogin] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await retrieveAccessToken();
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem("isLoggedIn");
        if (value !== null) {
          setLogin(JSON.parse(value));
        } else {
          setLogin(false);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
    loadSettings();
  }, []);

  /* CODING MADE BY FAAEZAMIRUDDIN */
  const initBackgroundFetch = async () => {
    let status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 240,
        stopOnTerminate: false,
      },
      async (taskId) => {
        // <-- Event callback
        // This is the fetch-event callback.
        console.log("[BackgroundFetch] taskId: ", taskId);
        const loadImageBase64 = async (capturedImageURI) => {
          try {
            const base64Data = await RNFS.readFile(capturedImageURI, "base64");
            console.log("base64Data:-----_---__------->>>> ", base64Data);
            
            return base64Data;
          } catch (error) {
            console.error("Error converting image to base64:", error);
          }
        };

        const uploadImageSharepoint = async (
          imgUri,
          imgName,
          folderUri,
          AccessToken,
          formDigest
        ) => {
          const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${folderUri}\')/Files/add(url=\'${imgName}\',overwrite=true)`;
          const base64Image = await loadImageBase64(imgUri);
          const headers = {
            Authorization: `Bearer ${AccessToken}`,
            "X-RequestDigest": formDigest,
            Accept: "application/json; odata=verbose",
            "Content-Type": "image/jpg",
          };

          const arrayBuffer = toByteArray(base64Image);
          try {
            const response = await axios({
              method: "POST",
              url: fileUploadUrl,
              data: arrayBuffer,
              headers: headers,
            });
            if (response.data.d.Exists) {
              console.log("Image Uploaded to Sharepoint: " + imgName);
              return true;
            }
            console.log(response.data.d.Exists);
          } catch (error) {
            console.log(
              "Error Uploading Data in Sharepoint",
              error.response.data
            );
            return false;
          }
        };

        const checkFolderExist = async (
          project,
          folderUri,
          AccessToken,
          formDigest
        ) => {
          const checkUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${folderUri}')`;
          const uploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
          let folderExist = true;
          try {
            const response = await axios.get(checkUri, {
              headers: {
                Authorization: `Bearer ${AccessToken}`,
                Accept: "application/json;odata=verbose",
              },
            });

            console.log("File Exist: " + response.data.d.Exists);
            return response.data.d.Exists;
          } catch (error) {
            // *********Create sharepoint folder path***********
            if (
              error.response.data.error.code ==
              "-2147024894, System.IO.FileNotFoundException"
            ) {
              let parentFolder = project;
              for (let path of folderUri.split("/").splice(1)) {
                try {
                  const response = await axios({
                    method: "POST",
                    url: uploadUri,
                    data: {
                      __metadata: {
                        type: "SP.Folder",
                      },
                      ServerRelativeUrl: `ListofImage/${parentFolder}/${path}`,
                    },
                    headers: {
                      Authorization: `Bearer ${AccessToken}`,
                      Accept: "application/json;odata=verbose",
                      "Content-Type": "application/json;odata=verbose",
                      "X-RequestDigest": formDigest,
                    },
                  });
                  parentFolder += "/" + path;
                  // console.log("Folder created: " + response.data.d.Exists);
                  // folderExist = response.data.d.Exists;
                } catch (error) {
                  console.log(error);
                  return false;
                }
              }
            }
          }
          return folderExist;
        };

        const checkDate = async () => {
          // console.log("check the date" + (new Date.getTime()))
          try {
            const storedDataJSON = await AsyncStorage.getItem("imageCategory");
            let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            const currentDate = new Date().getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;

            storedData = storedData.filter((dataItem) => {
              const createdDate = parseInt(
                dataItem.id.substring(0, dataItem.id.length - 3)
              );
              const isOlderThanSevenDays =
                currentDate - createdDate > sevenDays;
              const isOptNull = dataItem.opt === null;
              const isOptDelete = dataItem.opt === "delete";

              // Keep the item if it's not older than seven days, opt is not null, and opt is not 'delete'
              return !(isOlderThanSevenDays && isOptNull) && !isOptDelete;
            });

            await AsyncStorage.setItem(
              "imageCategory",
              JSON.stringify(storedData)
            );
          } catch (error) {
            console.log("There is an error inside ", error);
          }
        };

        const uploadProjectFolder = async (AccessToken, formDigest) => {
          try {
            console.log(
              "entered to uploadProjectFolder############################",
              error
            );
            const existingProjects = await AsyncStorage.getItem("projectName");
            const ExistingProjects = existingProjects
              ? JSON.parse(existingProjects)
              : [];
            ExistingProjects.forEach(async (projectName) => {
              try {
                const folderUploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
                const response = await axios({
                  method: "POST",
                  url: folderUploadUri,
                  data: {
                    __metadata: {
                      type: "SP.Folder",
                    },
                    ServerRelativeUrl: `ListofImage/${projectName}`,
                  },
                  headers: {
                    Authorization: `Bearer ${AccessToken}`,
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": formDigest,
                  },
                });
                console.log("project created:" + projectName);
              } catch (error) {
                console.log(
                  "error uploading Folder############################",
                  error
                );
              }
            });
          } catch (error) {
            console.log("error uploading Folder");
          }
        };

        try {
          const [AccessToken, formDigest] = await retrieveAccessToken();
          await uploadProjectFolder(AccessToken, formDigest);
          checkDate();
          const storedDataJSON = await AsyncStorage.getItem("imageCategory");
          const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
          const filteredData = storedData.filter((item) => item.opt !== null);
          // console.log("filtered Data:", filteredData);
          await Promise.all(
            filteredData.map(async (item) => {
              if (item.opt === "create") {
                // ***********sharepoint upload***********
                const folderUri = `${item.project}/${item.category}/${item.categoryId}`;
                const folderExist = await checkFolderExist(
                  item.project,
                  folderUri,
                  AccessToken,
                  formDigest
                );
                if (folderExist) {
                  const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                  try {
                    const imgUploaded = await uploadImageSharepoint(
                      item.picture,
                      imgName,
                      folderUri,
                      AccessToken,
                      formDigest
                    );
                    if (imgUploaded) {
                      const storedDataJSON = await AsyncStorage.getItem(
                        "imageCategory"
                      );
                      let storedData = storedDataJSON
                        ? JSON.parse(storedDataJSON)
                        : [];
                      item.opt = null;
                      const index = storedData.findIndex(
                        (dataItem) => dataItem.id === item.id
                      );

                      if (index !== -1) {
                        storedData[index] = item;
                        await AsyncStorage.setItem(
                          "imageCategory",
                          JSON.stringify(storedData)
                        );
                      }

                      const currentDate = new Date().getTime();
                      const sevenDays = 7 * 24 * 60 * 60 * 1000;
                      const createdDate = parseInt(
                        item.id.substring(0, item.id.length - 3)
                      );
                      if (currentDate - createdDate > sevenDays) {
                        RNFS.unlink(item.picture)
                          .then(() => {
                            console.log("FILE DELETED from local");
                          })
                          .catch((err) => {
                            console.log(err.message);
                          });
                        storedData = storedData.filter(
                          (dataItem) => dataItem.id !== item.id
                        );
                        await AsyncStorage.setItem(
                          "imageCategory",
                          JSON.stringify(storedData)
                        );
                      } else {
                        const indexToUpdate = storedData.findIndex(
                          (dataItem) =>
                            dataItem.id === item.id && item.opt === "create"
                        );

                        if (indexToUpdate !== -1) {
                          storedData[indexToUpdate].opt = "";
                          console.log("storedData: " + storedData);
                          try {
                            await AsyncStorage.setItem(
                              "imageCategory",
                              JSON.stringify(storedData)
                            );
                          } catch (error) {
                            console.log(
                              "Error updating the 'opt' key: ",
                              error
                            );
                          }
                        } else {
                          console.log("Item not found to update the operation");
                        }
                      }
                    }
                  } catch (error) {
                    console.log("error uploading to sharepoint", error);
                  }
                }
              } else if (item.opt === "delete") {
                const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                const deleteUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('/sites/ProjectDevelopment/ListofImage/${item.project}/${item.category}/${item.categoryId}/${imgName}')`;
                try {
                  const response = await axios({
                    method: "POST",
                    url: deleteUri,
                    headers: {
                      Authorization: `Bearer ${AccessToken}`,
                      "If-Match": "{etag or *}",
                      "X-HTTP-Method": "DELETE",
                      "X-RequestDigest": formDigest,
                    },
                  });
                  const indexToUpdate = storedData.findIndex(
                    (items) => items.id === item.id
                  );
                  if (indexToUpdate !== -1) {
                    storedData.splice(indexToUpdate, 1); // Remove the item at the found index
                    try {
                      await AsyncStorage.setItem(
                        "imageCategory",
                        JSON.stringify(storedData)
                      );
                      RNFS.unlink(item.picture)
                        .then(() => {
                          console.log("FILE DELETED from local");
                        })
                        // `unlink` will throw an error, if the item to unlink does not exist
                        .catch((err) => {
                          console.log(err.message);
                        });
                    } catch (error) {
                      console.log(
                        "Error updating AsyncStorage after item deletion: ",
                        error
                      );
                    }
                  } else {
                    console.log(
                      "Item not found or already marked for deletion"
                    );
                  }
                  console.log("File Deleted: " + response);
                } catch (error) {
                  console.log(error);
                }
              }
            })
          );
        } catch (error) {
          console.log("Uploading folder erros################", error);
        }
        BackgroundFetch.finish(taskId);
      },
      async (taskId) => {
        // <-- Task timeout callback
        // This task has exceeded its allowed running-time.
        console.warn("[BackgroundFetch] TIMEOUT task: ", taskId);
        BackgroundFetch.finish(taskId);
      }
    );

    console.log("[BackgroundFetch] configure status: ", status);
  };

  useEffect(() => {
    initBackgroundFetch();
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [categoryName, setCategoryName] = useState("Category");
  if (login === null) {
    return null; // Don't render anything while login is null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={login ? "Project" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: "#8829A0",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerRight: () => <HeaderButton />,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginPage}
          options={{ headerRight: () => null }}
        />
        <Stack.Screen name="Project" component={ProjectScreen} />
        <Stack.Screen name="Categories">
          {(props) => (
            <HomeScreen {...props} setCategoryName={setCategoryName} />
          )}
        </Stack.Screen>
        <Stack.Screen name={categoryName} component={CategoryScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Profile" component={TestScreen} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/////////////////////////////////// Styles ///////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  //login page
  layout_container: { flex: 1, flexDirection: 'column', width: '100%', height: '100%' },
  centerV: { justifyContent: 'center' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  loginForm: {
    flex: 1,
    // justifyContent: "center",
    justifyContent: 'flex-end', // push inputs to bottom
    alignItems: "center",
    padding: 20,
    // backgroundColor:'wh'
  },
  inputField: {
    width: "100%",
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    color: "black",
  },
  loginButton: {
    backgroundColor: "#007bff",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  buttonTextGenerate: {
    //marginTop: 15,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 20, // Adjust line height as needed to prevent wrapping issues
    lineLength: 50,
  },
  //modal style
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "70%",
    height: "50%",
  },
  loadingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backView: {
    width: 100,
    height: 100,
    margin: 20,
    //backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    //margin: 20,
    /*backgroundColor: 'rgba(0, 0, 0, 0.5)',*/
    //borderRadius: 10,
    //justifyContent: 'center',
    //alignItems: 'center',
    //shadowColor: '#000',
    //shadowOffset: {
    //  width: 0,
    //   height: 2,
    //},
    //shadowOpacity: 0.25,
    //shadowRadius: 4,
    //elevation: 5,
    //width: '5%',
    // height: '2.5%',
  },
  // modalView: {
  //   margin: 20,
  //   backgroundColor: 'white',
  //   borderRadius: 20,
  //   padding: 35,
  //   alignItems: 'center',
  //   shadowColor: '#000',
  //   shadowOffset: {
  //     width: 0,
  //     height: 2
  //   },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 4,
  //   elevation: 5,
  //   width: '90%',
  //   height: '90%',
  //   rowGap: 5
  // },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    backgroundColor: "#2196F3",
    borderRadius: 20,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    marginTop: 15,
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  //others
  category_background: {
    backgroundColor: "#8829A0",
    alignItems: "center",
    padding: 20,
  },
  inputContainer: {
    width: "100%",
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  itemContainer: {
    flex: 1,
    flexDirection: "row",
    columnGap: 5,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  projectName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#8829A0",
  },
  sectionHeader: {
    backgroundColor: "purple", // Your desired background color
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    padding: 5,
    borderRadius: 15,
    width: "90%",
    textAlign: "center",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  displayPictureContainer: {
    margin: 5,
    padding: 15,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
  },
  imageItem: {
    height: 250,
    width: 250,
  },
  deleteIconContainer: {
    marginLeft: "auto",
    padding: 10, // Adjust the padding as needed
    backgroundColor: "auto", // Background color for the delete icon container
    borderRadius: 5, // Adjust the border radius as needed
  },
});

export default App;
/* CODING MADE BY FAAEZ AMIRUDDIN (WARNING: DO NOT REMOVE AUTHOR'S NAME)*/
