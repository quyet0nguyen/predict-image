import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Camera } from "expo-camera";
import Tflite from 'tflite-react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-community/async-storage';

const WINDOW_HEIGHT = Dimensions.get("window").height;
const closeButtonSize = Math.floor(WINDOW_HEIGHT * 0.032);
const captureSize = Math.floor(WINDOW_HEIGHT * 0.09);
let tflite = new Tflite();
const mobile = "MobileNet";
const STORAGE_KEY = '@history2';

export default function PredictCamera() {
  
  const [source, setSource] = useState(null);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const [recogni, setRecogni] = useState([]);
  const [save_history, setSave_history] = useState([]); 
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [isPreview, setIsPreview] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef();
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();

      var modelFile = 'mobV2.tflite';
      var labelsFile = '8class.txt';
      
      tflite.loadModel({
        model: modelFile,
        labels: labelsFile,
        numThreads: 1,
      },
        (err, res) => {
          if (err)
            console.log(err);
          else
            console.log(res);
        });
      
      readData();
  }, []);

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
      let img_path = data.uri;
      let img_h = data.height;
      let img_w = data.width;
      if (img_path) {
        await cameraRef.current.pausePreview();
        setIsPreview(true);

        await tflite.runModelOnImage({
          path: img_path,
          imageMean: 128.0,
          imageStd: 128.0,
          numResults: 5,
          threshold: 0.05
        },
          (err, res) => {
            if (err)
              console.log(err);
            else {
              setRecogni(res);
              alert(res.map((re, id) => {
              return (
                  re["label"] + "-" + (re["confidence"] * 100).toFixed(0) + "%" +'\n'
              )
            }));
            }
          });

        MediaLibrary.saveToLibraryAsync(img_path)
        let path = "file:///storage/emulated/0/DCIM/" + img_path.split('/')[9];
        setSource(path);
        setImageHeight(img_h);
        setImageWidth(img_w);
      }
    }
  };

  const readData = async () => {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEY)

      if (history !== null) {
        let saved_history = JSON.parse(history)
        setSave_history(saved_history);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const saveData = async(data) => { 
    try {
      await AsyncStorage.setItem(STORAGE_KEY, data)
      console.log('Data successfully saved')
      console.log(data);
      setSave_history([]);
      setSource([]);
      setImageHeight(0);
      setImageWidth(0);
      setRecogni([]);
    } catch (e) {
      console.log('Failed to save the data to the storage')
    }
  }


  const switchCamera = () => {
    if (isPreview) {
      return;
    }
    setCameraType((prevCameraType) =>
      prevCameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const cancelPreview = async () => {
    await cameraRef.current.resumePreview();
    setIsPreview(false);
    //save image
    let history = {uri: source, imageHeight: imageHeight, imageWidth: imageWidth, recognitions: recogni}
    if (recogni.length != 0) {
      save_history.push(history);
      let data = JSON.stringify(save_history);
      saveData(data);
    }
  };

  const renderCancelPreviewButton = () => (
    <TouchableOpacity onPress={cancelPreview} style={styles.closeButton}>
      <View style={[styles.closeCross, { transform: [{ rotate: "45deg" }] }]} />
      <View
        style={[styles.closeCross, { transform: [{ rotate: "-45deg" }] }]}
      />
    </TouchableOpacity>
  );

  const renderCaptureControl = () => (
    <View style={styles.control}>
      <TouchableOpacity disabled={!isCameraReady} onPress={switchCamera}>
        <Text style={styles.text}>{"Flip"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!isCameraReady}
        onPress={takePicture}
        style={styles.capture}
      />
    </View>
  );

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text style={styles.text}>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.container}
        type={cameraType}
        flashMode={Camera.Constants.FlashMode.on}
        onCameraReady={onCameraReady}
        onMountError={(error) => {
          console.log("cammera error", error);
        }}
      />
      <View style={styles.container}>
        {isPreview && renderCancelPreviewButton()}
        {!isPreview && renderCaptureControl()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: "absolute",
    top: 35,
    left: 15,
    height: closeButtonSize,
    width: closeButtonSize,
    borderRadius: Math.floor(closeButtonSize / 2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c4c5c4",
    opacity: 0.7,
    zIndex: 2,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  closeCross: {
    width: "68%",
    height: 1,
    backgroundColor: "black",
  },
  control: {
    position: "absolute",
    flexDirection: "row",
    bottom: 38,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  capture: {
    backgroundColor: "#f5f6f5",
    borderRadius: 5,
    height: captureSize,
    width: captureSize,
    borderRadius: Math.floor(captureSize / 2),
    marginHorizontal: 31,
  },
  recordIndicatorContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 25,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    opacity: 0.7,
  },
  recordTitle: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  recordDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
    backgroundColor: "#ff0000",
    marginHorizontal: 5,
  },
  text: {
    color: "#fff",
  },
});
