import React from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';

import RootSiblings from 'react-native-root-siblings';

import Screen from './screen';

const Siblings = {
  siblings: [],

  show(component, maskStyle, onPress) {
    let view = (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={() => { onPress && onPress() } }>
          <View style={{width:Screen.width, height: Screen.height}}>
            <View style={[styles.mask, maskStyle]}></View>
            {component}
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
    this.siblings.push(new RootSiblings(view));
  },

  destroy() {
    this.siblings.map( v => {
      v.destroy();
    });

    this.siblings = [];
  }
}

const styles = StyleSheet.create({
  container: {
    width: Screen.width,
    height: Screen.height,
    top: 0,
    left: 0,
  },
  mask: {
    position: 'absolute',
    width: Screen.width,
    height: Screen.height,
    backgroundColor: 'rgba(0,0,0,.3)'
  },
});

export default Siblings;