'use strict';

import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity
} from 'react-native';

import {Actions} from "react-native-router-flux";
import Constants from "./constants";
import IconFonts from "react-native-vector-icons/Ionicons";
import Tools from "./tools";
import Navigator from './navigator';

class NavBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      backgroundOpacity: 1
    }

    this.clicked = false;
    this.navigator = new Navigator();
  }

  componentDidMount() {

  }

  pop() {
    this.navigator.pop();
    //Actions.pop();
  }

  // on scroll event:
  onScroll(event) {
    let nativeEvent = event.nativeEvent;
    let opacity = 0;
    if (nativeEvent.contentOffset.y > 180)
      opacity = 1;
    else if(nativeEvent.contentOffset.y > 30)
      opacity = (nativeEvent.contentOffset.y-30)/150;

    this.setState({ backgroundOpacity: opacity });
    if (opacity > 0.8)
      Tools.setBarStyle('default');
    else
      Tools.setBarStyle('light');
  }

  // right item press event
  onRightClick() {
    // avoid click too fast
    if (this.click) {
      setTimeout(() => {
        this.click = false;
      },1000);
      return;
    }
    if (this.props.component && this.props.component.onRight)
      this.props.component.onRight();
  }

  render() {
    let opacity = this.state.backgroundOpacity || 1;
    let backgroundColor = Constants.color.blue;
    let fontColor = '#fff';
    let marginTop = 0;
    let paddingTop = 10;
    if (Platform.OS === 'android' && Platform.Version < 21) {
      marginTop = 0;
      paddingTop = 0;
    }

    // set left, title & right items
    let rightItemText = '';
    let leftItemText = '返回';
    let title = this.props.title;
    let navItems = this.props.component.navItems;
    let navStyle = null, titleStyle = null;
    let rightItemStyle = null;
    let rightItemComponent = null;
    let leftItemComponent = null;

    /**
     * if component has custom nav items
     */
    if (navItems) {
      if (navItems.rightItem != null) {
        rightItemText = navItems.rightItem ? navItems.rightItem.text:'';
        rightItemStyle = navItems.rightItem.style;
        rightItemComponent = navItems.rightItem.component;
      }

      if (navItems.leftItem != null) {
        leftItemText = navItems.leftItem ? navItems.leftItem.text:'';
        leftItemComponent = navItems.leftItem.component;
      }

      if (navItems.title != null) {
        title = navItems.title ? navItems.title.text:'';
        titleStyle = navItems.title && navItems.title.style ? navItems.title.style:null;
      }

      if (navItems.style)
        navStyle = navItems.style;

      if (navItems.fontColor)
        fontColor = navItems.fontColor;
    }

    let containerMarginTop = 0;
    if (this.props.component.statusBarHidden)
      containerMarginTop = -Constants.statusBarHeight;
    return (
      <View style={[styles.navBar, {marginTop:containerMarginTop, backgroundColor: backgroundColor}, navStyle]}>
        <View style={{flex:1, alignItems:'center', paddingTop:paddingTop}}>
          {
            navItems && navItems.title && navItems.title.component ?
            <View>
              {navItems.title.component}
            </View>
            :
            <Text style={[styles.navBarTitle, {color: fontColor}, titleStyle]}>{title}</Text>
          }
        </View>
        { leftItemComponent ?
          <View style={styles.navLeftItem}>
            {leftItemComponent}
          </View>
          :
          (
            leftItemText ?
              <TouchableOpacity onPress={this.pop.bind(this)} activeOpacity={1} style={[styles.navLeftItem, {marginTop:marginTop}]}>
                <IconFonts name="ios-arrow-back" size={30} color={fontColor} style={{margin:10, marginTop:marginTop}}/>
              </TouchableOpacity> : null
          )
        }

        { rightItemComponent ?
          <View style={styles.navRightItem}>
            {rightItemComponent}
          </View>
          :
          ( rightItemText ?
          <TouchableOpacity onPress={() => this.onRightClick()} style={styles.navRightItem}>
            <Text style={[{fontSize: 14, color: '#fff'}, rightItemStyle]}>{rightItemText}</Text>
          </TouchableOpacity> : null )
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    top:0,
    left: 0,
    right:0,
    height: Constants.navBarHeight,
    paddingTop:5,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems:'center'
  },
  navBarTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: Constants.fonts.bold1
  },
  navLeftItem: {
    position: 'absolute',
    left: 0,
    top: Constants.isOldAndroid ? 0:15,
    padding:10
  },
  navRightItem: {
    position: 'absolute',
    right:5,
    top:Constants.isOldAndroid ? 5:22,
    padding:10
  }
});


export default NavBar;
