import {
  Alert,
  Linking
} from 'react-native';

import Permissions from 'react-native-permissions';
import Constants from './constants';

export default class PermissionsWrapper {
  /**
   * redirect to Settings in system
   */
  static goSettings() {
    Linking.openURL('app-settings:');
  }

  /**
   * show alert
   */
  static showAlert(subject, message) {
    let buttons = [{text: '确定'}];
    if (Constants.isIOS) {
      buttons.push({text: '去设置', onPress: () => this.goSettings() });
    }
    Alert.alert(
      subject, message, buttons
    );
  }

  /**
   * request photos privilege
   */
  static requestPhotos() {
    return new Promise( (resolve, reject) => {
      let subject = '请开启相册权限';
      let message = '请在系统设置里允许图曰App使用相册权限';

      Permissions.request('photo').then(response => {
        // Returns once the user has chosen to 'allow' or to 'not allow' access
        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        if (response != 'authorized') {
          this.showAlert(subject, message);
          reject('error');
        } else {
          resolve('ok');
        }
      }).catch( error => {
        this.showAlert(subject, message);
      });
    });
  }

  /**
   * request location privilege
   */
  static requestLocation( opts ) {
    return new Promise( (resolve, reject) => {
      let subject = '没有获取到您的位置';
      let message = '请在系统设置里允许图曰App使用定位权限';
      let disableAlert = opts && opts.showAlert === false;

      Permissions.request('location').then(response => {
        // Returns once the user has chosen to 'allow' or to 'not allow' access
        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        if (response != 'authorized') {
          if (!disableAlert)
            this.showAlert(subject, message);

          reject('error');
        } else {
          resolve('ok');
        }
      }).catch( error => {
        if (!disableAlert)
          this.showAlert(subject, message);
          
        reject( error );
      });
    });
  }

  /**
   * request contacts permissions
   */
  static requestContacts(opts) {
    return new Promise( (resolve, reject) => {
      Permissions.request('contacts').then( response => {
        if (response != 'authorized') {
          reject('error');
        } else {
          resolve('ok');
        }
      }).catch( error => {
        reject(error);
      });
    });
  }

  /**
   * request camera permissions
   */
  static requestCamera(opts) {
    return new Promise( (resolve, reject) => {
      let subject = '请开启相机权限';
      let message = '请在系统设置里允许图曰App使用相机权限';

      Permissions.request('camera').then(response => {
        // Returns once the user has chosen to 'allow' or to 'not allow' access
        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        if (response != 'authorized') {
          this.showAlert(subject, message);
          reject('error');
        } else {
          resolve('ok');
        }
      }).catch( error => {
        this.showAlert(subject, message);
      });
    });
  }
}