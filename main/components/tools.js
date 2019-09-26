'use strict';

import React from 'react';
import {
  Alert,
  Platform,
  NativeModules,
  Linking,
  StatusBar,
  Text
} from 'react-native';

import { User } from 'models';
import Screen from './screen';

const DeviceInfo = require("react-native-device-info");
const CryptoJS = require("crypto-js");
const nativeTools = NativeModules.ToolsModule;
import Toast from "react-native-root-toast";
import Constants from './constants';

const Tools = {
  alert(subject, content) {
    Alert.alert(
      subject,
      content,
      [
        { text: '确定', onPress: () => function () { } },
      ]
    );
  },
  // show toast
  toast(text, opts) {
    let position = opts && opts.position;
    let opacity = opts && opts.opacity;
    if (position == 'center')
      position = Screen.height/2;

    Toast.show(
      (<Text style={{ fontSize: 13 }}>{text}</Text>),
      { position: position || -60, opacity }
    );
  },
  // append parameters of url
  getURL(url) {
    let parameters = "deviceID=" + DeviceInfo.getUniqueID();
    parameters += "&version=" + DeviceInfo.getVersion();
    parameters += "&platform=" + Platform.OS;
    parameters += "&rnversion=" + Constants.rn_version;
    parameters += "&os=" + DeviceInfo.getSystemName() + " " + DeviceInfo.getSystemVersion();
    parameters += "&deviceModel=" + DeviceInfo.getManufacturer() + " " + DeviceInfo.getModel();

    if (url.indexOf("?") > 0)
      return url + "&" + parameters;
    else
      return url + "?" + parameters;
  },
  // make post query for fetch
  query(opts) {
    if (!opts)
      opts = {};

    opts.meta = {
      imei: DeviceInfo.getUniqueID(),
      version: DeviceInfo.getBuildNumber(),
      channel: "00000000",
      phonemodel: DeviceInfo.getManufacturer() + " " + DeviceInfo.getModel(),
      platform: Platform.OS === "android" ? 1 : 0,
    };

    let user = User.getUser();
    if (user) {
      opts.meta.user = {
        userid: user.userid,
        token: user.token
      };
    }

    console.log(opts);

    opts = Tools.encrypt(JSON.stringify(opts));

    var query = {
      method: "POST",
      body: opts,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }

    return query;
  },

  // post query data to url
  async post(opts) {
    //await User.checkLogin();
    //let user = User.getUser();
    let query = Tools.query(opts.data);
    let url = opts.url;

    if (global.defaultServer) {
      url = url.replace(Constants.api.host, global.defaultServer.getURL());
    }

    console.log(url);

    if (opts && opts.debug)
      console.log('>>>>>>>>>>>', opts);
    
    /*if (url.indexOf("?") > 0)
        url = url + "&version=" + Constants.app_version;
    else
        url = url + "?version=" + Constants.app_version;*/

    // sign url
    let key = new Date().getTime();
    let sign = CryptoJS.MD5(query.body + key + "5E2#BD40&FAE^7").toString();
    url = url + "?v=1&key=" + key + "&sign=" + sign;

    // define if show alert when error occured
    if (opts.alertOnError == undefined)
      opts.alertOnError = true;

    let didTimeOut = false;
    let timeoutTimer;
    if (opts.timeout) {
      timeoutTimer = setTimeout(function() {
        didTimeOut = true;
        //reject(new Error('Request timed out'));
        opts.error && opts.error("请求超时");

        Tools.toast("请求超时");
      }, opts.timeout);
    }

    fetch(url, query)
      .then(response => {
        if (opts && opts.debug)
          console.log(response);
          
        if (!didTimeOut) {
          timeoutTimer && clearTimeout(timeoutTimer);
          return response.json();
        }
      }).then(json => this.handleResponse(json, opts))
      .catch(error => {
        if (!didTimeOut) {
          timeoutTimer && clearTimeout(timeoutTimer);

          if (opts.error != null)
            opts.error(error);

          if (opts.alertOnError) {
            Alert.alert(
              '提示信息',
              '服务器开小差了，请稍后重试',
              [
                { text: '确定', onPress: () => function () { } },
              ]
            );
          }
        }
      });
  },
  handleResponse(json, opts) {
    if (json.result && json.result != 200 && json.result != -200) {
      if (opts.error)
        opts.error(json);

      if (opts.alertOnError) {
        Alert.alert(
          '出错了',
          json.descr ? json.descr : "服务器开小差了，请稍后重试",
          [
            { text: '确定', onPress: () => function () { } },
          ]
        );
      }
    } else {
      opts.success(json);
    }
  },

  // concat array & check repeat item by id
  concatArray(arr1, arr2, itemid) {
    if (arr1.length == 0) {
      return arr2;
    }

    if (arr2.length == 0)
      return arr1;

    if (!itemid)
      itemid = "id";
    let newArray = arr1;
    for (let i = 0; i < arr2.length; i++) {
      let arr2T = arr2[i], bFound = false;
      for (let n = 0; n < arr1.length; n++) {
        if (arr1[n][itemid] == arr2T[itemid]) {
          bFound = true;
          break;
        }
      }
      if (!bFound)
        newArray.push(arr2T);
    }

    return newArray;
  },

  formatNumber(n) {
    if (n < 10)
      return "0" + n;

    return n;
  },

  // get post date
  getPostDate(longSeconds) {
    let timeNow = parseInt((new Date().getTime()) / 1000);
    let timeElapse = timeNow - longSeconds;
    if (timeElapse < 60)
      return timeElapse + "秒前";
    if (timeElapse < 60 * 60)
      return parseInt(timeElapse / 60) + "分钟前";
    if (timeElapse < 60 * 60 * 24)
      return parseInt(timeElapse / 3600) + "小时前";

    return Tools.formatDate(new Date(longSeconds * 1000));
  },

  /**
   * format date
   */
  formatDate(date, isFull) {
    let str = date.getFullYear() + "-" + Tools.formatNumber(date.getMonth() + 1) + "-" + Tools.formatNumber(date.getDate());
    if (isFull)
      str += ' ' + Tools.formatNumber(date.getHours()) + ":" + Tools.formatNumber(date.getMinutes()) + ":" + Tools.formatNumber(date.getSeconds());

    return str;
  },

  // check if str is string
  isString(str) {
    return (typeof str == 'string') && str.constructor == String;
  },

  // check if parameter is integer
  isNumber(str) {
    if (isNaN(str))
      return false;

    return true;
  },

  // exit app
  exitApp() {
    nativeTools.exitApp();
  },

  // check app is installed
  isInstalled(name) {
    return new Promise((resolve, reject) => {
      // nativeTools.isInstalled(name, callback);
      let urlScheme = "";
      switch (name) {
        case "qq":
          urlScheme = "mqq://";
          break;
        case "wechat":
          urlScheme = "weixin://";
          break;
        case "weibo":
          urlScheme = "sinaweibo://";
          break;
      }
      Linking.canOpenURL(urlScheme).then(supported => {
        resolve(supported);
      }).catch(error => {
        reject(new Error(error));
      });
    });
  },

  // open app
  openApp(packageName, activityName, url) {
    nativeTools.openApp(packageName, activityName, url);
  },

  // open taobao, jd, tmall client
  openAppUrl(url) {
    // check url, get item id
    let info = new URL(url, true);
    info.id = info.query.id;

    // tmall: first check tmall client, then check taobao client
    if (info.host == "detail.tmall.com") {
      // check tmall client
      let appURL = "tmall://page.tm/itemDetail?itemId=" + info.id;
      Linking.canOpenURL(appURL).then(supported => {
        if (supported) {
          Linking.openURL(appURL);
        } else {
          // check taobao client
          appURL = "taobao://item.taobao.com/item.htm?id=" + info.id;
          Linking.canOpenURL(appURL).then(supported => {
            if (supported)
              Linking.openURL(appURL);
            else
              Linking.openURL(url);
          }).catch(error => { Linking.openURL(url) });
        }
      }).catch(error => { Linking.openURL(url) });
    }
    // taobao
    else if (info.host == "item.taobao.com") {
      let appURL = "taobao://item.taobao.com/item.htm?id=" + info.id;
      Linking.canOpenURL(appURL).then(supported => {
        if (supported)
          Linking.openURL(appURL);
        else
          Linking.openURL(url);
      }).catch(error => { Linking.openURL(url) });
    }
    // jingdong
    else if (info.host == "item.jd.com") {
      let jdInfo = url.match(/\/[0-9]{1,}\.html/);
      if (jdInfo && jdInfo[0]) {
        jdInfo = jdInfo[0].match(/\d+/);

        let appURL = 'openapp.jdmobile://virtual?params={"category":"jump","des":"productDetail","skuId":"' + jdInfo[0] + '","sourceType":"homefloor","sourceValue":"4384", "landPageId":"jshop.cx.mobile"}';
        Linking.canOpenURL(appURL).then(supported => {
          if (supported)
            Linking.openURL(appURL);
          else
            Linking.openURL(url);
        }).catch(error => { Linking.openURL(url) });
      }
    } else {
      Linking.openURL(url);
    }
    return;
    //this.openApp("com.taobao.taobao", "com.taobao.tao.detail.activity.DetailActivity", url);
    //Linking.openURL("tmall://page.tm/itemDetail?itemId=18212959600");
    //Linking.openURL('openapp.jdmobile://virtual?params={"category":"jump","des":"productDetail","skuId":"3129320","sourceType":"homefloor","sourceValue":"4384", "landPageId":"jshop.cx.mobile"}');
    //Linking.openURL("taobao://item.taobao.com/item.htm?id=18212959600");
  },

  // install apk
  installApk(path) {
    nativeTools.installApk(path);
  },

  // umeng: startLevel
  UMeng: {
    ProfileLogin(userid, channel) {
      //if (Platform.OS === "android") {
      nativeTools.UMengProfileLogin(userid, channel);
      //}
    },
    Event(eventName, eventParam) {
      if (Platform.OS === "android") {
        nativeTools.UMengEvent(eventName, eventParam);
      } else {
        nativeTools.UMengEvent(eventName, { params: eventParam });
      }
    },
    BeginLogPageView(pageName) {
      if (Platform.OS === "ios") {
        nativeTools.UMengBeginLogPageView(pageName);
      }
    },
    EndLogPageView(pageName) {
      if (Platform.OS === "ios") {
        nativeTools.UMengEndLogPageView(pageName);
      }
    }
  },

  // get thumbnail from video
  getVideoThumbnail(video, w, h, out) {
    nativeTools.getVideoThumbnail(video, w, h, out);
  },

  // set status bar style
  setBarStyle(type) {
    if (Platform.OS === "android")
      nativeTools.changeStatusBarStyle(type);
    else
      StatusBar.setBarStyle(type);
  },

  // get android intent extras
  getIntentExtras() {
    return new Promise((resolve, reject) => {
      nativeTools.getIntentExtras().then(result => {
        resolve(result);
      }).catch(error => {
        reject(error);
      });
    });
  },

  // get android intent extras
  getNotificationExtras() {
    return new Promise((resolve, reject) => {
      nativeTools.getNotificationExtras((result) => {
        if (!result)
          reject("No extras");
        else {
          resolve(result);
        }
      });
    });
  },

  // CrytoJS AES CBC encryption
  // return base64 encrypted string
  encrypt(data) {
    let key = "2139226343519743";
    let iv = "4370627107694550";
    key = CryptoJS.enc.Utf8.parse(key);
    iv = CryptoJS.enc.Utf8.parse(iv);

    let encrypted = CryptoJS.AES.encrypt(
      data, key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding
      }
    );

    return encrypted.toString();
  },

  // CryptoJS AES CBC decryption
  decrypt(data) {
    let key = "2139226343519743";
    let iv = "4370627107694550";
    key = CryptoJS.enc.Utf8.parse(key);
    iv = CryptoJS.enc.Utf8.parse(iv);

    let decrypted = CryptoJS.AES.decrypt(
      data, key,
      {
        iv: iv,
        padding: CryptoJS.pad.ZeroPadding
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  },

  /**
   * get code from url
   * format: http://c.zhongjiu.cn/s/d/52806634 or http://c.zhongjiu.cn/s/d?itemcode=52806634
   * special url: http://sy.qkj.com.cn/a.aspx?code=32501332252134713537  return original url
   */
  getCode(url, parse =true) {
    if (!parse)
      return url;

    if (!url.startsWith('http') || url.indexOf("sy.qkj.com.cn") > 0)
      return url;

    let idx = url.lastIndexOf("=");
    if (idx == -1)
      idx = url.lastIndexOf("/");
    if (idx == -1)
      return false;

    return url.substring(idx + 1).trim();
  },

  /**
   * parse code
   */
  parseCode(url) {
    if (!url.startsWith('http'))
      return url;

    let idx = url.lastIndexOf("=");
    if (idx == -1)
      idx = url.lastIndexOf("/");
    if (idx == -1)
      return false;

    return url.substring(idx + 1).trim();
  },

  showDevMenu() {
    nativeTools && nativeTools.showDevMenu && nativeTools.showDevMenu();
  },

  // set status bar style
  setStatusBarStyle(type) {
    StatusBar.setHidden(false);
    if (type == 'light')
      type = "light-content";

      StatusBar.setBarStyle(type);
  },

  /**
   * check if current environment is debug
   */
  isDebug() {
    return nativeTools.debug;
  },

};

module.exports = Tools;
