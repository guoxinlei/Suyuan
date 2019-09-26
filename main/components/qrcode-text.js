import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import Screen from './screen';
import Tools from './tools';
import Constants from './constants';
import Base from './base';

/**
 * render textinput based on device
 */
export default class QRCodeText extends Base {
  constructor(props) {
    super(props);

    this.isPushing = false;
  }

  /**
   * push camera component for qr scan
   */
  showQRCamera() {
    if (this.isPushing)
      return;

    this.isPushing = true;
    this.navigator.push('qrScan', {_parent: this});
    setTimeout(() => {
      this.isPushing = false;
    }, 2000);

    // set parent's modal style
    if (this.props.parent && this.props.parent.setModalStyle)
      this.props.parent.setModalStyle('hide');
  }

  /**
   * set qr scan result
   */
  setScanResult(result) {
    this.props.parent.onBarCodeRead({code:result});
  }

  /**
   * if device is scan device, return text component
   * otherwise show camera when tap on textinput area
   */
  render() {
    if (Constants.isScanDevice) {
      return (
        <Text {...this.props}>{this.props.children}</Text>
      )
    } else {
      return (
        <TouchableOpacity onPress={() => this.showQRCamera()}>
          <Text {...this.props}>{this.props.children || <Text style={{color: '#aaa'}}>点击此处开始扫描</Text>}</Text>
        </TouchableOpacity>
      )
    }
  }
}
