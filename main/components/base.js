import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  BackHandler,
  StatusBar,
  NativeModules
} from 'react-native';

// tools
import Tools from "./tools";
// constants
import Constants from "./constants";
// navigator
import Navigator from "./navigator";
// loading indicator
import Loading from "./loading";
// redux connect
import ReduxConnect from './redux';
// screen dimensions
import Screen from './screen';
// siblings
import Siblings from './siblings';
// navigation stack
import NavigationStack from '../models/navigation-stack';
// colors
import Colors from './colors';

// lodash
import _ from 'lodash';

/**
 * base class:
 * class extends from base should implement getView method
 */
class Base extends React.Component {
  constructor(props, state) {
    super(props);

    let states = Object.assign({
      isLoading: false,
      isRefreshing: false,
      isInfiniting: false,
      allowInfinite: true,
      idx: 0
    }, state);

    // default state
    this.state = states;

    // navigator object
    this.navigator = new Navigator();

    // if  props contains sceneKey,
    // then this is a full view scene component
    if (props.navigation) {
      this.isScene = true;
    } else {
      this.isScene = false;
      this.navBarHidden = true;
    }

    // redux store & actions
    this.redux = props.redux || {};
    this.actions = props.actions || {};
    // component key
    this.componentKey = props.navigation && props.navigation.state && props.navigation.state.key;
  }

  /**
   * set loading state
   */
  setLoading() {
    this.setState({isLoading:true});
  }

  /**
   * reset loading state
   */
  resetLoading() {
    this.setState({
      isLoading:false,
      isRefreshing:false,
      isInfiniting:false
    });
  }

  /**
   * component focus
   */
  didFocus() {
    if (this.props.navigation)
      this.navigator.setNavigator(this.props.navigation);

    // hide status bar except Notch devices
    if (this.statusBarHidden && !Screen.isNotch && !Screen.isOldAndroid) {
      StatusBar.setHidden(true);
    } 
    // set status bar style
    else {
      if (this.statusBarStyle) {
        setTimeout( () => {
          if (this.statusBarStyle == 'hide')
            StatusBar.setHidden(true);
          else
            Tools.setStatusBarStyle(this.statusBarStyle);
        },100);
      }

      // set background color
      /*if (Screen.isOldAndroid) {
        if (this.statusBarBackgroundColor)
          StatusBar.setBackgroundColor(this.statusBarBackgroundColor);
        else
          StatusBar.setBackgroundColor(Colors.whiteTwo);
      }*/
    }

    // add android back handler
    if (Constants.isAndroid) {
      BackHandler.addEventListener("hardwareBackPress", this.handleAndroidBackPressed.bind(this));
    }

    // set current focus component in NavigationStack
    NavigationStack.currentFocusComponent = this;

    this.onFocus && this.onFocus();
  }

  /**
   * component blur
   */
  didBlur() {
    // remove android back handler
    if (Constants.isAndroid) {
      BackHandler.removeEventListener("hardwareBackPress", this.handleAndroidBackPressed.bind(this));
    }

    this.onBlur && this.onBlur();
  }

  componentDidMount() {
    this.onComponentDidMount();
  }

  /**
   * invoke by child component's componentDidmount
   */
  onComponentDidMount() {
    this.isScene = this.props.navigation ? true:false;
    
    // Remove the listener when you are done
    if (this.props.navigation) {
      this.navigateStateSubscriptions = {
        didFocus: this.props.navigation.addListener(
          'didFocus',
          payload => {
            this.didFocus();
          } ),
        didBlur: this.props.navigation.addListener(
          'didBlur',
          payload => {
            this.didBlur();
          } )
      };
    }
  }

  /**
   * props changed
   */
  componentWillReceiveProps(nextProps) {
    if (Constants.isAndroid && nextProps.backPressed && this.isScene) {
      this.handleAndroidBackPressed();
    }

    if (nextProps.redux)
      this.redux = nextProps.redux;
  }

  /**
   * override setState method
   * @param {*} params 
   */
  setState(params) {
    if (!this.unmounted && !this.isUnmounted) {
      // isLoading: delay set state
      if (params.isLoading === false) {
        let newParams = _.omit(params, ["isLoading"]);
        super.setState(newParams);

        this.loadingRef && this.loadingRef.finish && this.loadingRef.finish();
        this.setTimeout( () => {
          super.setState({isLoading: false});
        }, 500);
      } else {
        super.setState(params);
      }
    }
  }

  /**
   * android back pressed event handler
   * if component has onBack method, then call onBack first
   * otherwise check current scene type, exit app on root; pop on others
   */
  handleAndroidBackPressed() {
    if (this.unmounted)
      return false;

    let routeName = this.props.navigation && this.props.navigation.state && this.props.navigation.state.routeName;

    // check siblings
    if (Siblings.siblings && Siblings.siblings.length > 0) {
      Siblings.destroy();
      return true;
    }

    if (this.onBack) {
      // onBack method can break pop event
      if (this.onBack())
        return true;
    }

    if (routeName == 'IndexTab') {
      //BackHandler.exitApp();
      Tools.exitApp();
      return true;
    }

    this.navigator.pop();
    return true;
  }

  /**
   * component unmount event
   */
  componentWillUnmount() {
    if (this.timer)
      clearTimeout(this.timer);

    this.navigator.setComponentUnmount();

    /**
     * if parent specified & parent has setStatusBar method
     * then call parent setStatusBar method
     */
    this.props._parent && this.props._parent.setStatusBar && this.props._parent.setStatusBar();

    this.unmounted = true;
    this.unmount = true;

    // remove android back handler
    if (this.isScene && Constants.isAndroid) {
      BackHandler.removeEventListener("hardwareBackPress", this.handleAndroidBackPressed.bind(this));
    }

    // remove focus & blur listener
    if (this.navigateStateSubscriptions) {
      this.navigateStateSubscriptions.didBlur && this.navigateStateSubscriptions.didBlur.remove();
      this.navigateStateSubscriptions.didFocus && this.navigateStateSubscriptions.didFocus.remove();
    }
  }

  // timer
  setTimeout(callback, timeout) {
    this.timer = setTimeout(callback, timeout);
  }

  // render refreshable view
  renderRefreshable() {

  }

  // custom navigation bar
  /*static renderNavigationBar(props) {
    return Navigator.renderNavigationBar(props);
  }*/
  renderNavigationBar() {
    if (this.navBarHidden)
      return null;

    return this.navigator.renderNavigationBar({component:this});
  }

  // hide or show navigation bar
  hideNavBar(status) {
    this.navBarHidden = status;
    this.navigator.hideNavBar(status);
  }

  // set loading status state
  loading(status) {
    this.setState({isLoading: status});
    if (!status)
      this.setState({isRefreshing: false, isInfiniting: false});
  }

  // render view
  render() {
    if (!this.getView) {
      return <View style={[styles.container, {margin:30}]}><Text>You should implement getView method</Text></View>
    }

    // padding top based on platform & navigation bar status (hidden or shown)
    let paddingTop = Screen.navBarHeight;
    if (this.navBarHidden)
      paddingTop = 0;
    else if (this.statusBarHidden)
      paddingTop -= 20;

    // calculate content height
    let statusBarHeight = 0;

    this._contentHeight = Screen.height;
    if (!this.navBarHidden) {
      this._contentHeight -= Screen.navBarHeight;
    }
    if (this.statusBarHidden)
      this._contentHeight += 20;
    else
      this._contentHeight -= statusBarHeight;

    // render view based on this.viewType
    let view;
    switch (this.viewType) {
      case 'refreshable':
        view = this.renderRefreshable()
        break;
      default:
        view = this.getView()
        break;
    }

    let loading;
    if (this.state.isLoading && !this.state.isRefreshing && !this.state.isInfiniting && !this.hideLoadingOnReload) {
      if (this.isScene) {
        loading = (
          <Loading/>
        );
      }
    }

    let flexStyle = this.isScene && !this.isTabbar ? {height: Screen.height, backgroundColor: Colors.background}:null;

    return (
      <View style={[styles.container, {paddingTop}, flexStyle]}>
        {view}
        {this.renderNavigationBar()}
        {loading}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0
    //backgroundColor: Colors.background
  },
  loadingContainer: {
    position:'absolute',
    top:0,
    left:0,
    height:2,
    overflow:'hidden',
    backgroundColor:'transparent'
  }
})

export default Base;
