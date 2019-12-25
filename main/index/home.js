import {
  React,
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  AsyncStorage,
  ActivityIndicator,

  Base,
  Tools,
  Constants,
  Screen,
  Config,
  Touchable,
  Siblings,
  Permissions,
  ScrollView
} from 'components';

import Geolocation from '../components/geolocation';

import {  DeviceEventEmitter, NativeModules } from 'react-native';
import {User, Product, Organization, ProductionLine, UserMenu} from 'models';
import {Scan2} from 'images';
import compareVersions from 'compare-versions';
import rnfs from 'react-native-fs';
import DeviceInfo from "react-native-device-info";

import {Banner, InWarehouse, OutWarehouse, Box, Bottle, Stack} from 'images';

const NativeTools = NativeModules.ToolsModule;
/**
 * main component
 */
export default class Home extends Base {
  constructor(props) {
    super(props, {
      isLoading: true,
      userMenu: [],
      showFlashImage: false,
      flashImage: null,
      scanMode: false,
      isUpdatingDatas: false
    });

    this.navBarHidden = false;

    this.navItems = {
      rightItem: {text: '退出'},
      leftItem: {
        component: (
          <TouchableOpacity onPress={() => this.showScan()} style={{ alignItems: 'center'}}>
            <Image source={{uri: Scan2.image}} style={{width:16, height:16, marginBottom:3}} />
            <Text style={{ fontSize: 10, color: '#fff' }}>扫一扫</Text>
          </TouchableOpacity>
        )
      },
      title: {
        text: this.getUsername()
      }
    }

    this.onBarCodeRead = this.onBarCodeRead.bind(this);
    this.statusBarStyle = 'light';

    this.lastScanTime = 0;

    let user = User.getUser();
    this.updateDatasKey = "update-datas-last-time-" + (user && user.userid);

    /*setTimeout( () => {
      NativeTools && NativeTools.testBarCodeRead && NativeTools.testBarCodeRead();
    }, 5000);*/
  }

  async componentDidMount() {
    super.componentDidMount();

    if (Platform.OS == 'android')
      DeviceEventEmitter.addListener("onBarCodeRead", this.onBarCodeRead);

    await User.checkLogin();
    let user = User.getUser();
    //this.navItems.title.text = user.username;
    // check user login info
    if (!User.isLogin) {
      this.navigator.replace('login');
      return;
    }

    // 更新商品、经销商、生产线数据
    this.updateDatas();

    // get user menu
    this.getUserMenu();

    // check new version
    this.checkVersion();

    // location
    this.getLocation();

    this.checkTimer = setInterval( () => {
      this.checkUserLoginStatus();
    }, 30000);
    this.checkUserLoginStatus();
    
    /*setTimeout( () => {
      this.testData();
    }, 8000);*/
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    this.checkTimer && clearInterval(this.checkTimer);
  }

  testData() {
    let code = 99999999 - parseInt(Math.random() * 10000000);
    
    this.onBarCodeRead({code: '201906100016092970'});

  }

  onBarCodeRead(data) {
    if (!this.state.scanMode) {
      // 检查上次扫描时间：两次扫描之间至少间隔1000ms
      let timeNow = new Date().getTime();
      if (timeNow - this.lastScanTime < 1000)
        return;

      this.lastScanTime = timeNow;
      global.EventEmitter.emit('bar-code-read', data);
      return;
    }

    let code = data.code.trim();

    this.setScanResult(code);

    this.hideSiblings();
  }

  /**
   * 更新数据
   */
  updateDatas() {
    // 检查上次更新时间
    AsyncStorage.getItem( this.updateDatasKey ).then( data => {
      if (!data) {
        this.doUpdateDatas();
        return;
      }

      if ( parseInt(data) > new Date().getTime() - 3600000*2) {
        return;
      }

      this.doUpdateDatas();
    } ).catch( error => {
      this.doUpdateDatas();
    });
  }

  /**
   * 执行更新数据
   */
  async doUpdateDatas() {
    // 显示数据更新
    this.setState({isUpdatingDatas: true});

    try {
      // get products & save into sqlite
      await Product.updateProducts();

      // get organizations & save into sqlite
      await Organization.updateOrganizations();

      // get production line & save into sqlite
      await ProductionLine.updateProductionLines();

      AsyncStorage.setItem( this.updateDatasKey, new Date().getTime() + '' );
      this.setState({isUpdatingDatas: false});
    } catch(error) {
      this.setState({isUpdatingDatas: false});
    }
  }

  /**
   * get username
   */
  getUsername() {
    let username = ''+User.username;
    if (username.length > 8)
      username = username.substring(0,8)+"...";

    username += `(${User.offline ? '离线':'在线'})`;

    return username;
  }

  /**
   * user menu
   */
  async getUserMenu() {
    let userMenus = await UserMenu.getMenus();
    if (!userMenus || userMenus.length == 0) {
      userMenus = await UserMenu.updateMenus();
    } else {
      UserMenu.updateMenus();
    }

    let mod = userMenus.length % 3;
    if (mod) {
      for (let i = 0; i < 3 - mod; i++)
        userMenus.push({empty:true});
    }

    this.setState({isLoading: false, userMenu: userMenus});
  }

  /**
   * check version
   */
  checkVersion() {
    Tools.post({
      url: Constants.api.checkVersion,
      alertOnError:false,
      success: (data) => {
        // check version
        // 1: current version greater than server return version
        // 0: current version is same as server return version
        // -1: current version is lower than server return version
        if ( compareVersions(Constants.app_version, data.versionno) == -1 ) {
          this.updateVersion(data.downurl);
        }

        /*data.imgurl = "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1507956148354&di=c764f6ca5912af57792b42de05f9de58&imgtype=0&src=http%3A%2F%2Fb.hiphotos.baidu.com%2Fimage%2Fpic%2Fitem%2Fbba1cd11728b47102872e50dcacec3fdfd032395.jpg";
        data.updatetime = new Date().getTime();*/

        // flash screen
        if (data.imgurl) {
          // check image update time
          Config.getItem("flash-screen").then( (result) => {
            console.log(result)
            if (!result || result.updatetime != data.updatetime)
              this.updateFlashScreen({imgurl: data.imgurl, updatetime: data.updatetime});
          }).catch( error => {
            console.log(error);
            this.updateFlashScreen({imgurl: data.imgurl, updatetime: data.updatetime});
          });
          // download image and set config into AsyncStorage

          
        }
      },
      error: (data) => {

      }
    });
  }

  /**
   * update version
   */
  updateVersion(url) {
    Alert.alert(
      "发现新版本",
      "是否现在升级？",
      [
        // {text: "取消", onPress: () => {} },
        {text: "立即升级", onPress: () => {
            // iOS: open App Store
            /*if (Constants.isIOS) {
              Linking.openURL(url);
              return;
            }*/

            // android: download apk & install
            //Actions.update({url: url});
            this.navigator.push('update', {url: url});
          }
        }
      ],
      { cancelable: false }
    );
    
  }

  /**
   * update flash screen image
   */
  updateFlashScreen(data) {
    // image save file path
    let imageFile = Constants.cachePath + "/flash-screen.jpg";
    // delete image file
    rnfs.unlink(imageFile).catch( error => {} );

    // download image
    rnfs.downloadFile({
      fromUrl: data.imgurl,
      toFile: imageFile
    }).then(() => {
      // download success, update config
      data.imgurl = imageFile;
      Config.setItem("flash-screen", data);
    }).catch((e) => {

    });

    // update config
  }

  logout() {
    User.logout();
    this.navigator.replace('login');
  }

  onRight() {
    this.logout();
  }

  /**
   * 获得位置信息并提交给服务器
   */
  getLocation() {    
    Geolocation.getLocation().then( location => {
      if (!location || !location.coordinate)
        return;

      Tools.post({
        url: Constants.api.saveUserPosition,
        data: {Lng: location.coordinate.longitude, Lat: location.coordinate.latitude},
        alertOnError: false,
        success: (data) => {
          console.log(data);
        },
        error: (error) => {
          console.log(error);
        }
      });
    }).catch( error => {
      
    });
  }

  /**
   * 定时检查用户登录是否有效
   */
  checkUserLoginStatus() {
    if (this.isCheckingUserLoginStatus)
      return;

    this.isCheckingUserLoginStatus = true;
    let user = User.getUser();
    Tools.post({
      url: Constants.api.checkDeviceUser,
      data: {UserId: user && user.userid},
      alertOnError: false,
      success: (data) => {
        // 强制退出
        if (!data.IsValid) {
          this.logout();
          setTimeout( () => {
            Alert.alert(
              '下线通知', 
              data.FailDesc,
              [
                {text: "确定", onPress: () => this.logout()}
              ]
            );
          }, 500);
        }
        this.isCheckingUserLoginStatus = false;
      },
      error: (error) => {
        console.log(error);
        this.isCheckingUserLoginStatus = false;
      }
    });
  }

  /**
   * show scan page
   */
  showScan() {
    if (Constants.isScanDevice) {
      this.setState({scanMode: true});
      let component = (
        <Touchable onPress={() => this.hideSiblings()} style={{width: Screen.width, height: Screen.height, alignItems: 'center', justifyContent:'center'}}>
          <Touchable style={{width: 100, height:100, borderRadius: 8, alignItems: 'center', justifyContent:'center', backgroundColor:'#fff'}}>
            <Text style={{fontSize:14, color: '#000'}}>请扫码</Text>
          </Touchable>
        </Touchable>
      );
      Siblings.show(component, () => this.hideSiblings());

    } else {
      this.navigator.push('qrScan', {_parent:this});
    }
  }

  hideSiblings() {
    this.setState({scanMode: false});
    Siblings.destroy();
  }

  /**
   * set qr scan result
   */
  setScanResult(code) {
    if (!code.startsWith("http")) {
      Tools.alert("提示信息", "该二维码不是一个有效的网址");
      return;
    }
    setTimeout(() => {
      // add from=app to url
      if (code.indexOf("?") > 0)
        code = code + "&from=app";
      else
        code = code + "?from=app";

      this.navigator.push('webview', {url: code});
    }, 500);
  }

  /**
   * render menu
   */
  renderMenu() {
    return this.state.userMenu.map( (v, k) => {
      let borderStyle;
      if (k % 3 == 2)
        borderStyle = {borderRightWidth:0};

      let sceneKey = '', params = {};
      let menuCode = v.data && v.data.menu_code;
      switch (menuCode) {
        case 1:
          sceneKey = 'associateBottle';
          break;
        case 2:
          sceneKey = 'associateBox';
          break;
        case 3:
          sceneKey = 'associateStack';
          break;
        case 4:
          sceneKey = 'warehousingIndex';
          params = {formtype: 1};
          break;
        case 5:
          sceneKey = 'warehousingIndex';
          params = {formtype: 2};
          break;
        case 6:
          sceneKey = 'warehousingIndex';
          params = {formtype: 3};
          break;
        // case 7:
        //   sceneKey = 'warehousingIndex';
        //   params = {formtype: 4};
        //   break;
        case 8:
          sceneKey = 'warehousingIndex';
          params = {formtype: 4};
          break;
        case 9:
          sceneKey = 'record';
          break;
        default:
          return (<View key={"item"+k}></View>);
      }

      return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => this.navigator.push(sceneKey, params)} style={[styles.item, borderStyle]} key={"menu" + k}>
          <Image source={{uri: v.data.menu_icon || ''}} style={{width: 40, height: 40}}/>
          <Text style={styles.itemText}>{v.data.menu_name}</Text>
        </TouchableOpacity>
      );
    });
  }

  /**
   * switch mode
   */
  switchMode() {
    User.offline = !User.offline;
    Tools.toast('已切换到' + (User.offline ? '离线':'在线') + '模式', {position:'center'});
    this.navItems.title.text = this.getUsername();
    this.setState({offline: User.offline});

  }

  showDev() {
    Tools.showDevMenu();
  }

  /**
   * render online/offline switch
   */
  renderOnlineOffline() {
    return;

    return (
      <View style={styles.onlineContainer}>
        <Text style={styles.onlineText}>您当前处于{User.offline ? '离线':'在线'}模式</Text>
        <Touchable onPress={() => this.switchMode()}>
          <Text style={styles.onlineText}>切换为{User.offline ? '在线':'离线'}模式</Text>
        </Touchable>
      </View>
    );
  }

  /**
   * render updating datas tips
   */
  renderUpdatingDatas() {
    if (!this.state.isUpdatingDatas)
      return;

    return (
      <View style={styles.updatingContainer}>
        <ActivityIndicator size="small" color="#fff"/>
        <Text style={styles.updatingText}>正在更新数据</Text>
      </View>
    );
  }

  getView() {
    if (this.state.isLoading) {
      return (
        <View></View>
      )
    }

    return (
      <ScrollView style={styles.container}>
        {this.renderOnlineOffline()}
        <View>
          <Image style={{width: Screen.width, height: Screen.width*0.35}} source={{uri: Banner.image}} resizeMode="cover"/>
        </View>
        <View style={styles.box}>

          {this.renderMenu()}

          {
            Tools.isDebug() ?
            <Touchable onPress={() => this.showDev()} style={styles.item}>
              <Text>DEV</Text>
            </Touchable>
            : null
          }
        </View>
        <View style={styles.versionBox}>
          <Text style={styles.versionText}>当前版本：{Constants.app_version}</Text>
        </View>
        {this.renderUpdatingDatas()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:'#f5f5f5',
    // height: Screen.height-60,
    // width: Screen.width
    flex:1
  },
  box: {
    marginTop: 20,
    flexDirection:'row',
    flexWrap: 'wrap',
    borderTopWidth:1,
    borderTopColor: '#eee',
    height: Screen.height-150
  },
  item: {
    backgroundColor:'#fff',
    justifyContent:'center',
    alignItems:'center',
    width: Screen.width/3,
    height: Screen.width/3,
    borderRightWidth:1,
    borderRightColor: '#eee',
    borderBottomWidth:1,
    borderBottomColor: '#eee'
  },
  itemText: {
    marginTop: 15,
    fontSize: 16,
  },
  navRightItem: {
    marginLeft: 15
  },
  navRightText: {
    fontSize: 16,
    color: '#fff'
  },
  onlineContainer: {
    width: Screen.width,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    backgroundColor: '#f5f5f5',
    padding: 10,
    paddingHorizontal:20
  },
  onlineText: {
    fontSize: 12,
    color: Constants.color.black4
  },
  versionBox: {
    position:'absolute',
    bottom:30,
    left:0,
    width: Screen.width,
    alignItems:'center',
    justifyContent:'center'
  },
  versionText: {
    fontSize:12,
    color: Constants.color.black4
  },
  updatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Screen.width,
    height: 35,
    backgroundColor: '#F35336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  updatingText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10
  }
});
