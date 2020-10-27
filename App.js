import React, { Component } from 'react';
import { View, Text, Block } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import PredictImage from './components/predictImage';
import PredictCamera from './components/predictCamera';
import History from './components/history';

const Tab = createBottomTabNavigator();

class App extends Component {


  render() {
    return (
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let ionicon;

              if (route.name === 'Predict Image') {
                ionicon = focused ? 'ios-folder' : 'ios-folder';
              } else if (route.name === 'Predict Camera') {
                ionicon = focused ? 'ios-camera' : 'ios-camera';
              } else if (route.name === 'History') {
                ionicon = focused? 'ios-speedometer' : 'ios-speedometer';
              }
              return <Ionicons name={ionicon} size={size} color={color} />;
            },
          })}
          tabBarOptions={{
            activeTintColor: '#1976D2',
            inactiveTintColor: 'gray',
          }}
        >
          <Tab.Screen name="Predict Image" component={PredictImage}  />
          <Tab.Screen name="Predict Camera" component={PredictCamera}  />
          <Tab.Screen name="History" component={History} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
}

export default App;
