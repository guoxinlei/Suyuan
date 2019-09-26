import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import Constants from './constants';
import Ionicons from "react-native-vector-icons/Ionicons"; 

export default class Button extends React.PureComponent {
  render() {
    let fontSize = 17;
    if (this.props.title.length > 5 && !this.props.ignoreFontSize)
      fontSize = 14;
    return (
      <TouchableOpacity onPress={() => this.props.onPress()} style={[styles.button, this.props.style]}>
        {
          this.props.icon ?
          <Ionicons name={this.props.icon} size={26} color={Constants.color.blue} style={{marginRight:5}}/>
          : null
        }
        <Text style={[{fontSize, color: '#fff'}, this.props.fontStyle]}>{this.props.title}</Text>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  button: {
    paddingVertical:6,
    paddingHorizontal: 5,
    margin:10,
    marginHorizontal:7,
    width: 200,
    backgroundColor:Constants.color.blue,
    alignItems:'center',
    justifyContent:'center',
    borderColor: Constants.color.blue,
    borderWidth:0.5,
    borderRadius: 4,
    flexDirection:'row'
  }
});
