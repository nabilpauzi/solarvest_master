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
import DownloadProgressModal from "./src/components/DownloadProgressModal.js";

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

import { categories, defaultCategories, getCategoriesWithCustomNames } from "./src/const/data.js";
import { getCustomCategoryNames } from "./src/utils/categoryUtils.js";

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
        }
      } catch (error) {
      }

      Alert.alert("Project Created", "Project name saved successfully", [
        { text: "OK", onPress: () => goCategory(project) },
      ]);
    } catch (error) {
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
                })
                .catch((err) => {
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
  const [displayCategories, setDisplayCategories] = useState(defaultCategories);
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState({ total: 0, completed: 0, isDownloading: false });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const downloadCancelRef = useRef(false);

  // Helper: Refresh project data with updated categories
  const refreshProjectData = async (images) => {
    if (!isMountedRef.current) return;
    
    try {
      const customNames = await getCustomCategoryNames();
      const updatedCategories = defaultCategories.map((cat) => ({
        ...cat,
        name: customNames[cat.name] || cat.name,
        originalName: cat.name,
      }));
      
      const formatted = formatData(images, project, updatedCategories);
      if (isMountedRef.current) {
        setProjectData(formatted);
      }
    } catch (error) {
      console.error('[HomeScreen] Error in refreshProjectData', { error: error.message });
    }
  };

  // Helper: Download single image from SharePoint
  const downloadImageFromSharePoint = async (sharePointUrl, accessToken) => {
    try {
      const serverRelativeUrl = sharePointUrl.replace('https://solarvest.sharepoint.com', '');
      const fileDownloadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('${serverRelativeUrl}')/$value`;
      const imageResponse = await axios({
        method: "GET",
        url: fileDownloadUrl,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/octet-stream",
        },
        responseType: "arraybuffer",
      });
      
      const fileName = sharePointUrl.substring(sharePointUrl.lastIndexOf('/') + 1);
      const localFileName = `${new Date().getTime()}_${fileName}`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${localFileName}`;
      const base64Data = Buffer.from(imageResponse.data).toString('base64');
      await RNFS.writeFile(localPath, base64Data, 'base64');
      
      return `file://${localPath}`;
    } catch (error) {
      return null;
    }
  };

  // Helper: Download images with progress tracking
  const downloadImagesWithProgress = async (imagesToDownload, accessToken, onProgress) => {
    const downloaded = [];
    for (let i = 0; i < imagesToDownload.length; i++) {
      if (downloadCancelRef.current) break;
      
      const img = imagesToDownload[i];
      const localPath = await downloadImageFromSharePoint(img.picture || img.sharePointUrl, accessToken);
      
      if (localPath) {
        downloaded.push({
          ...img,
          picture: localPath,
          sharePointUrl: img.picture || img.sharePointUrl,
          opt: img.opt === "delete" ? null : img.opt,
        });
      } else {
        downloaded.push(img); // Keep original if download fails
      }
      
      if (onProgress) onProgress(i + 1, imagesToDownload.length);
    }
    return downloaded;
  };

  // Load categories with custom names and refresh data
  useFocusEffect(
    React.useCallback(() => {
      const loadCategories = async () => {
        try {
          const customNames = await getCustomCategoryNames();
          const updatedCategories = defaultCategories.map((cat) => ({
            ...cat,
            name: customNames[cat.name] || cat.name,
            originalName: cat.name, // Keep original for data matching
          }));
          setDisplayCategories(updatedCategories);
          // Refresh project data with updated categories
          const storedDataJSON = await AsyncStorage.getItem("imageCategory");
          const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
          setProjectData(formatData(storedData, project, updatedCategories));
        } catch (error) {
          setDisplayCategories(defaultCategories);
        }
      };
      loadCategories();
    }, [project])
  );


  const goCategory = (displayName, originalName) => {
    // Use display name for navigation, but keep original for data matching
    const nameToUse = displayName;
    setCategoryName(nameToUse);
    setTempHolder(nameToUse);
    setShouldNavigate(true);
  };

  useEffect(() => {
    const navigateAsync = async () => {
      if (shouldNavigate) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Find the category by display name to get the amount
        const category = displayCategories.find((item) => item.name === tempHolder) ||
                        defaultCategories.find((item) => item.name === tempHolder);
        const amount = category ? category.amount : 1;
        
        navigation.navigate(tempHolder, {
          project: project,
          category: tempHolder,
          amount: amount,
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
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    console.log('[HomeScreen] Component mounted, starting data fetch', { project, isMounted: isMountedRef.current });
    
    const fetchData = async () => {
      try {
        // Check if component is still mounted before starting
        if (!isMountedRef.current) {
          console.log('[HomeScreen] Component unmounted before fetchData started, aborting');
          return;
        }
        
        console.log('[HomeScreen] Starting fetchData', { project });
        const [accessToken, formDigest] = await retrieveAccessToken();
        downloadCancelRef.current = false;
        console.log('[HomeScreen] Access token retrieved, starting SharePoint fetch');

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

        const responseData = response?.data?.d?.Folders?.results || [];
        let imagesToDownload = [];
        
        // First, get existing images to check what we already have
        const existingImagesCheckJSON = await AsyncStorage.getItem("imageCategory");
        const existingImagesCheck = existingImagesCheckJSON ? JSON.parse(existingImagesCheckJSON) : [];
        
        // Create a map of existing images by sharePointUrl for quick lookup
        const existingImagesMap = new Map();
        for (const img of existingImagesCheck) {
          const sharePointUrl = img.sharePointUrl || (img.picture?.startsWith('https://') ? img.picture : null);
          if (sharePointUrl) {
            existingImagesMap.set(sharePointUrl, img);
          }
        }
        
        
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
                foldersResponse?.data?.d?.results
              ) {
                const subfolder = foldersResponse.data.d.results;
                // Fetch files inside the Category ID
                for (const subfiles of subfolder) {
                  const subfilesName = subfiles.Name;
                  const filesUri = subfiles.Files.__deferred.uri;
                  try {
                    const filesResponse = await axios({
                      method: "GET",
                      url: filesUri,
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json; odata=verbose",
                      },
                    });
                    
                    if (
                      filesResponse.status === 200 &&
                      filesResponse?.data?.d?.results
                    ) {
                      const files = filesResponse.data.d.results;
                      
                        for (const file of files) {
                          // Skip files without required properties
                          if (!file?.Name || !file?.ServerRelativeUrl) {
                            console.warn('[HomeScreen] Skipping file with missing properties', file);
                            continue;
                          }
                          
                          const pictureName = file.Name;
                          const picture = file.ServerRelativeUrl;
                          const sharePointUrl = `https://solarvest.sharepoint.com${picture}`;
                          const existingImage = existingImagesMap.get(sharePointUrl);
                          
                          // Safely extract description from pictureName
                          const nameParts = pictureName.split("_");
                          const descriptionPart = nameParts.slice(-2, -1)[0];
                          const description = descriptionPart ? descriptionPart.replace(".jpg", "").replace(".JPG", "") : pictureName.replace(".jpg", "").replace(".JPG", "");
                          
                          // Always add to list - filtering will happen later to avoid redundant file checks
                          imagesToDownload.push({
                            id: existingImage?.id || generateUniqueId(),
                            project: project,
                            category: folderName,
                            categoryId: subfilesName,
                            pictureName: pictureName,
                            serverRelativeUrl: picture,
                            sharePointUrl: sharePointUrl,
                            description: description,
                            opt: existingImage?.opt || null,
                          });
                        }
                    }
                  } catch (error) {
                  }
                }
              }
            } catch (error) {
            }
          })
        );
        
        
        // Helper: Check if local file exists for an image
        const checkLocalFileExists = async (imgInfo) => {
          const existingImage = existingImagesMap.get(imgInfo.sharePointUrl);
          if (!existingImage?.picture?.startsWith('file://')) return false;
          
          const localPath = existingImage.picture.replace('file://', '');
          try {
            return await RNFS.exists(localPath);
          } catch {
            return false;
          }
        };
        
        // Filter out images that already have valid local files
        const imagesNeedingDownload = [];
        for (const imgInfo of imagesToDownload) {
          const fileExists = await checkLocalFileExists(imgInfo);
          if (!fileExists) {
            imagesNeedingDownload.push(imgInfo);
          }
        }
        
        console.log('[HomeScreen] Download summary', {
          total: imagesToDownload.length,
          alreadyDownloaded: imagesToDownload.length - imagesNeedingDownload.length,
          needDownload: imagesNeedingDownload.length
        });
        
        // Download image function
        const downloadImage = async (imageInfo, accessToken) => {
          if (downloadCancelRef.current || !isMountedRef.current) return null;
          if (!imageInfo?.serverRelativeUrl || !imageInfo?.pictureName) {
            console.error('[HomeScreen] Invalid imageInfo in downloadImage', imageInfo);
            return null;
          }
          
          try {
            const fileDownloadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('${imageInfo.serverRelativeUrl}')/$value`;
            const imageResponse = await axios({
              method: "GET",
              url: fileDownloadUrl,
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/octet-stream",
              },
              responseType: "arraybuffer",
              timeout: 30000,
            });
            
            if (!isMountedRef.current || downloadCancelRef.current) return null;
            
            // Check if response data exists
            if (!imageResponse?.data) {
              throw new Error('No image data received from server');
            }
            
            const fileName = `${new Date().getTime()}_${imageInfo.pictureName}`;
            const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            const arrayBuffer = imageResponse.data;
            
            // Ensure arrayBuffer is valid before converting
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error('Invalid or empty image data');
            }
            
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            
            // Clear arraybuffer to help GC
            imageResponse.data = null;
            
            await RNFS.writeFile(localPath, base64Data, 'base64');
            
            return {
              ...imageInfo,
              picture: `file://${localPath}`,
            };
          } catch (error) {
            console.error('[HomeScreen] Error downloading image', {
              imageName: imageInfo.pictureName,
              error: error.message
            });
            return {
              ...imageInfo,
              picture: imageInfo.sharePointUrl,
            };
          }
        };
        
        let newData = [];
        const totalImages = imagesNeedingDownload.length;
        const priorityCount = Math.min(25, totalImages);
        
        if (totalImages > 0 && isMountedRef.current) {
          setDownloadProgress({ total: totalImages, completed: 0, isDownloading: true });
          setShowDownloadModal(true);
          
          // Download priority images (first 25) immediately
          const priorityImages = imagesNeedingDownload.slice(0, priorityCount);
          
          for (let i = 0; i < priorityImages.length; i++) {
            if (downloadCancelRef.current) break;
            
            const result = await downloadImage(priorityImages[i], accessToken);
            if (result && isMountedRef.current) {
              newData.push(result);
              setDownloadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
            }
          }
          
          // Download remaining images in background
          if (totalImages > priorityCount && !downloadCancelRef.current) {
            const backgroundImages = imagesNeedingDownload.slice(priorityCount);
            
            for (let i = 0; i < backgroundImages.length; i++) {
              if (downloadCancelRef.current || !isMountedRef.current) break;
              
              const result = await downloadImage(backgroundImages[i], accessToken);
              if (result && isMountedRef.current) {
                newData.push(result);
                setDownloadProgress(prev => ({ ...prev, completed: newData.length }));
                
                // Update AsyncStorage and UI periodically (every 5 images)
                if ((i + 1) % 5 === 0 && isMountedRef.current) {
                  const existingImagesJSON = await AsyncStorage.getItem("imageCategory");
                  const existingImages = existingImagesJSON ? JSON.parse(existingImagesJSON) : [];
                  const existingSharePointUrls = new Set(
                    existingImages.map(img => img.sharePointUrl || img.picture).filter(url => url && url.startsWith('https://'))
                  );
                  const newImages = newData.filter(img => {
                    const imgUrl = img.sharePointUrl || img.picture;
                    return !existingSharePointUrls.has(imgUrl);
                  });
                  if (newImages.length > 0 && isMountedRef.current) {
                    const merged = [...existingImages, ...newImages];
                    try {
                      await AsyncStorage.setItem("imageCategory", JSON.stringify(merged));
                    } catch (error) {
                      console.error('[HomeScreen] Error in periodic AsyncStorage update', { error: error.message });
                    }
                    
                    const customNames = await getCustomCategoryNames();
                    const updatedCategories = defaultCategories.map((cat) => ({
                      ...cat,
                      name: customNames[cat.name] || cat.name,
                      originalName: cat.name,
                    }));
                    setProjectData(formatData(merged, project, updatedCategories));
                  }
                }
              }
            }
          }
          
          setDownloadProgress(prev => ({ ...prev, isDownloading: false }));
          setShowDownloadModal(false);
        }
        if (!isMountedRef.current) return;
        
        // Store SharePoint data
        if (!isMountedRef.current) return;
        
        try {
          await AsyncStorage.setItem("sharePointData", JSON.stringify(newData));
          if (isMountedRef.current) setData(newData);
        } catch (error) {
          console.error('[HomeScreen] Error storing SharePoint data', { error: error.message });
        }
        
        // Also merge into imageCategory so images appear in Pictures list
        const existingImagesJSON = await AsyncStorage.getItem("imageCategory");
        const existingImages = existingImagesJSON ? JSON.parse(existingImagesJSON) : [];
        
        // Check existing images that still need downloading (have SharePoint URLs but no local files)
        const existingImagesNeedingDownload = [];
        for (const img of existingImages) {
          const sharePointUrl = img.picture?.startsWith('https://') ? img.picture : img.sharePointUrl;
          
          if (sharePointUrl?.startsWith('https://')) {
            const localPath = (img.picture?.startsWith('file://') ? img.picture : img.sharePointUrl)?.replace('file://', '');
            const fileExists = localPath ? await RNFS.exists(localPath).catch(() => false) : false;
            
            if (!fileExists) {
              existingImagesNeedingDownload.push(img);
            }
          }
        }
        
        if (existingImagesNeedingDownload.length > 0 && !downloadCancelRef.current && isMountedRef.current) {
          const totalToDownload = existingImagesNeedingDownload.length;
          setDownloadProgress({ total: totalToDownload, completed: 0, isDownloading: true });
          setShowDownloadModal(true);
          
          const updatedImages = [];
          for (let i = 0; i < existingImagesNeedingDownload.length; i++) {
            if (downloadCancelRef.current || !isMountedRef.current) break;
            
            const img = existingImagesNeedingDownload[i];
            const sharePointUrl = img.picture?.startsWith('https://') ? img.picture : img.sharePointUrl;
            const localPath = await downloadImageFromSharePoint(sharePointUrl, accessToken);
            
            updatedImages.push({
              ...img,
              picture: localPath || sharePointUrl,
              sharePointUrl: sharePointUrl,
              opt: img.opt === "delete" ? null : img.opt,
            });
            
            setDownloadProgress(prev => ({ ...prev, completed: i + 1 }));
            
            // Update periodically
            if ((i + 1) % 5 === 0 && isMountedRef.current) {
              const otherImages = existingImages.filter(existingImg => 
                !existingImg.picture?.startsWith('https://solarvest.sharepoint.com')
              );
              const merged = [...otherImages, ...updatedImages];
              await AsyncStorage.setItem("imageCategory", JSON.stringify(merged));
              await refreshProjectData(merged);
            }
          }
          
          // Final update
          if (isMountedRef.current && updatedImages.length > 0) {
            const otherImages = existingImages.filter(existingImg => 
              !existingImg.picture?.startsWith('https://solarvest.sharepoint.com')
            );
            const allUpdatedImages = [...otherImages, ...updatedImages];
            await AsyncStorage.setItem("imageCategory", JSON.stringify(allUpdatedImages));
            setDownloadProgress(prev => ({ ...prev, isDownloading: false }));
            setShowDownloadModal(false);
            await refreshProjectData(allUpdatedImages);
          }
        } else {
          // Merge new images with existing
          const existingSharePointUrls = new Set(
            existingImages
              .map(img => img.sharePointUrl || img.picture)
              .filter(url => url?.startsWith('https://'))
          );
          const imagesToAdd = newData.filter(img => {
            const imgUrl = img.sharePointUrl || img.picture;
            return !existingSharePointUrls.has(imgUrl);
          });
          
          if (imagesToAdd.length > 0) {
            const mergedImages = [...existingImages, ...imagesToAdd];
            await AsyncStorage.setItem("imageCategory", JSON.stringify(mergedImages));
            await refreshProjectData(mergedImages);
          }
        }
        
        // Remove delete flags for images that exist in SharePoint
        const existingImagesAfterDownload = await AsyncStorage.getItem("imageCategory");
        const existingImagesParsed = existingImagesAfterDownload ? JSON.parse(existingImagesAfterDownload) : [];
        
        const finalUpdatedImages = existingImagesParsed.map((img) => {
          const sharePointUrl = img.sharePointUrl || img.picture;
          if (sharePointUrl?.startsWith('https://') && newData.some(newImg => (newImg.sharePointUrl || newImg.picture) === sharePointUrl)) {
            if (img.opt === "delete" || img.opt === "Delete") {
              return { ...img, opt: null };
            }
          }
          return img;
        });
        
        const hasChanges = finalUpdatedImages.some((img, idx) => img.opt !== existingImagesParsed[idx]?.opt);
        if (hasChanges) {
          await AsyncStorage.setItem("imageCategory", JSON.stringify(finalUpdatedImages));
          await refreshProjectData(finalUpdatedImages);
        }
      } catch (error) {
        console.error('[HomeScreen] Error in fetchData', {
          error: error.message,
          isMounted: isMountedRef.current
        });
      }
    };


    if (!isDataFetched || projectRef.current !== project) {
      projectRef.current = project;
    }
    // if (TokenCredentials.login) {
      fetchData();
    // }
    
    // Cleanup function to cancel operations when component unmounts
    return () => {
      isMountedRef.current = false;
      downloadCancelRef.current = true;
      setData(null);
      setProjectData([]);
    };
  }, [project]);

  const [projectData, setProjectData] = useState([]);

  const formatData = (storedData, project, categoriesToUse = displayCategories) => {
    if (!storedData || !Array.isArray(storedData)) return [];
    
    const filteredData = storedData.filter(
      (item) => item.project === project && item.opt != "delete"
    );
    
    if (filteredData.length > 0) {
      const categoryCounts = filteredData.reduce((acc, img) => {
        const key = `${img.category}/${img.categoryId}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      // Debug: Show all images in each category
      const categoryDetails = filteredData.reduce((acc, img) => {
        const key = `${img.category}/${img.categoryId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ id: img.id, url: img.picture });
        return acc;
      }, {});
    }

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

    const result = categoriesToUse
      .map(({ name, originalName }) => {
        // Try to find data by original name first, then by display name
        const originalNameToUse = originalName || name;
        const categoryData = sections[originalNameToUse] || sections[name] || {};
        return {
          title: name, // Use display name for title
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
    
    return result;
  };

  const tempFetch = async () => {
    //temporary data Fetching
    try {
      const storedDataJSON = await AsyncStorage.getItem("imageCategory");
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

      setProjectData(formatData(storedData, project, displayCategories));
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

      setProjectData(formatData(storedData, project, displayCategories));
    } catch (error) {
    }
  };

  // Data loading is now handled in the category loading useFocusEffect above

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
        {displayCategories.map((item) => (
          <TouchableOpacity
            key={item.originalName || item.name}
            style={{ width: "50%" }}
            onPress={() => goCategory(item.name, item.originalName || item.name)}
          >
            <View style={styles.itemContainer}>
              <Icon name={item.icon} size={20} color="#8829A0" />
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <PptModal projectData={projectData} project={project} />
      
      <DownloadProgressModal
        visible={showDownloadModal}
        progress={downloadProgress}
        onClose={() => setShowDownloadModal(false)}
        onCancel={() => {
          downloadCancelRef.current = true;
          setShowDownloadModal(false);
          setDownloadProgress(prev => ({ ...prev, isDownloading: false }));
        }}
      />
      
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
                {categoryIdGroup.data.map((item, index) => {
              return (
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
                                ? { 
                                    uri: item.picture,
                                    headers: item.picture?.startsWith('https://solarvest.sharepoint.com') 
                                      ? {} // SharePoint URLs may need auth, but Image component can't set headers
                                      : {}
                                  }
                                : require("./src/assets/SolarvestFrontLogo.png")
                            }
                            style={styles.imageItem}
                            onError={(error) => {
                            }}
                            onLoad={() => {
                            }}
                            resizeMode="contain"
                            defaultSource={require("./src/assets/SolarvestFrontLogo.png")}
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
                );
              })}
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
  }, [projectData]);

  useEffect(() => {
    const filteredSelectedHeaders = selectedHeaders.filter((header) => {
      return projectData.some((category) => category.title === header);
    });
    setSelectedHeaders(filteredSelectedHeaders);
  }, [selectedItems]);

  const handleHeaderCheck = (headerName, isChecked) => {
    if (isChecked) {
      setSelectedHeaders((prevHeaders) => [...prevHeaders, headerName]);
    } else {
      setSelectedHeaders((prevHeaders) =>
        prevHeaders.filter((header) => header !== headerName)
      );
    }
  };

  const handleItemCheck = (itemName, isChecked) => {
    if (isChecked) {
      setSelectedItems((prevItems) => [...prevItems, itemName]);
    } else {
      setSelectedItems((prevItems) =>
        prevItems.filter((item) => item !== itemName)
      );
    }
  };

  const uploadReport = async (fileDataABuffer, reportName, filePath) => {
    try {
      const fileLength = fileDataABuffer.byteLength;
      const fileInMB = (fileLength / (1000000)).toFixed(2);
      
      if (fileInMB > 200) {
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
          if (progressEvent.total && progressEvent.total > 0) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
        validateStatus: function (status) {
          return true; // prevent throwing error for non-200
        },
      });

      if (response?.data?.d?.Exists) {
        Alert.alert("PowerPoint Report Uploaded Successfully!", reportName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PPT] Upload error', { error: error.message });
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
    await generateTemplate();
  };

  useEffect(() => {
  }, [modalVisible]);

  useEffect(() => {
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
        throw error;
      }
    }
  };

  const writeLargePPTInChunks = async (filePath, arrayBuffer, chunkSize = 1024 * 1024)=> {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Cannot write empty arrayBuffer');
    }
    
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const totalSize = uint8Array.length;
    
    // Ensure directory exists
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex > 0) {
      const dirPath = filePath.substring(0, lastSlashIndex);
      const dirExists = await RNFS.exists(dirPath);
      if (!dirExists) {
        await RNFS.mkdir(dirPath);
      }
    }
    
    // Clear file before writing (start fresh)
    try {
      await RNFS.writeFile(filePath, '', 'utf8');
    } catch (error) {
      // Ignore if file doesn't exist yet
    }
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      if (!chunk || chunk.length === 0) {
        continue;
      }
      const base64Chunk = Buffer.from(chunk).toString('base64');
      await RNFS.appendFile(filePath, base64Chunk, 'base64');
    }
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
      
      console.log('[PPT] Filtered data', { count: filteredData.length });

      // Validate image paths exist before generation
      const validatedData = [];
      const invalidImages = [];
      console.log('[PPT] Starting image validation');
      
      for (const item of filteredData) {
        if (!item?.picture) {
          const categoryLabel = item?.category || 'Unknown';
          const categoryIdLabel = item?.categoryId || 'Unknown';
          invalidImages.push(`${categoryLabel} - No. ${categoryIdLabel}`);
          continue;
        }

        if (item.picture.startsWith('file://')) {
          const filePath = item.picture.replace('file://', '');
          try {
            const fileExists = await RNFS.exists(filePath);
            if (!fileExists) {
              const categoryLabel = item?.category || 'Unknown';
              const categoryIdLabel = item?.categoryId || 'Unknown';
              invalidImages.push(`${categoryLabel} - No. ${categoryIdLabel}`);
              continue;
            }
          } catch {
            const categoryLabel = item?.category || 'Unknown';
            const categoryIdLabel = item?.categoryId || 'Unknown';
            invalidImages.push(`${categoryLabel} - No. ${categoryIdLabel}`);
            continue;
          }
        }
        
        validatedData.push(item);
      }

      if (invalidImages.length > 0) {
        const invalidCount = invalidImages.length;
        const validCount = validatedData.length;
        const invalidItems = filteredData.filter(item => !validatedData.some(valid => valid.id === item.id));

        const userChoice = await new Promise((resolve) => {
          Alert.alert(
            "Some Images Cannot Be Used",
            `${invalidCount} image(s) have invalid or missing files:\n\n${invalidImages.slice(0, 5).join('\n')}${invalidImages.length > 5 ? `\n...and ${invalidImages.length - 5} more` : ''}\n\n${validCount} valid image(s) will be included.\n\nWould you like to remove these invalid images?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setLoadingModal(false);
                  resolve(false);
                }
              },
              {
                text: "Remove Invalid Images",
                style: "destructive",
                onPress: async () => {
                  try {
                    const allDataJSON = await AsyncStorage.getItem("imageCategory");
                    const allData = allDataJSON ? JSON.parse(allDataJSON) : [];
                    const updatedData = allData.map(item => {
                      const isInvalid = invalidItems.some(invalid => invalid.id === item.id);
                      return isInvalid ? { ...item, opt: "delete" } : item;
                    });
                    await AsyncStorage.setItem("imageCategory", JSON.stringify(updatedData));
                  } catch {}
                  resolve(true);
                }
              },
              {
                text: "Continue",
                onPress: () => resolve(true)
              }
            ]
          );
        });

        if (!userChoice) return;
      }

      if (validatedData.length === 0) {
        Alert.alert(
          "No Valid Images",
          "All selected images have invalid or missing files. Please check your images and try again."
        );
        setLoadingModal(false);
        return;
      }

      let ppt = new pptxgen();

      // Sort data by category order (from categoryOrderMap) and then by categoryId within each category
      const sortedData = validatedData.sort((a, b) => {
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
      const sortedCategories = Object.keys(groupedData).sort((catA, catB) => {
        const orderA = categoryOrderMap[catA] || 9999;
        const orderB = categoryOrderMap[catB] || 9999;
        return orderA - orderB;
      });
      sortedCategories.forEach((category, index) => {
        const items = groupedData[category];
      });
      ttlCat = Object.keys(groupedData).length;

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
            // Validate required properties
            if (!item?.categoryId || !item?.picture) {
              console.warn('[PPT] Skipping item with missing required properties', item);
              continue;
            }
            
            const { categoryId, picture, description, orientation } = item;
            const itemSlide = ppt.addSlide();

          let imageWidth = 0;
          let imageHeight = 0;
          let aspectRatio = 1;

          // console.log("orientation", orientation);

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
          if (!Array.isArray(photoItems)) {
            console.warn('[PPT] photoItems is not an array, skipping');
          } else {
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
            itemSlide.addText(item.text || "", {
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
          }

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
            try {
              if (picture.startsWith('file://')) {
                const filePath = picture.replace('file://', '');
                const fileExists = await RNFS.exists(filePath);
                if (!fileExists) continue;
              }

            const imageDimensions = await new Promise((resolve, reject) => {
              Image.getSize(
                picture,
                  (width, height) => {
                    if (!width || !height || width <= 0 || height <= 0) {
                      reject(new Error(`Invalid image dimensions: ${width}x${height}`));
                      return;
                    }
                    resolve({ width, height });
                  },
                (error) => reject(error)
              );
            });

            const { width, height } = imageDimensions;
              
              if (!width || !height || width <= 0 || height <= 0) {
                continue;
              }

            const aspectRatio = width / height;

              if (aspectRatio === 0 || !isFinite(aspectRatio)) {
                continue;
              }

              const maxWidth = 6.5;
              const maxHeight = 4.5;

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

            itemSlide.addImage({
              path: picture,
              x: (10 - imageWidth) / 2 + 1,
              y: (5.63 - imageHeight) / 2,
              w: imageWidth,
              h: imageHeight,
              sizing: { type: "contain" },
            });
            } catch (error) {
              console.error('[PPT] Error processing image', { categoryId, error: error.message });
              continue;
            }
          }
        }
      }
      

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
      let arrayBuffer;
      try {
        arrayBuffer = await ppt.write("arraybuffer");
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('Failed to generate PowerPoint: empty arraybuffer');
        }
        const endTime = Date.now();
        const sizeMB = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
        console.log('[PPT] Arraybuffer generated', { sizeMB, timeMs: endTime - startTime });
        
        // Clear ppt object from memory after writing to help GC
        ppt = null;
      } catch (error) {
        console.error('[PPT] Error generating arraybuffer', { error: error.message });
        // Clear ppt even on error to help GC
        ppt = null;
        throw error;
      }

      const reportName = `${project}_${new Date().getTime()}.pptx`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${reportName}`;

      let endTime;
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
        
        // On Android, automatically attempt to save to Downloads folder
        // This uses MediaStore API and makes the file visible in file manager
        if (Platform.OS === "android") {
          try {
            const saved = await saveToDownloads(filePath, reportName);
            if (saved) {
            } else {
            }
          } catch (downloadsError) {
            // File is still accessible at filePath for upload
          }
        }
      } catch (error) {
        throw error;
      }
      
      endTime = Date.now();

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
                // Read file for upload to avoid keeping arrayBuffer in memory long-term
                const uploadStartTime = Date.now();
                const fileData = await RNFS.readFile(filePath, 'base64');
                const uploadBuffer = Buffer.from(fileData, 'base64').buffer;
                await uploadReport(uploadBuffer, reportName, filePath);
                const uploadEndTime = Date.now();
                console.log("uploadReport took", (uploadEndTime - uploadStartTime) / 1000, "seconds");
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
      const errorMessage = error?.message || String(error);
      
      // Provide more helpful error messages
      let userMessage = "Error saving the PowerPoint file";
      if (errorMessage.includes("getSize")) {
        userMessage = "Some images could not be processed. The PowerPoint was generated but may be missing some images.\n\n" + 
                      "This can happen if image files were deleted or moved. Please check your images and try again.";
      } else if (errorMessage.includes("Failed to getSize")) {
        userMessage = "Some image files are missing or inaccessible. The PowerPoint was generated but may be missing some images.\n\n" +
                      "Please ensure all images are still available and try again.";
      }
      
      Alert.alert("Error saving the PowerPoint file", userMessage + "\n\nTechnical details: " + errorMessage);
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
      }
    };

    // Clean up invalid image paths (cache/tmp files that no longer exist)
    const cleanupInvalidImages = async () => {
      try {
        const storedDataJSON = await AsyncStorage.getItem("imageCategory");
        if (!storedDataJSON) return;
        
        const storedData = JSON.parse(storedDataJSON);
        const cleanedData = [];
        let removedCount = 0;
        
        for (const item of storedData) {
          if (!item.picture) {
            removedCount++;
            continue;
          }
          
          // Check if path is in cache/tmp directory (will be cleaned up by iOS)
          if (item.picture.includes('/tmp/') || item.picture.includes('/Caches/')) {
            removedCount++;
            continue;
          }
          
          // Check if file exists (for local file paths)
          if (item.picture.startsWith('file://')) {
            const filePath = item.picture.replace('file://', '');
            try {
              const fileExists = await RNFS.exists(filePath);
              if (!fileExists) {
                removedCount++;
                continue;
              }
            } catch {
              removedCount++;
              continue;
            }
          }
          
          cleanedData.push(item);
        }
        
        if (removedCount > 0) {
          await AsyncStorage.setItem("imageCategory", JSON.stringify(cleanedData));
        }
      } catch (error) {
        // Silent cleanup - don't show errors to user
      }
    };

    checkLoginStatus();
    loadSettings();
    cleanupInvalidImages();
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
            
            return base64Data;
          } catch (error) {
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
              return true;
            }
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
              } catch (error) {
              }
            });
          } catch (error) {
          }
        };

        try {
          const [AccessToken, formDigest] = await retrieveAccessToken();
          await uploadProjectFolder(AccessToken, formDigest);
          checkDate();
          const storedDataJSON = await AsyncStorage.getItem("imageCategory");
          const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
          const filteredData = storedData.filter((item) => item.opt !== null);
          
          const photosToUpload = filteredData.filter(item => item.opt === "create").length;
          console.log(`📤 Background upload: ${photosToUpload} photo(s) to upload`);
          
          let uploadedCount = 0;
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
                      uploadedCount++;
                      console.log(`✅ Background upload: ${uploadedCount}/${photosToUpload} photos uploaded`);
                      
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
                          })
                          .catch((err) => {
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
                        }
                      }
                    }
                  } catch (error) {
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
                        })
                        // `unlink` will throw an error, if the item to unlink does not exist
                        .catch((err) => {
                        });
                    } catch (error) {
                    }
                  } else {
                  }
                } catch (error) {
                }
              }
            })
          );
        } catch (error) {
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
