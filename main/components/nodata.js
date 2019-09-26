'use strict';

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity
} from 'react-native';

const Screen = Dimensions.get("window");
import Constants from "./constants.js";
import IconFonts from "./icon-fonts";

const NoData = React.createClass({
  reload() {
    if (this.props.parent && this.props.parent.reload)
      this.props.parent.reload();
  },
  render() {
    let text = this.props.text;
    if (!text)
      text = "目前没有数据";

    return (
      <View style={[styles.box, this.props.style]}>
        <View style={styles.icon}>
          <IconFonts name="list-list1" size={50} color={Constants.color.black2} style={{paddingTop:10}}/>
        </View>
        <Text style={styles.buttonText}>{text}</Text>
        <View style={styles.buttonBox}>
          <TouchableOpacity style={styles.button} onPress={() => this.reload()}>
            <Text style={styles.buttonText}>点击此处刷新</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
});

const styles = StyleSheet.create({
  box: {
    width: Screen.width,
    height: Screen.height,
    paddingTop: 80,
    alignItems:'center',
    backgroundColor:'#fff',
    borderTopWidth:1,
    borderTopColor:'#f4f5f6'
  },
  icon: {
    borderRadius: 40,
    width:80,
    height:80,
    backgroundColor:"#f0f0f0",
    overflow:'hidden',
    marginBottom:20,
    alignItems:'center',
    justifyContent:'center'
  },
  iconImage: {
    width: 80,
    height: 80,
  },
  buttonBox: {
    flexDirection:'row',
    justifyContent:'center',
    marginTop:20
  },
  button: {
    borderColor:'#f0f0f0',
    borderWidth:1,
    paddingHorizontal:20,
    paddingVertical:8,
    margin: 10
  },
  buttonText: {
    fontSize:14,
    color:'#999'
  },
});

export default NoData;
