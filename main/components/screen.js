import {Dimensions, Platform, Alert, NativeModules, PixelRatio} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const windowHeight = Dimensions.get('window').height;

// 有刘海的设备
const androidNotchModels = 'COL-AL10,CLT-AL00,CLT-AL01,ANE-TL00,EML-AL00,vivo X21,OPPO PAC,OPPO PAA,OPPO PAD';
// 左上角挖孔设备
const leftCornerNotchModels = 'PCT-AL10,PCT-TL10,PCT-L29,VCE-AL00,VCE-TL00,VCE-L22'; // Android SDK built for x86,

const isAndroidNotch = false; //Platform.OS == 'android' && androidNotchModels.indexOf(DeviceInfo.getModel()) >= 0;
const isLeftCornerNotch = false; //Platform.OS == 'android' && leftCornerNotchModels.indexOf(DeviceInfo.getModel()) >= 0;
const isIOSNotch = Platform.OS == 'ios' && (windowHeight == 812 || windowHeight == 896);
const isNotch = isAndroidNotch || isIOSNotch;
// 旧版本的Android设备
const isOldAndroid = /*isAndroidNotch ||*/ (Platform.OS == 'android' && Platform.Version <= 20);
// 导航栏高度（普通设备）
const navBarHeightNormal = 44;
// 状态栏高度（android刘海设备按照不支持Translucent方法处理）
//const statusBarHeightNotch = isIOSNotch ? 30 : (isAndroidNotch ? 0:20);
let statusBarHeight = isNotch ? 30 : 20;
// 导航栏高度（兼容有刘海设备）
// const navBarHeight = navBarHeightNormal + (isAndroidNotch || isLeftCornerNotch ? 15: (isIOSNotch ? 22:0));
if (Platform.OS === 'android' && NativeModules.ToolsModule && NativeModules.ToolsModule.statusBarHeight)
  statusBarHeight = NativeModules.ToolsModule.statusBarHeight/PixelRatio.get();

const Screen = {
  dimensions: Dimensions.get('window'),

  // device width
  get width() {
    return this.dimensions.width;
  },
  // device height
  get height() {
    /*if (Platform.OS === 'android' && statusBarHeight > 25) 
      return this.dimensions.height + statusBarHeight;
    else*/
      return this.dimensions.height;
  },

  // device height patch ( for android notch device )
  getHeight() {
    if (Platform.OS === 'android' && statusBarHeight >= 25)
      return this.dimensions.height + statusBarHeight;
    else
      return this.dimensions.height;
  },

  // navigation bar height
  get navBarHeight() {
    return statusBarHeight + 44 + (isIOSNotch ? 12:0);
  },

  // content height without navbar
  get contentHeight() {
    return this.height - this.navBarHeight;
  },

  // content height path (for android notch devices)
  get bodyHeight() {
    let height = this.height - this.navBarHeight;
    if (Platform.OS === 'android' && statusBarHeight >= 25)
      height += statusBarHeight;

    return height;
  },

  // status bar height
  get statusBarHeight() {
    return statusBarHeight;
  },

  // content height without status bar
  get contentHeightWithoutStatusBar() {
    return this.contentHeight + statusBarHeight;
  },

  // 旧版本的android
  isOldAndroid: isOldAndroid,

  // 有刘海的设备
  isNotch: isNotch,

  // 有刘海的android设备
  isAndroidNotch: Platform.OS === 'android' && statusBarHeight >= 25,

  // 左上角挖孔设备
  isLeftCornerNotch: isLeftCornerNotch,

  // 有刘海的ios设备
  isIOSNotch: isIOSNotch,

  // detect iphonex
  isIPhoneX: Platform.OS == 'ios' && (windowHeight == 812 || windowHeight == 896)
}

export default Screen;
