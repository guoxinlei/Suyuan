import React from 'react';

import {
  TouchableOpacity
} from 'react-native';

import Tools from './tools';

export default class Touchable extends React.Component {
  constructor(props) {
    super(props);

    this.lastTap = 0;
  }

  /**
   * onPress
   */
  onPress() {
    if (!this.props.onDoublePress) {
      this.props.onPress && this.props.onPress();
      return;
    }

    // check double tap
    let timeNow = new Date().getTime();
    // double tap
    if (timeNow - this.lastTap < 500) {
      this.props.onDoublePress && this.props.onDoublePress();
    } else {
      // check single tap
      setTimeout(() => {
        if (this.lastTap == timeNow) {
          this.props.onPress && this.props.onPress();
        }
      }, 400);
    }
    this.lastTap = timeNow;
  }

  onLongPress() {
    this.props.onLongPress && this.props.onLongPress();
  }

  render() {
    return (
      <TouchableOpacity 
        {...this.props}
        onPress={() => this.onPress()}
        onLongPress={() => this.onLongPress()}
        activeOpacity={this.props.activeOpacity || 0.9} 
        hitSlop={{top:5, left:5, right:5, bottom:5}}>
        {this.props.children}
      </TouchableOpacity>
    )
  }
}