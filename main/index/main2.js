import {
  React,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,

  Base,
  Actions,
  Scene,
  Router,
  Icons,
  Tools,
  Reducer,
  ActionConst,
  Constants,
  ReduxConnect
} from "components";

// user
import {User, Server} from 'models';

// launch
import Launch from './launch';
// home component
import Home from "./home";
// login
import Login from "../users/login";

// associate index
import Associate from '../associate/';
// associate bottle
import Bottle from '../associate/bottle';
// associate box
import Box from '../associate/box';
// associate stack
import Stack from '../associate/stack';
// warehousing index
import WareHousingIndex from '../warehousing/';
// add new form
import AddNewForm from '../warehousing/add';
// submit form
import SubmitForm from '../warehousing/submit';
// qr scan
import QRScan from '../components/scan';
// product list
import ProductList from '../products/list';
// receivers
import ReceiverList from '../warehousing/organization';
// webview
import MyWebView from '../components/webview';
// update version
import Update from './update';
// bottle offline log
import BottleOfflineLog from '../associate/bottle-offline-log';
// product mark
import ProductMark from '../products/mark';
// box offline log
import BoxOfflineLog from '../associate/box-offline-log';
// stack offline log
import StackOfflineLog from '../associate/stack-offline-log';
// production lines
import ProductionLines from '../warehousing/production-line';
// warehousing mark
import WarehousingMark from '../warehousing/mark';
// servers
import Servers from '../users/servers';
// add server
import AddServer from '../users/servers-add';
// 设置接收单位
import SetReceiver from '../warehousing/set-receiver';

// event emitter
import Events from 'events';

global.EventEmitter = new Events.EventEmitter();

// global: current focus page
global.currentFocusPage = null;

Server.getDefault().then( server => {
  global.defaultServer = server;
}).catch( error => {
  
});

/**
 * animation style for scenes
 */
export const animationStyle = (props) => {
  const { layout, position, scene } = props;

  const direction = (scene.navigationState && scene.navigationState.direction) ?
  scene.navigationState.direction : 'horizontal';

  const index = scene.index;
  const inputRange = [index - 1, index, index + 1];
  const width = layout.initWidth;
  const height = layout.initHeight;

  const opacity = position.interpolate({
    inputRange,
    //default: outputRange: [1, 1, 0.3],
    outputRange: [1, 1, 1],
  });

  const scale = position.interpolate({
    inputRange,
    //default: outputRange: [1, 1, 0.95],
    outputRange: [1, 1, 1],
  });

  let translateX = 0;
  let translateY = 0;

  switch (direction) {
    case 'horizontal':
    translateX = position.interpolate({
      inputRange,
      //default: outputRange: [width, 0, -10],
      outputRange: [width, 0, 0],
    });
    break;
    case 'vertical':
    translateY = position.interpolate({
      inputRange,
      //default: outputRange: [height, 0, -10],
      outputRange: [height, 0, 0],
    });
    break;
  }

  return {
    opacity,
    transform: [
      { scale },
      { translateX },
      { translateY },
    ],
  };
};

/**
 * main component
 */
class Main extends Base {
  constructor(props) {
    super(props);

    this.navBarHidden = true;
  }

  shouldComponentUpdate() {
    return false;
  }

  async componentDidMount() {
    super.componentDidMount();

    // check user login status
    await User.checkLogin();
    let user = User.getUser();
    if (User.isLogin && this.actions.userActions) {
      this.actions.userActions.setUser({user:user, isLogin:true});
    }
    if (Platform.OS == 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
    }

    StatusBar.setHidden(false);
    StatusBar.setBarStyle("light-content");
  }

  /**
   * android back button handler
   * let our scene component to handle this event
   */
  backAndroidHandler() {
    Actions.refresh({backPressed: new Date().getTime()});
    return true;
  }

  render() {

    return (
      <Router
        sceneStyle={styles.scene}
        navigationBarStyle={{height:66}}
        animationStyle={animationStyle}
        backAndroidHandler={this.backAndroidHandler.bind(this)}
        hideNavBar={true}>
        <Scene key="root">
          {/* launch */}
          <Scene key="launch">
            <Scene key="launch1" component={Launch} title="启动"/>
          </Scene>
          {/* home */}
          <Scene key="home">
            <Scene key="home1" component={Home} title="首页"/>
          </Scene>
          {/* login */}
          <Scene key="login">
            <Scene key="login1" component={Login} title="登录" panHandlers={null}/>
          </Scene>
          {/* associate */}
          <Scene key="associate">
            <Scene key="associate1" component={Associate} title="关联" panHandlers={null}/>
          </Scene>
          {/* associate bottle */}
          <Scene key="associateBottle">
            <Scene key="associateBottle1" component={Bottle} title="单瓶关联" panHandlers={null}/>
          </Scene>
          {/* bottle offline log */}
          <Scene key="bottleOfflineLog">
            <Scene key="bottleOfflineLog1" component={BottleOfflineLog} title="瓶盒关联记录" panHandlers={null}/>
          </Scene>
          {/* associate bottle with box */}
          <Scene key="associateBox">
            <Scene key="associateBox1" component={Box} title="瓶箱关联" panHandlers={null}/>
          </Scene>
          {/* box offline log */}
          <Scene key="boxOfflineLog">
            <Scene key="boxOfflineLog1" component={BoxOfflineLog} title="组箱记录" panHandlers={null}/>
          </Scene>
          {/* associate box with stack */}
          <Scene key="associateStack">
            <Scene key="associateStack1" component={Stack} title="组垛" panHandlers={null}/>
          </Scene>
          {/* stack offline log */}
          <Scene key="stackOfflineLog">
            <Scene key="stackOfflineLog1" component={StackOfflineLog} title="组垛记录" panHandlers={null}/>
          </Scene>
          {/* warehousing index */}
          <Scene key="warehousingIndex">
            <Scene key="warehousingIndex1" component={WareHousingIndex} title="入库" panHandlers={null}/>
          </Scene>
          {/* warehousing add new form */}
          <Scene key="addNewForm">
            <Scene key="addNewForm1" component={AddNewForm} title="新增入库单" panHandlers={null}/>
          </Scene>
          {/* warehousing submit form */}
          <Scene key="submitForm">
            <Scene key="submitForm1" component={SubmitForm} title="提交出入库单" panHandlers={null}/>
          </Scene>
          {/* warehousing submit form for replace */}
          <Scene key="submitFormReplace">
            <Scene key="submitFormReplace1" component={SubmitForm} title="提交出入库单" panHandlers={null}/>
          </Scene>
          {/* warehousing mark */}
          <Scene key="warehousingMark">
            <Scene key="warehousingMark1" component={WarehousingMark} title="重置单号" panHandlers={null}/>
          </Scene>
          {/* qr scan */}
          <Scene key="qrScan">
            <Scene key="qrScan1" component={QRScan} title="二维码扫描" panHandlers={null}/>
          </Scene>
          {/* product list */}
          <Scene key="productList">
            <Scene key="productList1" component={ProductList} title="选择商品" panHandlers={null}/>
          </Scene>
          {/* product mark */}
          <Scene key="productMark">
            <Scene key="productMark1" component={ProductMark} title="新增商品" panHandlers={null}/>
          </Scene>
          {/* receiver organization list */}
          <Scene key="receiverList">
            <Scene key="receiverList1" component={ReceiverList} title="选择单位" panHandlers={null}/>
          </Scene>
          {/* production lines */}
          <Scene key="productionLines">
            <Scene key="productionLines1" component={ProductionLines} title="选择生产线" panHandlers={null}/>
          </Scene>
          {/* webview */}
          <Scene key="webview">
            <Scene key="webview1" component={MyWebView} title="" panHandlers={null}/>
          </Scene>
          {/* update */}
          <Scene key="update">
            <Scene key="update1" component={Update} title="" panHandlers={null}/>
          </Scene>
          {/* servers */}
          <Scene key="servers">
            <Scene key="servers1" component={Servers} title="" panHandlers={null}/>
          </Scene>
          {/* add servers */}
          <Scene key="addServer">
            <Scene key="addServer1" component={AddServer} title="" panHandlers={null}/>
          </Scene>
          {/* set receiver */}
          <Scene key="setReceiver">
            <Scene key="setReceiver1" component={SetReceiver} title="" panHandlers={null}/>
          </Scene>
        </Scene>
      </Router>
    )
  }
}

const styles = StyleSheet.create({
  scene: {
    //backgroundColor:'transparent'
    shadowColor: Constants.color.black5,
    shadowRadius: 4,
    shadowOffset: {width: -4, height: 1},
    shadowOpacity: 0.5
  }
});

export default ReduxConnect(Main, 'user', 'userActions');
