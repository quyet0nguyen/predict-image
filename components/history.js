import React, { Component } from 'react'; 
import { Platform, StyleSheet, Image, Text, View, TouchableOpacity, RefreshControl, ScrollView, Dimensions } from 'react-native'; 
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
const STORAGE_KEY = '@history2'
const widthPhone = Dimensions.get("window").width;


export default class History extends Component {
  state = {
    data : [],
    refreshing: false,
  }

  componentDidMount() {
      this.readData()
  }

  onRefresh = () => {          
    setTimeout(() => this.setState({ refreshing: false }), 3000);
    this.componentDidMount();  
  };


  async readData() {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEY)
      console.log(history);
      if (history !== null) {
        let saved_history = JSON.parse(history)
        this.setState({data: saved_history})
        console.log(history);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async clearStorage ()  {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      alert('Storage successfully cleared!')
      this.setState({data:[]});
    } catch (e) {
      alert('Failed to clear the async storage.')
    }
  }

  renderImage() {
    let data = this.state.data;
    if (data.length != 0) {
      return (
      data.map((item, id) => {
        return (
            <View style={styles.frame} key={id}>
              <Image source={{uri: item.uri}} style={{height: widthPhone - 20, width: widthPhone - 20}} resizeMode="cover" key={id}/>
              <View style={styles.textPredict}>  
                { item.recognitions.map((res) => {
                    return (
                      <Text style={{ color: 'black', fontSize:18}}>
                        {res["label"] + " : " + (res["confidence"] * 100).toFixed(0) + "%"}
                      </Text>
                    )
                })}
              </View>
          </View>
        )
      })
      )
    }
  }


  render() {
    return (
        <View>
      <ScrollView
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
          }
          style={styles.container}
      >
        {this.renderImage()}
      </ScrollView>
      <TouchableOpacity
         style={{
             borderWidth:1,
             borderColor:'rgba(0,0,0,0.2)',
             alignItems:'center',
             justifyContent:'center',
             width:50,
             position: 'absolute',
             bottom: 10,
             right: 10,
             height:50,
             backgroundColor:'#fff',
             borderRadius:100,
           }}
           onPress = {this.clearStorage}
       >
         <Icon name="trash-o"  size={30} color="#01a699" />
        </TouchableOpacity>
       </View>
    )
  }
}

const styles = StyleSheet.create({
  frame: {
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#eceff1',
  },
  container: {
    backgroundColor: '#cfd8dc',
  },
  textPredict: {
    padding : 5, 
  },
})