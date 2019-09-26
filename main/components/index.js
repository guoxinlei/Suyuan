import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  ListView,
  FlatList,
  Alert,
  Dimensions,
  Platform,
  BackAndroid,
  ToastAndroid,
  Keyboard,
  Animated,
  Linking,
  StatusBar,
  NativeModules,
  WebView,
  CameraRoll,
  InteractionManager,
  KeyboardAvoidingView,
  AsyncStorage,
  DeviceEventEmitter,
  NativeAppEventEmitter,
  Switch,
  Modal,
  ImageEditor,
  ImageStore,
  Easing,
  PanResponder,
  Clipboard,
  Settings,
  Vibration,
  ActivityIndicator
} from 'react-native';

// base class
import Base from "./base";

// custom button
import Button from './button';

// redux connect function
import ReduxConnect from "./redux";

// load constants
import Constants from "./constants";

// load loading Component
import Loading from "./loading";

// load Toast Component
import Toast from 'react-native-root-toast';

// load Tools
import Tools from "./tools";

// load icons component
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Entypo from "react-native-vector-icons/Entypo";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Octicons from "react-native-vector-icons/Octicons";
import Zocial from "react-native-vector-icons/Zocial";
import IconFonts from "./icon-fonts";
const Icons = {
  FontAwesome,
  Entypo,
  EvilIcons,
  Foundation,
  Ionicons,
  MaterialIcons,
  Octicons,
  Zocial,
  IconFonts
};

// get screen object
import Screen from "./screen";

// refreshable list view component
import RefreshableView from "./refreshable-view.js";

// timer mixin
import TimerMixin from "react-timer-mixin";

// device info
import DeviceInfo from 'react-native-device-info';

// no data
import NoData from "./nodata.js";

// form container
import FormContainer from "./form-container";

// config
import Config from "./config";

// router-flux
import {Actions, Scene, Router, ActionConst, Reducer} from "react-native-router-flux";

// qrcode text
import QRCodeText from './qrcode-text';

// styles
import styles from './styles';

// touchable
import Touchable from './touchable';

// date time picker
import DateTimePicker from './date-time-picker';

// siblings
import Siblings from './siblings';

// colors
import Colors from './colors';

// permissions
import Permissions from './permissions';

export {
  React,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  ListView,
  Alert,
  Dimensions,
  Platform,
  BackAndroid,
  ToastAndroid,
  Keyboard,
  Animated,
  Linking,
  StatusBar,
  NativeModules,
  WebView,
  CameraRoll,
  InteractionManager,
  KeyboardAvoidingView,
  AsyncStorage,
  DeviceEventEmitter,
  NativeAppEventEmitter,
  Switch,
  Modal,
  Button,
  ImageEditor,
  ImageStore,
  Easing,
  PanResponder,
  Clipboard,
  FlatList,
  Settings,
  Vibration,
  ActivityIndicator,

  // self and third-party components
  Base,
  ReduxConnect,
  Actions,
  Scene,
  Router,
  Reducer,
  ActionConst,
  Constants,
  Loading,
  Tools,
  RefreshableView,
  Icons,
  Screen,
  DeviceInfo,
  NoData,
  FormContainer,
  Toast,
  Config,
  QRCodeText,
  styles,
  Touchable,
  DateTimePicker,
  Siblings,
  Colors,
  Permissions
}
