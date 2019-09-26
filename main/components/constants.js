'use strict';

import {
  Platform
} from 'react-native';

import rnfs from "react-native-fs";
//const api_host = "http://test.open.zhongjiuyun.com/";
const api_host = "http://open.zhongjiuyun.com/";
import DeviceInfo from "react-native-device-info";
import Screen from "./screen";

const navBarHeight = Platform.OS == 'ios' ? 64 : (Platform.Version > 20 ? 64:46);
const statusBarHeight = Platform.OS == 'ios' ? 20 : (Platform.Version > 20 ? 20:0);

const Constants = {
  "dataPath": (Platform.OS === "android" ? rnfs.ExternalDirectoryPath : rnfs.DocumentDirectoryPath) + "/data",
  "cachePath": (Platform.OS === "android" ? rnfs.ExternalDirectoryPath : rnfs.DocumentDirectoryPath) + "/cache",
  "app_name": "溯源",
  app_version: DeviceInfo.getVersion(),
  bundle_version: "1070",
  rn_version: "0.44",

  // check if current device support scan
  isScanDevice: DeviceInfo.getModel() == 'PL-40L' || DeviceInfo.getModel() == 'PDA',

  storage_login: "@suyuan:login",

  // navigation bar height
  navBarHeight: navBarHeight,

  // content height without navbar
  contentHeight: Screen.height - navBarHeight,

  // status bar height
  statusBarHeight: statusBarHeight,

  // content height without status bar
  contentHeightWithoutStatusBar: Screen.height - navBarHeight + statusBarHeight,

  // os is android
  isAndroid: Platform.OS == 'android',

  // os is ios
  isIOS: Platform.OS == 'ios',

  // check if os is old version of android (less than API 22 which doesn't support translucent statusbar)
  isOldAndroid: Platform.OS == 'android' && Platform.Version < 21 ? true:false,

  // scale height based on 480x800 device
  scaleRate: Math.ceil(Screen.height/512),

  // supported fonts family
  fonts: {
    bold1: Platform.OS == 'ios' ? '500':'300',
    bold2: Platform.OS == 'ios' ? '400':'200'
  },

  color: {
    "header_color": "#f0f0f0",
    "header_text_color": "#444",
    "background_color": "#f4f5f6",
    "tabIcons_color": "rgb(102,102,102)",
    "tabIcons_selected_color": "rgb(244,91,89)",
    "gray": "darkgray",
    "darkgray": "dimgray",
    yellow: '#edaf4c',
    blue: '#428de5',
    //颜色由浅入深
    black0: 'gainsboro',
    black1: 'lightgrey',
    black2: 'darkgray',
    black3: 'gray',
    black4: '#1c1e25',
    black5: '#14151a',
    black6: 'black',
  },

  api: {
    // api host
    host: api_host,

    // login
    login: api_host + 'origin/userlogin',

    // get products
    getProducts: api_host + 'origin/getproducts',

    // associate bottle
    associateBottle: api_host + 'origin/unionsinglebottle',

    // un-associate bottle
    unAssociateBottle: api_host + 'origin/ununionsinglebottle',

    // associate box with bottles
    associateBox: api_host + 'origin/unionbox',

    // un-associate bottles from box
    unAssociateBox: api_host + 'origin/ununionbox',

    // associate stack with boxes
    associateStack: api_host + 'origin/unionstack',

    // un-associate boxes from stack
    unAssociateStack: api_host + 'origin/ununionstack',

    // get form info
    getFormInfo: api_host + 'origin/getforminfo',

    // 模糊搜索表单
    getFormInfo2: api_host + 'origin/getforminfo2',

    // 保存表单的生产线和生产批次信息
    saveFormInfo: api_host + 'origin/saveforminfo',

    // create form
    addForm: api_host + 'origin/addform',

    // update form (set organization)
    saveFormOrganization: api_host + 'origin/SaveFormOrganization',

    // get organization
    getOrganization: api_host + 'origin/getorganization',

    // get organization(入库)
    getOrganizationStorage: api_host + 'origin/getorganizationforstorage',

    // submit form
    submitForm: api_host + 'origin/submitform',

    // submit form (case)
    submitFormCase: api_host + 'origin/submitformcase',

    // finish form
    finishForm: api_host + 'origin/finishform',

    // finish production form
    finishProductionForm: api_host + 'origin/finishproductionform',

    // user privilege
    userMenu: api_host + 'origin/getusermenu',

    // version & flash screen
    checkVersion: api_host + 'origin/getlastversionno',

    // get product by qrcode
    getProductByCode: api_host + 'origin/getproductsbycode',

    // get production lines
    getProductionLines: api_host + 'origin/getproductionlines',

    // offline form
    addOfflineForm: api_host + 'origin/addofflineform',

    // 查询盒码
    getBottleInOrgItem: api_host + 'origin/getbotttleinorgitem',

    // 查询箱码
    getItemsInBox: api_host + 'origin/getitemsinbox',

    // 查询剁码
    getBoxesInStack: api_host + 'origin/getboxesinstack',

    // 箱加盒
    boxAddOrgItem: api_host + 'origin/boxaddorgitem',

    // 箱减盒
    boxRemoveOrgItem: api_host + 'origin/boxremoveorgitem',

    // 剁加盒
    stackAddBox: api_host + 'origin/stackaddbox',

    // 剁减盒
    stackRemoveBox: api_host + 'origin/stackremovebox',

    // 更新用户位置
    saveUserPosition: api_host + 'origin/saveuserposition',

    // 检查用户登录设备（用于单点登录）
    checkDeviceUser: api_host + 'origin/checkdeviceuser'

  }
}

export default Constants;
