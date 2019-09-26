'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableHighlight,
  Image,
  Dimensions,
  Platform,
  ListView,
  Animated
} from 'react-native';

const screen = Dimensions.get("window");
import Styles from "./styles.js";
import TimerMixin from "react-timer-mixin";

const Toast = React.createClass({
  mixins: [TimerMixin],
  getInitialState() {
    return {
      bounceValue: new Animated.Value(0),
      toastText: null,
    }
  },
  show(message) {
    this.setState({ toastText: message });
    Animated.spring(this.state.bounceValue, {
      toValue: 1,
      friction: 10,
      tension: 50
    }).start();
    this.setTimeout(this.hide, 3000);
  },
  hide() {
    Animated.spring(this.state.bounceValue, {
      toValue: 0,
      friction: 10,
      tension: 50
    }).start();
  },
  render() {
    var translateY = this.state.bounceValue.interpolate({
      inputRange: [0, 1], outputRange: [0, 450]
    });

    return (
      <Animated.View style={[styles.toastWindow, { transform: [{ translateY: translateY }] }]}>
        <View style={styles.toastBody}>
          <Text style={styles.toastText}>{this.state.toastText}</Text>
        </View>
      </Animated.View>
    );
  }
});

var styles = StyleSheet.create({
  toastWindow: {
    width: screen.width,
    alignItems: 'center',
    top: -450,
    position: "absolute",
  },
  toastBody: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: "rgba(15, 15, 15, 0.8)",
    padding: 10,
    borderRadius: 15,
    marginLeft: 80,
    marginRight: 80,
    paddingLeft: 20,
    paddingRight: 20,
  },
  toastText: {
    fontSize: 14,
    color: '#fff',
  }
});

export default Toast;
