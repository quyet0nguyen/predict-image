import React from 'react';
import { StyleSheet, Text, View, Button, ScrollView,Image} from 'react-native';
import ImageBrowser from './ImageBrowser';
import AsyncStorage from '@react-native-community/async-storage';
import Tflite from 'tflite-react-native';

let tflite = new Tflite();

const height = 350;
const width = 350;
const blue = "#25d5fd";
const STORAGE_KEY = '@history'


export default class PredictImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageBrowserOpen: false,
      photos: [],
      source: null,
      imageHeight: height,
      imageWidth: width,
      recognitions: [],
      save_history: [],
    }
  }

  componentDidMount () {
 //   this.readData();

    var modelFile = '8class.tflite';
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
    this.predict = this.predict.bind(this);
  }

  async readData() {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEY)
      if (history !== null) {
        let saved_history = JSON.parse(history)
        this.setState({save_history: saved_history})
      }
    } catch (e) {
      console.log(e)
    }
  }

  async saveData(data) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, data)
      console.log('a')
      console.log('Data successfully saved')
      console.log(data);
    } catch (e) {
      console.log('Failed to save the data to the storage')
    }
  }

  imageBrowserCallback = (callback) => {
    callback.then((photos) => {
      console.log(photos)
      this.setState({
        imageBrowserOpen: false,
        photos
      })
    }).catch((e) => console.log(e))
  }

  predict(item) {
      tflite.runModelOnImage({                                                                     
      path: item.uri,
      imageMean: 128.0,
      imageStd: 128.0,
      numResults: 8,
      threshold: 0.05
    },
      (err, res) => {
        if (err)
          console.log(err);
        else
          this.setState({recognitions: res});
          console.log(res);
      });
  }

   renderImage(item, i) {
    this.predict(item);
    console.log(this.state.recognitions);
    return(
    <View>
      <Image
        style={{height: 300, width: 300}}
        source={{uri: item.file}}
        key={i}
      />
    </View>
    )
  }
  render() {
    if (this.state.imageBrowserOpen) {
      return(<ImageBrowser callback={this.imageBrowserCallback}/>);
    }
    return (
      <View style={styles.container}>
        <Button
          title="Choose Images"
          onPress={() => this.setState({imageBrowserOpen: true})}
        />
        <ScrollView>
          {this.state.photos.map((item,i) => this.renderImage(item,i))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
