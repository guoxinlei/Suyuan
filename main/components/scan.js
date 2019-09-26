'use strict';

// load common components
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  ListView,
  Platform,
  Animated,
} from "react-native";

import Camera from "react-native-camera";
import Base from './base';
import Screen from './screen';
import Tools from './tools';

// scan corner
const scanCornerBorderWidth = 3;
const scanCornerWidth = 15;
const scanCornerColor = "#00ff00";

export default class Scan extends Base {
  constructor(props) {
    super(props, {
      isPushing: false,
      bounceValue: new Animated.Value(0),
      isActivate: true,
      sameIdx: 0,
    });
    this.readResult = null;
    this.sameIdx = 0;
  }

  // deactivate
  deactivate() {
    //this.refs.barcodeReader.stopCamera();
    this.setState({ isActivate: false });
  }
  //activate
  activate() {
    this.readResult = null;
    this.setState({ isActivate: true });
  }

  // component unmounted
  componentWillUnmount() {
    this.deactivate();
  }

  // barcode read result
  barcodeRead(code) {
    if (this.readResult)
      return;

    //console.log(code.data);
    this.readResult = code.data;
    this.sameIdx = 0;
    this.deactivate();

    // abandon http
    //if (this.readResult.indexOf("http") == 0) {
    //  return;
    //}

    this.barcode();
  }

  // barcode
  barcode() {
    this.props._parent.setScanResult(this.readResult);
    this.navigator.pop();
  }

  // render view
  getView() {
    let scanArea = null;
    let scanAreaWidth = 250;
    let scanAreaHeight = 250;

    scanArea = (
      <View>
        <View style={{flexDirection: 'row', height: 400, width: Screen.width, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        </View>
        <View style={{flexDirection: 'row', height: scanAreaHeight, backgroundColor: 'transparent' }}>
          <View style={{ width: (Screen.width - scanAreaWidth) / 2, height: scanAreaHeight, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          </View>
          <View style={{ width: scanAreaWidth, height: scanAreaHeight, flexDirection: 'column', backgroundColor: 'transparent' }}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={styles.cornerTopLeft}></View>
              <View style={styles.empty}></View>
              <View style={styles.cornerTopRight}></View>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={styles.cornerBottomLeft}></View>
              <View style={styles.empty}></View>
              <View style={styles.cornerBottomRight}></View>
            </View>
          </View>
          <View style={{ width: (Screen.width - scanAreaWidth) / 2, height: scanAreaHeight, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          </View>
        </View>
        <View style={{width: Screen.width, height: Screen.height, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{alignItems:'center', justifyContent:'center', marginTop:20}}>
            <Text style={{fontSize:14, color: '#fff'}}>请将二维码或条形码置于上方框中</Text>
          </View>
        </View>
      </View>
    )

    return (
      <View style={{width: Screen.width, height: Screen.height+260, marginTop:-260, overflow:'hidden'}}>
        <Camera startCamera={this.state.isActivate}
          captureAudio={false}
          onBarCodeRead={(code) => this.barcodeRead(code)}
          style={styles.camera} ref="barcodeReader"
          aspect={Camera.constants.Aspect.fill}>
          {scanArea}
        </Camera>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  camera: {
    flex:1
  },
  rectangleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc'
  },
  rectangle: {
    height: 100,
    width: 250,
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'transparent'
  },
  empty: {
    flex: 1
  },
  cornerTopLeft: {
    height: scanCornerWidth,
    width: scanCornerWidth,
    borderLeftWidth: scanCornerBorderWidth,
    borderLeftColor: scanCornerColor,
    borderTopWidth: scanCornerBorderWidth,
    borderTopColor: scanCornerColor,
    //marginTop:-scanCornerBorderWidth,
    //marginLeft:-scanCornerBorderWidth,
  },
  cornerTopRight: {
    height: scanCornerWidth,
    width: scanCornerWidth,
    borderRightWidth: scanCornerBorderWidth,
    borderRightColor: scanCornerColor,
    borderTopWidth: scanCornerBorderWidth,
    borderTopColor: scanCornerColor,
    //marginTop:-scanCornerBorderWidth,
    //marginRight:-scanCornerBorderWidth,
  },
  cornerBottomLeft: {
    height: scanCornerWidth,
    width: scanCornerWidth,
    borderLeftWidth: scanCornerBorderWidth,
    borderLeftColor: scanCornerColor,
    borderBottomWidth: scanCornerBorderWidth,
    borderBottomColor: scanCornerColor,
    alignSelf: 'flex-end',
    //marginBottom:-scanCornerBorderWidth,
    //marginLeft:-scanCornerBorderWidth,
  },
  cornerBottomRight: {
    height: scanCornerWidth,
    width: scanCornerWidth,
    borderRightWidth: scanCornerBorderWidth,
    borderRightColor: scanCornerColor,
    borderBottomWidth: scanCornerBorderWidth,
    borderBottomColor: scanCornerColor,
    alignSelf: 'flex-end',
    //marginBottom:-scanCornerBorderWidth,
    //marginRight:-scanCornerBorderWidth,
  },
});
