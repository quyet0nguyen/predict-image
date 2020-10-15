import React from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Image, Dimensions } from 'react-native';
import ImageBrowser from './ImageBrowser';
import Tflite from 'tflite-react-native';
import AsyncStorage from '@react-native-community/async-storage';

const widthPhone = Dimensions.get("window").width;
const STORAGE_KEY = '@history2'
let tflite = new Tflite();
let saved_history = [];

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageBrowserOpen: false,
      photos: [],
      save_to_history: [],
      stop: 0,
    }
  }

  componentDidMount() {
    //   this.readData();

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
  }

  async readData() {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEY)
      if (history !== null) {
        saved_history = JSON.parse(history)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async saveData() {
    if (this.state.stop == 1) 
    try {
      data = saved_history.concat(this.state.save_to_history);
      data = JSON.stringify(data);
      await AsyncStorage.setItem(STORAGE_KEY, data)
      this.setState({save_to_history : []});
      console.log('Data successfully saved')
      console.log(data);
      this.setState({stop: 0});
    } catch (e) {
      console.log(e)
    }
  }

  imageBrowserCallback = (callback) => {
    this.setState({stop: 1})
    callback.then((photos) => {
      this.setState({
        imageBrowserOpen: false,
        photos
      })
    }).catch((e) => console.log(e))
  }

  predict(item, i) {
      let dem = 0;
      tflite.runModelOnImage({
        path: item.uri,
        imageMean: 128,
        imageStd: 128,
        numResults: 8,
        threshold: 0.05
      },
        (err, res) => {
          if (err)
            console.log(err);
          else {
            if (dem < 4) {
              let newState = Object.assign({}, this.state);
              newState.save_to_history[i] = item;
              newState.save_to_history[i].recognitions = res;
              this.setState(newState);
              return;
            }
            if (dem <5) dem = dem + 1;
          }
        });
  }

  renderImage(item, i) {
    let dem = 0;
    this.predict(item, i);
    const { save_to_history } = this.state;
    if (save_to_history[i] != null && dem < 1) {
      dem = dem + 1;
      if (i==this.state.photos.length-1) this.saveData();
      
      return (
      <View key={i}>
        <Image
          style={{ height: widthPhone, width: widthPhone }}
          source={{ uri: save_to_history[i].uri }}
          key={i}
        />
        {save_to_history[i].recognitions.length > 0 && <Text>{JSON.stringify(save_to_history[i].recognitions)}</Text>}
      </View>
      )

      
    }
  }

  render() {
    if (this.state.imageBrowserOpen) {
      return (<ImageBrowser callback={this.imageBrowserCallback} />);
    }
    return (
      <View style={styles.container}>
        <Button
          title="Choose Images"
          onPress={() => this.setState({ imageBrowserOpen: true })}
        />
        <ScrollView>
          {this.state.photos.map((item, i) => this.renderImage(item, i))}
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
