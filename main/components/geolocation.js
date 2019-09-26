import {NativeAppEventEmitter, Alert} from 'react-native';
import Permissions from './permissions';
import Constants from './constants';
import AMapLocation from 'react-native-smart-amap-location';
import axios from 'axios';

class Geolocation {
  constructor(props) {
    
  }

  // current resolver
  static resolver = null;

  // current rejector
  static rejector = null;

  /**
   * get location
   */
  static getLocation( opts ) {
    return new Promise( (resolve, reject) => {
      Geolocation.resolver = resolve;
      Geolocation.rejector = reject;

      // request permission
      Permissions.requestLocation( opts ).then( result => {
        if (Constants.isAndroid)
          AMapLocation.getReGeocode();
        else
          Geolocation.getGeolocation(resolve, reject);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * get location for ios
   */
  static getGeolocation(resolve, reject) {
    navigator.geolocation.getCurrentPosition(
      (geolocation) => {
        console.log(geolocation);
        //this.getLocationAmap(geolocation.coords);
        //Geolocation.getLocationAmap(geolocation.coords, resolve, reject);
        //Geolocation.getLocationAmap({longitude: 116.28051439451, latitude: 39.950629033238}, resolve, reject);
        resolve( {coordinate: geolocation.coords} );
      },
      (error) => {
        reject( error );
      }, 
      {
        enableHighAccuracy: true
      }
    );
  }

  /**
   * on location result
   */
  static onLocationResult(result) {
    Geolocation.resolver && Geolocation.resolver(result);
    return;

    if (!result || !result.coordinate) {
      Geolocation.rejector && Geolocation.rejector("error");
      return;
    }

    let location = {
      longitude: result.coordinate.longitude,
      latitude: result.coordinate.latitude,
      country: typeof result.country == 'string' ? result.country:'',
      province: typeof result.province == 'string' ? result.province:'',
      city: typeof result.city == 'string' ? result.city:'',
      district: typeof result.district == 'string' ? result.district:'',
      street: typeof result.street == 'string' ? result.street + result.number:'',
      aoiname: typeof result.AOIName == 'string' ? result.AOIName:''
    };

    let address = result.formattedAddress;
    if (address && typeof address == 'string') {
      let cityInfo = location.province + location.city + location.district;
      if (address.indexOf(cityInfo) == 0) {
        let reg = new RegExp("^" + cityInfo);
        address = address.replace(reg, '');
      } else {
        cityInfo = location.city + location.district;

        let reg = new RegExp("^" + cityInfo);
        address = address.replace(reg, '');
      }
    }

    location.address = typeof address == 'string' ? address:'';

    // 特殊处理：部分结果返回的省和市相同
    if (location.province && location.province == location.city) {
      if (location.province.indexOf("省") > 0) {
        location.city = location.district;
        location.district = '';
      }
    }

    Geolocation.resolver && Geolocation.resolver(location);
  }

  /**
   * get location info by amap
   */
  static getLocationAmap(geolocation, resolve, reject) {
    if (!geolocation) {
      reject("No geolocaiton info");
      return;
    }

    // no location info in User model, then get location from Amap API
    let location = geolocation.longitude + "," + geolocation.latitude;
    axios.get('http://restapi.amap.com/v3/geocode/regeo?key='+Constants.amapKey + '&location=' + location,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    ).then(result => {
      let data = result.data && result.data.regeocode && result.data.regeocode.addressComponent;
      // not in china, use google maps api
      if (!data.country || data.country.length == 0) {
        //this.getLocationGoogle(geolocation);
        //reject("Can't get location");
        resolve({
          longitude: geolocation.longitude,
          latitude: geolocation.latitude
        });
      } else {
        let currentLocation = {
          country: typeof data.country == 'string' ? data.country:'',
          province: typeof data.province == 'string' ? data.province:'',
          city: typeof data.city == 'string' ? data.city:'',
          district: typeof data.district == 'string' ? data.district:'',
          longitude: geolocation.longitude,
          latitude: geolocation.latitude
        };

        // 没有城市信息，直辖市将province作为市，其他的将district作为市
        if (!currentLocation.city) {
          if (currentLocation.province.indexOf("市") > 0)
            currentLocation.city = currentLocation.province;
          else if (currentLocation.province.indexOf("省") > 0) {
            currentLocation.city = currentLocation.district;
            currentLocation.district = '';
          }
        }

        if (result.data.regeocode.formatted_address) {
          let address = result.data.regeocode.formatted_address;
          if (typeof address == 'string') {
            let cityInfo = currentLocation.province + currentLocation.city + currentLocation.district;
            if (address.indexOf(cityInfo) == 0) {
              let reg = new RegExp("^" + cityInfo);
              currentLocation.address = address.replace(reg, '');
            } else {
              cityInfo = currentLocation.city + currentLocation.district;
              let reg = new RegExp("^" + cityInfo);
              currentLocation.address = address.replace(reg, '');
            }
          }
        }

        if (data.streetNumber && typeof data.streetNumber.street == 'string') {
          currentLocation.street = data.streetNumber.street + data.streetNumber.number;
        }

        console.log(data);

        resolve(currentLocation);
      }
    }).catch(error => {
      console.log(error);
      reject(error);
    });
  }
}

if (Constants.isAndroid) {
  AMapLocation.init(null);
  NativeAppEventEmitter.addListener('amap.location.onLocationResult', Geolocation.onLocationResult);
}

export default Geolocation;