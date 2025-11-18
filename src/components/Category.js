import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Button,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// import { Linking, Alert } from 'react-native'; // Import Linking and Alert for notifications and settings
import { TapGestureHandler, GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedProps, useSharedValue, interpolate, Extrapolation, runOnJS, useAnimatedReaction, useAnimatedStyle, withSpring, useDerivedValue } from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import { check, PERMISSIONS, request, RESULTS } from "react-native-permissions";
import Icon from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import PhotoEditor from "@baronha/react-native-photo-editor";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { CheckBox } from "@rneui/base";
import { ListItem } from "@rneui/themed";
import axios from "axios";
import RNFS from "react-native-fs";
import Orientation from "react-native-orientation-locker";
import Pinchable from "react-native-pinchable";
import { toByteArray } from "react-native-quick-base64";
import Carousel from "react-native-reanimated-carousel";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from "react-native-vision-camera";
import { retrieveAccessToken } from "../utils/sharePointUtils";
import { subCategories } from "../const/data";
import { checkFolderExist } from "../utils/sharePointUtils";

import { generateUniqueId } from "../utils/commonUtils";

const { width, height } = Dimensions.get("window");

export function useAppState() {
  const currentState = AppState.currentState;
  const [appState, setAppState] = useState(currentState);

  useEffect(() => {
    function onChange(newState) {
      setAppState(newState);
    }

    const subscription = AppState.addEventListener("change", onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}

const stickers = [
  "https://cdn-icons-png.flaticon.com/512/5272/5272912.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272913.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272916.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272918.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272920.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272923.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272925.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272926.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272929.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272931.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272932.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272934.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272936.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272939.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272940.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272942.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272944.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272948.png",
  "https://cdn-icons-png.flaticon.com/512/5272/5272950.png",
];

//////////////////////////////////////////////  Category Screen  ////////////////////////////////////////////////////////////

export const CategoryScreen = ({ route, navigation }) => {
  console.log("Route Params://////////////////////", route.params);
  const { category, amount, categoryId, project, cameraScreen } = route.params;
  const [description, setDescription] = useState("");

  const [imageSections, setImageSections] = useState([
    {
      id: generateUniqueId(),
      project: project,
      category: category,
      categoryId: categoryId,
      picture: "",
      description: "",
      opt: null,
    },
  ]);

  const [categoryData, setCategoryData] = useState([]);

  /// Select Image from gallery
  const openImagePicker = (index) => {
    const options = {
      mediaType: "photo",
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      console.log("response  gallery............", response);

      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.error) {
        console.log("Image picker error: ", response.error);
      } else {
        // let imageUri = (response.base64 || response.assets?.[0]?.base64);
        let imageUri = response.uri || response.assets?.[0]?.uri;
        setImageSections((prevImageSections) => {
          prevImageSections[index] = {
            id: generateUniqueId(),
            project: project,
            category: category,
            categoryId: categoryId,
            picture: imageUri,
            description: "",
            opt: "create",
          };
          return [...prevImageSections];
        });
      }
    });
    console.log("gallery data ............");
  };

  // Function to request camera permission
  const requestCameraPermission = async () => {
    let permission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    try {
      const result = await check(permission);
      if (result === RESULTS.GRANTED) {
        console.log("Camera permission is already granted");
        return true;
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          console.log("Camera permission granted");
          return true;
        } else {
          console.log("Camera permission denied");
          return false;
        }
      } else {
        console.log("Camera permission is blocked or unavailable");
        return false;
      }
    } catch (error) {
      console.warn(error);
      return false;
    }
  };

  // Function to handle navigation to the camera
  const navigateCamera = async () => {
    const hasPermission = await requestCameraPermission(); // Request camera permission

    if (hasPermission) {
      // Navigate to the Camera screen if permission is granted
      navigation.navigate("Camera", {
        category: category,
        amount: 0,
        categoryId: categoryId,
        project: project,
        tempImageSection: imageSections,
      });
    } else {
      // Alert user to enable camera permission in settings
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera permission in your device settings to continue.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(), // Open device settings
          },
        ],
        { cancelable: false }
      );
    }
  };

  const addImageToSections = (imageUri) => {
    setImageSections((prevImageSections) => [
      ...prevImageSections, // Keep previous sections
      {
        id: generateUniqueId(), // Generate unique ID for the new section
        project: project, // Use your project value here
        category: category, // Use your category value here
        categoryId: categoryId, // Use your category ID value here
        picture: imageUri, // The selected image URI
        description: "", // Optional field
        opt: "", // Optional field
      },
    ]);
  };

  goToCategorySection = (index) => {
    console.log("category///////////////", category);
    navigation.push(category, {
      category: category,
      amount: 0,
      categoryId: index + 1,
      project: project,
    });
  };

  /************************** delete image sections **********************************/

  const deleteImageSection = async (pictureId, index, imgDirectory) => {
    const updatedImageSections = [...imageSections];
    updatedImageSections.splice(index, 1);
    setImageSections(updatedImageSections);
    try {
      // Retrieve the current imageSections data from AsyncStorage
      const storedImageSections = await AsyncStorage.getItem("imageSection");
      let parsedImageSections = storedImageSections
        ? JSON.parse(storedImageSections)
        : [];
      parsedImageSections = parsedImageSections.filter(
        (imageSection) => imageSection.id !== pictureId
      );
      RNFS.unlink(imgDirectory)
        .then(() => {
          console.log("FILE DELETED from local");
        })
        .catch((err) => {
          console.log(err.message);
        });
      // Update AsyncStorage with the filtered imageSections
      await AsyncStorage.setItem(
        "imageSection",
        JSON.stringify(parsedImageSections)
      );
    } catch (error) {
      console.error("Error deleting imageSection from AsyncStorage:", error);
    }
  };

  /************************** edit image sections **********************************/

  const editImageInSection = async (index) => {
    if (!imageSections[index].picture) {
      Alert.alert("Error", "The image is missing");
      return;
    }
    const options = {
      path: imageSections[index].picture.toString(),
      sticker: stickers,
      onDone: () => {
        console.log("Done");
      },
    };
    const result = await PhotoEditor.open(options);
    if (result) {
      addImageSection(result, index);
    }
  };

  /************************** delete item **********************************/

  const deleteItem = async (item) => {
    const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
    const deleteUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('/sites/ProjectDevelopment/ListofImage/${item.project}/${item.category}/${item.categoryId}/${imgName}')`;
    Alert.alert(
      "Confirmation",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          onPress: () => console.log(""),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            // **********Local Storage Delete***********
            const storedDataJSON = await AsyncStorage.getItem("imageCategory");
            const storedData = JSON.parse(storedDataJSON);

            // Find the index of the item with matching id and 'delete' opt value
            const indexToUpdate = storedData.findIndex(
              (items) => items.id === item.id && item.opt !== "delete"
            );

            if (indexToUpdate !== -1) {
              storedData[indexToUpdate].opt = "delete";
              console.log("storedData: " + storedData);
              try {
                await AsyncStorage.setItem(
                  "imageCategory",
                  JSON.stringify(storedData)
                );
                fetchData(); // Assuming fetchData() fetches the updated data from AsyncStorage
              } catch (error) {
                console.log("Error updating the 'opt' key: ", error);
              }
            } else {
              console.log("Item not found or already marked for deletion");
            }

            //**********Sharepoint Delete***********
            try {
              const [accessToken, formDigest] = await retrieveAccessToken();

              const response = await axios({
                method: "POST",
                url: deleteUri,
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "If-Match": "{etag or *}",
                  "X-HTTP-Method": "DELETE",
                  "X-RequestDigest": formDigest,
                },
              });
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
                console.log("Item not found or already marked for deletion");
              }
              console.log("File Deleted: " + response);
            } catch (error) {
              console.log(error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  /************************** edit item **********************************/

  const editItem = async (itemId, image) => {
    const options = {
      path: image.uri.toString(),
      sticker: stickers,
      onDone: () => {
        console.log("Done");
      },
    };
    const result = await PhotoEditor.open(options);
    if (result) {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = JSON.parse(storedDataJSON);
      let itemExist = false;

      for (let i = 0; i < storedData.length; i++) {
        // If object with desired name is found
        if (storedData[i].id === itemId) {
          // storedData[i].picture = result;
          const newItem = {
            id: generateUniqueId(),
            project: storedData[i].project,
            category: storedData[i].category,
            categoryId: storedData[i].categoryId,
            picture: result,
            description: storedData[i].description,
            opt: "create",
          };

          //*********Local Storage upload edited picture ********/
          storedData.splice(i + 1, 0, newItem);
          try {
            //when Item exist in AsyncStorage
            await AsyncStorage.setItem(
              "imageCategory",
              JSON.stringify(storedData)
            );
            fetchData();
          } catch (error) {
            console.log("Error in storing the edited data: ", error);
          }
          //*********Sharepoint Upload Edited Picture ********/
          const folderUri = `${newItem.project}/${newItem.category}/${newItem.categoryId}`;
          const imgName = `${newItem.id}_${newItem.project}_${newItem.category}_${newItem.categoryId}_${newItem.description}.jpg`;
          try {
            await uploadImageSharepoint(
              newItem.picture,
              imgName,
              folderUri,
              newItem.id
            );
          } catch (error) {
            console.log("Error Uploading Edited Img Sharepoint" + error);
          }
          itemExist = true;
          break;
        }
      }
    }
  };

  const formatData = (storageData, category) => {
    const filteredData = storageData.filter(
      (item) =>
        item.category === category &&
        item.project === project &&
        item.opt != "delete"
    );

    const sections = filteredData.reduce((acc, item) => {
      const categoryKey = `${item.category} ${
        item.category_id ? item.category_id : item.categoryId
      }`;
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push({
        ...item,
      });
      return acc;
    }, {});
    const formattedData = Object.entries(sections).map(([title, data]) => ({
      title,
      data: data.map((item, index) => {
        const nextIndex =
          index < data.length - 1
            ? storageData.findIndex((elem) => elem.id === data[index + 1].id)
            : null;
        const prevIndex =
          index !== 0
            ? storageData.findIndex((elem) => elem.id === data[index - 1].id)
            : null;
        const currentIndex = storageData.findIndex(
          (elem) => elem.id === item.id
        );
        return {
          ...item,
          nextIndex,
          prevIndex,
          currentIndex,
        };
      }),
    }));

    return formattedData;
  };

  const fetchData = async () => {
    try {
      // ************Fetch Local Storage Data***********
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
      setCategoryData(formatData(storedData, category));

      const imgSectionJSON = await AsyncStorage.getItem("imageSection");
      const imgSection = imgSectionJSON ? JSON.parse(imgSectionJSON) : [];
      if (imgSection.length) {
        setImageSections(imgSection);
      }
      // ************Fetch Sharepoint Data***********
      const sharepointDataJSON = await AsyncStorage.getItem("imageCategory");
      const sharepointData = sharepointDataJSON
        ? JSON.parse(sharepointDataJSON)
        : [];
    } catch (error) {
      // console.log(error.response.data);
      console.log("Error in fetching data: " + error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // await AsyncStorage.removeItem('imageCategory');
      fetchData();
    }, [])
  );

  const loadImageBase64 = async (capturedImageURI) => {
    try {
      const base64Data = await RNFS.readFile(capturedImageURI, "base64");
      return base64Data;
    } catch (error) {
      console.error("Error converting image to base64:", error);
    }
  };

  const uploadImageSharepoint = async (imgUri, imgName, folderUri, imgId) => {
    // const imgName = "testPicture.jpg";
    // const base64Image = await loadImageBase64(imageSections[0].picture);
    // const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/Shared Documents/Images\')/Files/add(url=\'${imgName}\',overwrite=true)`;
    const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${folderUri}\')/Files/add(url=\'${imgName}\',overwrite=true)`;
    const base64Image = await loadImageBase64(imgUri);
    const [accessToken, formDigest] = await retrieveAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
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
        try {
          const storedDataJSON = await AsyncStorage.getItem("imageCategory");
          const storedData = JSON.parse(storedDataJSON);
          const indexToUpdate = storedData.findIndex(
            (item) => item.id === imgId && item.opt === "create"
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
              console.log("Error updating the 'opt' key: ", error);
            }
          } else {
            console.log("Item not found to update the operation");
          }
        } catch (error) {
          console.log("error in updating the operation of he object");
        }
        console.log("Image Uploaded to Sharepoint: " + imgName);
        return true;
      }
      console.log(response.data.d.Exists);
    } catch (error) {
      console.log(error.response.data);
    }
  };

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [check4, setCheck4] = useState(false);

  const uploadPicture = async () => {
    const { project, category, categoryId } = route.params; // or props or context

    if (imageSections.some((item) => item.picture === "")) {
      Alert.alert("Error", "There are some missing image");
      return;
    }

    if (!project) {
      console.error("Project is undefined");
      Alert.alert("Error", "Project is not defined");
      return;
    }

    try {
      const updatedImageSections = imageSections.map((item) => {
        if (item.category !== category) {
          return {
            ...item,
            category: category,
          };
        }
        return item;
      });

      // const updatedImageSections = imageSections.map((item) => ({
      //   ...item,
      //   category: category,
      //   categoryId: categoryId,
      //   project: project, // 👈 Fixing the missing 'project'
      //   opt: "create", // 👈 So it will be uploaded in background if needed
      // }));

      //********local storage upload*******
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

      storedData.push(...updatedImageSections);
      await AsyncStorage.setItem("imageCategory", JSON.stringify(storedData));
      await AsyncStorage.removeItem("imageSection");
      navigation.goBack();

      console.log("project check 1$$$$$$$$$$$$$$$$$$$$$$$", project);

      // ***********sharepoint upload***********
      const folderUri = `${project}/${category}/${categoryId}`;

      console.log("project check 2$$$$$$$$$$$$$$$$$$$$$$$", folderUri);
      const folderExist = await checkFolderExist(folderUri, project);
      console.log("project check 3$$$$$$$$$$$$$$$$$$$$$$$", project);

      if (folderExist) {
        updatedImageSections.forEach(async (item, idx) => {
          console.log("project check 4$$$$$$$$$$$$$$$$$$$$$$$", item.project);
          try {
            const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
            await uploadImageSharepoint(
              item.picture,
              imgName,
              folderUri,
              item.id
            );

            // await sendDataToSharepoint(item.picture, parseInt(item.id), item.category.toString(), parseInt(item.categoryId), item.description.toString());
          } catch (error) {
            console.error("Error sending data to SharePoint:", error);
          }
        });
      }
    } catch (error) {
      console.error("❌ Error in uploadPicture:", error.message);
      console.error("📌 Stack trace:\n", error.stack);
    }
  };

  const [expandedSections, setExpandedSections] = useState({});
  const toggleSection = (sectionTitle) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle],
    });
  };
  const swapPictureItems = async (currentIndex, newIndex) => {
    try {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
      const removedItem = storedData.splice(currentIndex, 1)[0];
      storedData.splice(newIndex, 0, removedItem);

      await AsyncStorage.setItem("imageCategory", JSON.stringify(storedData));

      setCategoryData(formatData(storedData, category));
    } catch (error) {
      console.error("Error swapping picture items:", error);
    }
  };

  if (amount) {
    return (
      <ScrollView contentContainerStyle={styles.categoryScreenContainer}>
        {/* <Button title="Add Project" onPress={addProject} /> */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <FlatList
            contentContainerStyle={{ flex: 1 }}
            data={Array.from({ length: amount }, (_, index) => ({
              id: `${index}`,
              name: `${category} - No ${index + 1}`,
            }))}
            numColumns={2}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => goToCategorySection(index)}>
                <View style={styles.itemContainer}>
                  <Text style={{ color: "black" }}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <Text style={styles.title}>List Of Pictures</Text>
        {categoryData.map((category) => (
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
            {category.data.map((item, index) => (
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
                          swapPictureItems(item.currentIndex, item.prevIndex)
                        }
                      >
                        <FontAwesome5 name="arrow-up" size={17} color="black" />
                      </TouchableOpacity>
                    )}
                    {index < category.data.length - 1 && (
                      <TouchableOpacity
                        onPress={() =>
                          swapPictureItems(item.currentIndex, item.nextIndex)
                        }
                      >
                        <FontAwesome5
                          name="arrow-down"
                          size={17}
                          color="black"
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => deleteItem(item)}>
                      <FontAwesome5 name="trash" size={17} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => editItem(item.id, { uri: item.picture })}
                    >
                      <FontAwesome5 name="edit" size={17} color="black" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Pinchable>
                      <Image
                        source={
                          item.picture == "null" || item.picture != null
                            ? { uri: item.picture }
                            : require("../assets/images.png")
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
      </ScrollView>
    );
  }

  const addImageSection = (imgUri, index) => {
    const newSection = {
      id: generateUniqueId(),
      project: project,
      category: category,
      categoryId: categoryId,
      picture: imgUri,
      description: "",
      opt: "create",
    };

    index == null
      ? setImageSections([...imageSections, newSection])
      : setImageSections((prevSections) => {
          const updatedSections = [...prevSections];
          updatedSections.splice(index + 1, 0, newSection);
          return updatedSections;
        });
  };

  const isFocused = useIsFocused();
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    setIsActive(isFocused && !amount);
  });

  const swapItems = (array, indexA, indexB) => {
    const newArray = [...array];
    [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];
    return newArray;
  };
  const handleSwapItems = async (indexA, indexB) => {
    const updatedSections = swapItems(imageSections, indexA, indexB); // Assuming you have the swapItems function as mentioned in the previous answer

    // Update the state
    setImageSections(updatedSections);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(
        "imageSection",
        JSON.stringify(updatedSections)
      );
      console.log("Image sections updated and saved to AsyncStorage");
    } catch (error) {
      console.error(
        "Error saving updated image sections to AsyncStorage:",
        error
      );
    }
  };

  /* // Update description in state when component props change
        useEffect(() => {
            setDescription(section.description);
        }, [section.description]);
    
        const handleCheck1Toggle = (isChecked) => {
            setCheck1(isChecked);
            updateSectionDescription(isChecked ? section.description : '');
        };
    
        const handleCheck2Toggle = (isChecked) => {
            setCheck2(isChecked);
            updateSectionDescription(isChecked ? section.description : '');
        };
    
        const handleCheck3Toggle = (isChecked) => {
            setCheck3(isChecked);
            updateSectionDescription(isChecked ? section.description : '');
        };
    
        const handleCheck4Toggle = (isChecked) => {
            setCheck4(isChecked);
            updateSectionDescription('');
        };
    
        const updateSectionDescription = (text) => {
            const newSections = [...imageSections];
            newSections[index].description = text;
            setImageSections(newSections);
        };*/
  /*const handleCheck1Toggle = (isChecked) => {
        setCheck1(isChecked);
        setDescription(isChecked ? section.description : '');
        updateSectionDescription();
    };

    const handleCheck2Toggle = (isChecked) => {
        setCheck2(isChecked);
        setDescription(isChecked ? section.description : '');
        updateSectionDescription();
    };

    const handleCheck3Toggle = (isChecked) => {
        setCheck3(isChecked);
        setDescription(isChecked ? section.description : '');
        updateSectionDescription();
    };

    const handleCheck4Toggle = (isChecked) => {
        setCheck4(isChecked);
        updateSectionDescription();
    };

    const updateSectionDescription = () => {
        const newSections = [...imageSections];
        newSections[index].description = description;
        setImageSections(newSections);
    };*/

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* <View style={{alignItems: 'center'}}>
        <TouchableOpacity style={styles.cameraButton} onPress={
         printImageSections
          }>
          <FontAwesome5 name="camera" size={35} color="black" />
        </TouchableOpacity>
      </View> */}

      <View style={{ alignItems: "center" }}>
        <TouchableOpacity style={styles.cameraButton} onPress={navigateCamera}>
          <FontAwesome5 name="camera" size={35} color="black" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Pictures</Text>
      <FlatList
        data={imageSections}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.imageSectionContainer}
        renderItem={({ item: section, index }) => (
          <View style={styles.uploadPictureContainer}>
            {/* <View style={{alignItems: 'center'}}>
              <TouchableOpacity style={styles.cameraButton} 
              onPress={() =>  handleOpenCamera(index)}
              // onPress={
              //   handleOpenCamera(inde)
              //   }
                >
                <FontAwesome5 name="camera" size={35} color="black" />
              </TouchableOpacity>
      </View> */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                columnGap: 15,
                justifyContent: "flex-end",
              }}
            >
              {index > 0 && (
                <TouchableOpacity
                  onPress={() => handleSwapItems(index, index - 1)}
                >
                  <FontAwesome5 name="arrow-up" size={17} color="black" />
                </TouchableOpacity>
              )}
              {index < imageSections.length - 1 && (
                <TouchableOpacity
                  onPress={() => handleSwapItems(index, index + 1)}
                >
                  <FontAwesome5 name="arrow-down" size={17} color="black" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  deleteImageSection(section.id, index, section.picture)
                }
              >
                <FontAwesome5 name="trash" size={17} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => editImageInSection(index)}>
                <FontAwesome5 name="edit" size={17} color="black" />
              </TouchableOpacity>
            </View>

            <View
              style={
                section.picture ? styles.imageContainer : styles.uploadContainer
              }
            >
              {/* <View style={{alignItems: 'center'}}>
        <TouchableOpacity style={styles.cameraButton} 
        onPress={() =>  handleOpenCamera(index)}
        // onPress={
        //   handleOpenCamera(inde)
        //   }
          >
          <FontAwesome5 name="camera" size={35} color="black" />
        </TouchableOpacity>
      </View> */}
              {section.picture ? (
                <Image
                  source={{ uri: section.picture }}
                  style={{ flex: 1 }}
                  resizeMode="contain"
                />
              ) : (
                <TouchableOpacity
                  onPress={() => openImagePicker(index)}
                  style={{ flex: 1, alignItems: "center" }}
                >
                  <Icon name="image" size={50} color="#8829A0" />
                  <Text
                    style={{ fontSize: 15, fontWeight: "bold", color: "black" }}
                  >
                    Upload Picture
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Text description */}
            {category === "Roofs" ? (
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  marginVertical: 5,
                }}
              >
                <CheckBox
                  title="Kliplok"
                  checked={check1}
                  onPress={() => {
                    const newCheckState = !check1;
                    setCheck1(newCheckState);

                    const newSections = [...imageSections];
                    newSections[index].description = newCheckState
                      ? "Kliplok"
                      : "";
                    setImageSections(newSections);
                  }}
                />
                {false && (
                  <TextInput
                    style={styles.inputContainer}
                    value={section.description}
                    onChangeText={(text) => {
                      const newSections = [...imageSections];
                      newSections[index].description = text;
                      setImageSections(newSections);
                    }}
                  />
                )}
                <CheckBox
                  title="L-foot"
                  checked={check2}
                  onPress={() => {
                    const newCheckState = !check2;
                    setCheck2(newCheckState);

                    const newSections = [...imageSections];
                    newSections[index].description = newCheckState
                      ? "L-foot"
                      : "";
                    setImageSections(newSections);
                  }}
                />
                {false && (
                  <TextInput
                    style={styles.inputContainer}
                    value={section.description}
                    onChangeText={(text) => {
                      const newSections = [...imageSections];
                      newSections[index].description = text;
                      setImageSections(newSections);
                    }}
                  />
                )}
                <CheckBox
                  title="RC Flat Roof"
                  checked={check3}
                  onPress={() => {
                    const newCheckState = !check3;
                    setCheck3(newCheckState);

                    const newSections = [...imageSections];
                    newSections[index].description = newCheckState
                      ? "RC Flat Roof"
                      : "";
                    setImageSections(newSections);
                  }}
                />
                {false && (
                  <TextInput
                    style={styles.inputContainer}
                    value={section.description}
                    onChangeText={(text) => {
                      const newSections = [...imageSections];
                      newSections[index].description = text;
                      setImageSections(newSections);
                    }}
                  />
                )}
                <CheckBox
                  title="Others"
                  checked={check4}
                  onPress={() => setCheck4(!check4)}
                />
                {check4 && (
                  <TextInput
                    style={styles.inputContainer}
                    value={section.description}
                    onChangeText={(text) => {
                      const newSections = [...imageSections];
                      newSections[index].description = text;
                      setImageSections(newSections);
                    }}
                    placeholder="Description"
                  />
                )}
              </View>
            ) : (
              <TextInput
                onBlur={() => setIsActive(true)}
                style={styles.inputContainer}
                value={section.description}
                onChangeText={(text) => {
                  const newSections = [...imageSections];
                  newSections[index].description = text;
                  setImageSections(newSections);
                }}
                placeholder="Picture Description"
              />
            )}
            {/* <Button title="Open Camera" onPress={() => handleCameraLaunch(index)} /> */}
          </View>
        )}
        ListFooterComponent={() => (
          <>
            <View style={{ alignItems: "center", marginVertical: 5 }}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: "black",
                  width: "100%",
                  marginBottom: 5,
                }}
              />
              <TouchableOpacity onPress={() => addImageSection("")}>
                <Icon name="plus-circle" size={30} color="#8829A0" />
              </TouchableOpacity>
            </View>
          </>
        )}
      />
      <View>
        <Button title="Upload Picture" onPress={uploadPicture} />
      </View>
    </View>
  );
};

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ Camera Screen $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// Setup Reanimated Camera for zoom functionality
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export const CameraScreen = ({ route, navigation }) => {
  const { category, amount, categoryId, project, tempImageSection } =
    route.params;

  // Initialize state for image sections
  const [imageSections, setImageSections] = useState(
    tempImageSection.length === 1 && tempImageSection[0].picture === ""
      ? []
      : tempImageSection
  );

  // Permission management
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          console.log("Camera permission denied");
          return;
        }
      }
    })();
  }, [hasPermission]);

  // Camera device and reference
  const device = useCameraDevice("back");
  const camera = useRef(null);
  const sliderTrackRef = useRef(null);
  const [sliderTrackLayout, setSliderTrackLayout] = useState({ y: 0, height: 200 });
  const [flash, setFlash] = useState('off'); // off, on, auto

  // Error handling callback
  const onError = useCallback((error) => {
    console.error("Camera Error:", error);
  }, []);

  // Focus handler - must be defined before gestures
  const handleFocusTap = useCallback(async (event) => {
    const { x, y } = event.nativeEvent;
    console.log("native event x y %d %d", x, y);
    try {
      if (camera.current) {
        await camera.current.focus({ x: x, y: y });
        console.log('Focus call sent');
      }
    } catch (e) {
      console.warn('Focus failed:', e);
    }
  }, []);

  // Zoom functionality - initialize to 1.5x camera zoom (displays as 1x in UI)
  const zoom = useSharedValue(1.5);
  const zoomOffset = useSharedValue(0); // For pinch gesture tracking

  // Zoom range with offset mapping:
  // UI displays: 0.5x to 4x
  // Camera actual: 1x to 4.5x (where 1.5x camera = 1x UI display)
  // This allows "zoom out" UI effect even on devices that don't support < 1x hardware zoom
  const uiMinZoom = 0.5; // UI minimum (displayed as 0.5x)
  const uiMaxZoom = 4; // UI maximum (displayed as 4x)
  const uiDefaultZoom = 1; // UI default (displayed as 1x, but camera will be 1.5x)
  
  const cameraMinZoom = 1; // Camera actual minimum (hardware limit)
  const cameraMaxZoom = 4.5; // Camera actual maximum
  const cameraDefaultZoom = 1.5; // Camera actual default (displayed as 1x in UI)
  
  // Offset: UI zoom + 0.5 = Camera zoom (so UI 0.5x = Camera 1x, UI 1x = Camera 1.5x)
  const zoomOffsetValue = 0.5;

  // Initialize zoom to cameraDefaultZoom (1.5x) when device is available
  // This will be displayed as 1x in the UI
  useEffect(() => {
    if (device) {
      console.log('Camera Device Zoom Capabilities:', {
        minZoom: device.minZoom,
        maxZoom: device.maxZoom,
        neutralZoom: device.neutralZoom,
        supportsZoomOut: device.minZoom < 1,
        cameraDefaultZoom: cameraDefaultZoom,
        uiDisplayZoom: uiDefaultZoom,
      });
      zoom.value = cameraDefaultZoom; // Set camera to 1.5x (displays as 1x in UI)
    }
  }, [device, cameraDefaultZoom]);

  // Pinch gesture for zoom - recreate when device changes
  const pinchGesture = React.useMemo(() => {
    if (!device) return Gesture.Pinch();
    
    // Use device's actual zoom range (minZoom to maxZoom, capped at 4x)
    const deviceMinZoom = device.minZoom ?? 1;
    const deviceMaxZoom = Math.min(device.maxZoom ?? 4, 4);
    
    return Gesture.Pinch()
      .onBegin(() => {
        zoomOffset.value = zoom.value;
      })
      .onUpdate((event) => {
        const z = zoomOffset.value * event.scale;
        // Clamp zoom between device's minZoom and maxZoom (capped at 4x)
        zoom.value = Math.max(deviceMinZoom, Math.min(deviceMaxZoom, z));
      });
  }, [device]);

  // Tap gesture for focus
  const tapGesture = React.useMemo(() => {
    return Gesture.Tap()
      .onEnd((event) => {
        // Gesture.Tap provides x and y directly, not in nativeEvent
        const { x, y } = event;
        runOnJS(handleFocusTap)({ nativeEvent: { x, y } });
      });
  }, [handleFocusTap]);

  // Combined gesture - allow both tap and pinch
  const composedGesture = React.useMemo(() => {
    return Gesture.Simultaneous(tapGesture, pinchGesture);
  }, [tapGesture, pinchGesture]);

  // Animated props for zoom
  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }), [zoom]);


  // Zoom control handlers - work with camera zoom values (1x to 3.5x)
  const handleZoomIn = useCallback(() => {
    if (!device) return;
    const currentZoom = zoom.value;
    const newZoom = Math.min(cameraMaxZoom, currentZoom + 0.5);
    zoom.value = withSpring(newZoom, {
      damping: 15,
      stiffness: 150,
    });
  }, [device, zoom, cameraMaxZoom]);

  const handleZoomOut = useCallback(() => {
    if (!device) return;
    const currentZoom = zoom.value;
    const newZoom = Math.max(cameraMinZoom, currentZoom - 0.5);
    zoom.value = withSpring(newZoom, {
      damping: 15,
      stiffness: 150,
    });
  }, [device, zoom, cameraMinZoom]);

  // Pan gesture for slider - improved coordinate handling
  // Maps slider position to camera zoom: bottom=cameraMinZoom(1x), center=cameraDefaultZoom(1.5x), top=cameraMaxZoom(3.5x)
  // UI displays: bottom=0.5x, center=1x, top=3x
  // Uses non-linear mapping: bottom 50% = cameraMinZoom-cameraDefaultZoom, top 50% = cameraDefaultZoom-cameraMaxZoom
  const sliderPanGesture = React.useMemo(() => {
    if (!device) return Gesture.Pan();
    
    return Gesture.Pan()
      .onUpdate((event) => {
        // event.y is relative to the gesture handler (slider track container)
        // The container has paddingVertical: 10, so track starts at y=10
        const trackStart = 10;
        const sliderHeight = 180; // Actual track height (200 - 20 padding)
        
        // Get relative position within the track
        const relativeY = event.y - trackStart;
        
        // Clamp to track bounds (0 to sliderHeight)
        const clampedY = Math.max(0, Math.min(sliderHeight, relativeY));
        
        // Calculate slider progress (inverted: 0 at bottom, 1 at top)
        const sliderProgress = 1 - (clampedY / sliderHeight);
        
        // Non-linear mapping: 
        // - Bottom 50% of slider (sliderProgress 0-0.5) maps to cameraMinZoom-cameraDefaultZoom (1x-1.5x)
        // - Top 50% of slider (sliderProgress 0.5-1) maps to cameraDefaultZoom-cameraMaxZoom (1.5x-3.5x)
        let newZoom;
        if (sliderProgress <= 0.5) {
          // Bottom half: map 0-0.5 slider progress to cameraMinZoom-cameraDefaultZoom
          const bottomProgress = sliderProgress / 0.5; // Normalize to 0-1
          newZoom = cameraMinZoom + (cameraDefaultZoom - cameraMinZoom) * bottomProgress;
        } else {
          // Top half: map 0.5-1 slider progress to cameraDefaultZoom-cameraMaxZoom
          const topProgress = (sliderProgress - 0.5) / 0.5; // Normalize to 0-1
          newZoom = cameraDefaultZoom + (cameraMaxZoom - cameraDefaultZoom) * topProgress;
        }
        
        // Apply zoom with smooth update
        zoom.value = newZoom;
      });
  }, [device, zoom, cameraMinZoom, cameraMaxZoom, cameraDefaultZoom]);

  // Animated style for slider indicator
  // Maps camera zoom value to slider position: cameraMinZoom(1x)=bottom, cameraDefaultZoom(1.5x)=center, cameraMaxZoom(3.5x)=top
  // Uses non-linear mapping: bottom 50% = cameraMinZoom-cameraDefaultZoom, top 50% = cameraDefaultZoom-cameraMaxZoom
  const sliderIndicatorStyle = useAnimatedStyle(() => {
    if (!device) {
      return { top: 100 - 6 }; // Default center position
    }
    
    const sliderHeight = 180; // Track height
    const trackStart = 10; // Top padding
    
    // Non-linear mapping to ensure cameraDefaultZoom (1.5x) is at center:
    // - Bottom 50% of slider maps to cameraMinZoom-cameraDefaultZoom (1x-1.5x)
    // - Top 50% of slider maps to cameraDefaultZoom-cameraMaxZoom (1.5x-3.5x)
    let adjustedProgress;
    if (zoom.value <= cameraDefaultZoom) {
      // Bottom half: map cameraMinZoom-cameraDefaultZoom to 0%-50% of slider
      const bottomRange = cameraDefaultZoom - cameraMinZoom;
      if (bottomRange > 0) {
        const bottomProgress = (zoom.value - cameraMinZoom) / bottomRange;
        adjustedProgress = Math.max(0, Math.min(0.5, bottomProgress * 0.5));
      } else {
        adjustedProgress = 0.5; // If cameraMinZoom == cameraDefaultZoom, stay at center
      }
    } else {
      // Top half: map cameraDefaultZoom-cameraMaxZoom to 50%-100% of slider
      const topRange = cameraMaxZoom - cameraDefaultZoom;
      if (topRange > 0) {
        const topProgress = (zoom.value - cameraDefaultZoom) / topRange;
        adjustedProgress = Math.max(0.5, Math.min(1, 0.5 + (topProgress * 0.5)));
      } else {
        adjustedProgress = 0.5; // If cameraMaxZoom == cameraDefaultZoom, stay at center
      }
    }
    
    // Inverted: top is max zoom, bottom is min zoom
    const top = trackStart + sliderHeight * (1 - adjustedProgress);
    
    return {
      top: top - 6, // Center the indicator (12px height / 2)
    };
  }, [device, cameraMinZoom, cameraMaxZoom, cameraDefaultZoom]);

  // Function to capture a photo
  const takePhoto = async () => {
    try {
      if (!camera.current) {
        console.error("Camera is not initialized");
        return;
      }

      // Capture photo using the camera
      const photo = await camera.current.takePhoto({
        flash: flash,
      });

      // Save photo to the Camera Roll and get the URI
      const imgUri = await CameraRoll.save(`file://${photo.path}`, {
        type: "photo",
      });
      console.log("Photo saved to Camera Roll:", imgUri);

      let filepath;
      if (Platform.OS === "ios") {
        const fileData = await CameraRoll.iosGetImageDataById(imgUri);
        console.log("iOS fileData:", fileData);
        if (!fileData?.node?.image?.filepath) return undefined;
        filepath = fileData.node.image.filepath;
      } else {
        filepath = imgUri;
      }

      // Read photo data in base64 format
      const photoData = await RNFS.readFile(filepath, "base64");
      const fileName = `${new Date().getTime()}.jpg`;
      const imgPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      // const appDir = `${RNFS.DocumentDirectoryPath}/SolarVest_Project`;
      // await RNFS.mkdir(appDir);
      // const imgPath = `${appDir}/${fileName}`;
      console.log("imgPath before save:", imgPath);

      // Write the photo data to the app's documents directory
      await RNFS.writeFile(imgPath, photoData, "base64");
      console.log("Image saved to:", imgPath);

      // const rotatedImageUri = await PhotoManipulator.rotatedImageUri(imgPath, '90');
      // console.log('Rotated image saved to:', rotatedImageUri);

      // console.log(rotatedImageUri)

      // Get device orientation and save image section
      Orientation.getDeviceOrientation((orientation) => {
        console.log("Device orientation:", orientation);
        setImageSections((prevImageSections) => {
          const newImageSection = {
            id: generateUniqueId(),
            project: project,
            category: category,
            categoryId: categoryId,
            picture: `file://${imgPath}`,
            description: "",
            opt: "create",
            orientation: Platform.OS === "android" ? orientation : "",
          };

          const updatedImageSections = [...prevImageSections, newImageSection];

          // Save updated image sections to AsyncStorage
          AsyncStorage.setItem(
            "imageSection",
            JSON.stringify(updatedImageSections)
          )
            .then(() => console.log("ImageSection saved"))
            .catch((error) => {
              console.error(
                "Error setting imageSection in AsyncStorage:",
                error
              );
            });

          return updatedImageSections;
        });
      });
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  };


  const screenRatio = height / width;
  const cameraRatio = 16 / 9; // You can adjust this depending on your needs

  if (device != null) {
    const format = useCameraFormat(device, [
      { photoAspectRatio: 4 / 3 },
      { photoResolution: { width: 1280, height: 960 } },
      { photoHdr: true },
    ]);
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>

        <View style={styles.cameraContainer}>
          <GestureDetector gesture={composedGesture}>
            <View style={StyleSheet.absoluteFill}>

              <ReanimatedCamera
                ref={camera}
                onError={onError}
                // format={format}
                // outputOrientation="portrait"
                //  orientation='portrait-upside-down'
                // style={StyleSheet.absoluteFill}
                style={[
                  styles.camera,
                  {
                    height: screenRatio > cameraRatio ? height : width * cameraRatio, // Adjust height based on aspect ratio
                    width: screenRatio > cameraRatio ? height / cameraRatio : width, // Adjust width based on aspect ratio
                  },
                ]}
                device={device}
                isActive={true}
                photo={true}
                ratio="16:9"
                photoQualityBalance="quality"
                // resizeMode={'contain'}
                torch={flash === 'on' ? 'on' : 'off'}
                focusable={true}
                animatedProps={animatedProps}
                // onInitialized={async () => {
                //   console.log('Camera ready');
                //   try {
                //     await camera.current.focus({ x: 0.5, y: 0.5 });
                //     console.log('Focus call sent');
                //   } catch (e) {
                //     console.warn('Focus failed:', e);
                //   }
                // }}
              />
            </View>

          </GestureDetector>

          <View
            style={{
              position: "absolute",
              top: 0,
              marginTop: 4,
              alignself: "center",
            }}
          >
            <TouchableOpacity
              style={styles.flashButton}
              onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}>
              <MaterialCommunityIcons
                name={flash === 'off' ? 'flash-off' : 'flash'}
                size={24}
                color={flash === 'off' ? 'gray' : 'gold'}
                solid
              />
            </TouchableOpacity>
          </View>


          {/* Zoom Slider UI */}
          <View
            style={{
              position: "absolute",
              right: 20,
              top: height * 0.3,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Plus Button (Zoom In) - Top */}
            <TouchableOpacity
              onPress={handleZoomIn}
              style={{
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "300",
                }}
              >
                +
              </Text>
            </TouchableOpacity>

            {/* Slider Track Container */}
            <GestureDetector gesture={sliderPanGesture}>
              <View
                ref={sliderTrackRef}
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  setSliderTrackLayout({ y, height });
                }}
                style={{
                  width: 40,
                  height: 200,
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  position: "relative",
                }}
              >
                {/* Dotted Track */}
                <View
                  style={{
                    position: "absolute",
                    width: 2,
                    height: 180,
                    top: 10,
                    left: 19, // Center the line (40px width / 2 - 1px)
                  }}
                >
                  {Array.from({ length: 20 }).map((_, index) => (
                    <View
                      key={index}
                      style={{
                        position: "absolute",
                        top: (index * 180) / 19, // Evenly space dots
                        left: 0,
                        width: 2,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                      }}
                    />
                  ))}
                </View>

                {/* Start Marker (Min Zoom) */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: "white",
                    backgroundColor: "transparent",
                  }}
                />

                {/* Animated Slider Indicator */}
                <Reanimated.View
                  style={[
                    {
                      position: "absolute",
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "white",
                      shadowColor: "white",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                      elevation: 5,
                    },
                    sliderIndicatorStyle,
                  ]}
                />

                {/* Center Marker (1x default zoom) */}
                <View
                  style={{
                    position: "absolute",
                    top: 10 + 90 - 3, // Center of slider (180/2 = 90) minus half marker height
                    right: -4,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: "white",
                    backgroundColor: "transparent",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -3,
                      right: 2,
                      width: 0,
                      height: 0,
                      borderLeftWidth: 3,
                      borderRightWidth: 3,
                      borderBottomWidth: 3,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                      borderBottomColor: "white",
                    }}
                  />
                </View>

                {/* End Marker (Max Zoom) */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: "white",
                    backgroundColor: "transparent",
                  }}
                />
              </View>
            </GestureDetector>

            {/* Minus Button (Zoom Out) - Bottom */}
            <TouchableOpacity
              onPress={handleZoomOut}
              style={{
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "300",
                }}
              >
                −
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: height * 0.4,
              alignself: "center",
            }}
          >
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <FontAwesome5 name="camera" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: height * 0.2,
            }}
          >
            <Carousel
              loop
              width={width}
              height={height * 0.2}
              sliderWidth={width}
              itemWidth={width * 0.3}
              data={imageSections.filter((item) => item.picture !== "")}
              inactiveSlideScale={1}
              scrollAnimationDuration={1000}
              onSnapToItem={(index) => console.log("current index:", index)}
              renderItem={({ item }) => (
                console.log(item),
                (
                  <View
                    style={{ flex: 1, borderWidth: 1, justifyContent: "center" }}
                  >
                    <Image
                      source={{ uri: item.picture }}
                      style={{ flex: 1 }}
                      resizeMode="contain"
                    />
                  </View>
                )
              )}
            />
          </View>
          {/* <View style={{ position: 'absolute', bottom: 0, width: '100%', height: height * 0.2 }}>
                    <Carousel
                        loop
                        width={width}
                        height={height * 0.2}
                        autoPlay={true}
                        data={imageSections}
                        scrollAnimationDuration={1000}
                        onSnapToItem={(index) => console.log('current index:', index)}
                        renderItem={({ item }) => (
                            <View style={{ flex: 1, borderWidth: 1, justifyContent: 'center' }}>
                                <Image
                                    source={{ uri: item.picture }}
                                    style={{ flex: 1 }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    />
                </View> */}
        </View>
      </GestureHandlerRootView>
    );
  }
};

///////////////////////////////////////// Styles //////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1, // Ensures each item takes up equal space
    margin: 5, // Optional: Add margin for spacing between items
    padding: 10, // Optional: Add padding inside each item
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
    width: Dimensions.get("window").width / 2 - 40, // Ensures 2 items per row with margin
    backgroundColor: "white", // E
    borderWidth: 1,
    borderRadius: 8,
    // flexWrap: 'wrap',
    // margin: 7,
    // padding: 15,
    // borderWidth: 1,
    // borderColor: 'black',
    // borderRadius: 8,
    // backgroundColor: 'white',
    // maxWidth: '70%', // Constrained max width for each item
    // alignItems: 'center', // Center align items
  },
  displayPictureContainer: {
    flex: 1,
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
  categoryScreenContainer: {
    rowGap: 10,
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    minHeight: height * 0.3,
    width: "100%",
    rowGap: 5,
    alignItems: "center",

    // backgroundColor: 'black'
  },
  camera: {
    height: height * 0.3,
    width: "92%",
    alignSelf: "center",
  },
  cameraButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#8829A0",
    backgroundColor: "white",
  },
  flashButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#8829A0",
    backgroundColor: "white",
  },
  imageSectionContainer: {
    flexGrow: 1,
    rowGap: 10,
  },
  uploadPictureContainer: {
    rowGap: 15,
    padding: 10,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#8829A0",
  },
  sectionHeader: {
    backgroundColor: "black", // Your desired background color
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    padding: 5,
    borderRadius: 15,
    width: "25%",
    textAlign: "center",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  uploadContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: "#8829A0",
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  imageContainer: {
    height: 300,
    width: "auto",
  },
  category_background: {
    backgroundColor: "red",
    alignItems: "center",
    padding: 20,
  },
  container: {
    flex: 1,
    margin: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CategoryScreen;
