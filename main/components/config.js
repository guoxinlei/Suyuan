'use strict';

import {
  AsyncStorage
} from "react-native";

const configItemKey = "config";

const Config = {
  setItem(key, value) {
    AsyncStorage.getItem(configItemKey).then(result => {
      let items = {};
      if (result) {
        items = JSON.parse(result);
      }
      if (typeof items != 'object')
        items = {};

      items[key] = value;
      AsyncStorage.setItem(configItemKey, JSON.stringify(items));

    }).catch(error => {
      reject(error);
    });
  },
  getItem(key) {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(configItemKey).then(result => {
        if (result) {
          let items = JSON.parse(result);
          if (typeof items != 'object')
            items = {};

          resolve(items[key]);
        } else {
          resolve("");
        }
      }).catch(error => {
        reject(error);
      });
    });

  }
};

export default Config;
