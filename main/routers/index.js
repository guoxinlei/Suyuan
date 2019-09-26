import {
  Platform,
  Animated,
  Easing
} from 'react-native';
import { 
  createStackNavigator
} from 'react-navigation';

import Constants from '../components/constants';

// map state to props
import mapNavigationStateParamsToProps from './map-state-to-props';

// launch
import Launch from '../index/launch';
// home component
import Home from "../index/home";
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
import Update from '../index/update';
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

/**
 * Stack Navigator
 */
const RootStack = createStackNavigator(
  {
    launch: {
      screen: mapNavigationStateParamsToProps(Launch)
    },
    /**
     * home
     */
    home: {
      screen: mapNavigationStateParamsToProps(Home),
    },
    /**
     * login
     */
    login: {
      screen: mapNavigationStateParamsToProps(Login)
    },
    /**
     * associate
     */
    associate: {
      screen: mapNavigationStateParamsToProps(Associate),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * associateBottle
     */
    associateBottle: {
      screen: mapNavigationStateParamsToProps(Bottle),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * bottle offline log
     */
    bottleOfflineLog: {
      screen: mapNavigationStateParamsToProps(BottleOfflineLog),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * associate bottle with box
     */
    associateBox: {
      screen: mapNavigationStateParamsToProps(Box),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * box offline log
     */
    boxOfflineLog: {
      screen: mapNavigationStateParamsToProps(BoxOfflineLog),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * associate box with stack
     */
    associateStack: {
      screen: mapNavigationStateParamsToProps(Stack),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * stack offline log
     */
    stackOfflineLog: {
      screen: mapNavigationStateParamsToProps(StackOfflineLog),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * warehousing index
     */
    warehousingIndex: {
      screen: mapNavigationStateParamsToProps(WareHousingIndex),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * warehousing add new form
     */
    addNewForm: {
      screen: mapNavigationStateParamsToProps(AddNewForm),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * warehousing submit form
     */
    submitForm: {
      screen: mapNavigationStateParamsToProps(SubmitForm),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * warehousing submit form for replace
     */
    submitFormReplace: {
      screen: mapNavigationStateParamsToProps(SubmitForm),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * warehousing mark
     */
    warehousingMark: {
      screen: mapNavigationStateParamsToProps(WarehousingMark),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * qr scan
     */
    qrScan: {
      screen: mapNavigationStateParamsToProps(QRScan),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * product list
     */
    productList: {
      screen: mapNavigationStateParamsToProps(ProductList),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * product mark
     */
    productMark: {
      screen: mapNavigationStateParamsToProps(ProductMark),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * receiver organization list
     */
    receiverList: {
      screen: mapNavigationStateParamsToProps(ReceiverList),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * production lines
     */
    productionLines: {
      screen: mapNavigationStateParamsToProps(ProductionLines),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * webview
     */
    webview: {
      screen: mapNavigationStateParamsToProps(MyWebView),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * update
     */
    update: {
      screen: mapNavigationStateParamsToProps(Update),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * servers
     */
    servers: {
      screen: mapNavigationStateParamsToProps(Servers),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * add servers
     */
    addServer: {
      screen: mapNavigationStateParamsToProps(AddServer),
      navigationOptions: {
        gesturesEnabled: false
      }
    },
    /**
     * set receiver
     */
    setReceiver: {
      screen: mapNavigationStateParamsToProps(SetReceiver),
      navigationOptions: {
        gesturesEnabled: false
      }
    }
    
  },
  {
    //initialRouteName: 'login',
    headerMode:'none',
    cardStyle: {backgroundColor: Constants.isAndroid ? 'transparent':'#fff'},
    navigationOptions: ({navigation}) => ({
      gesturesEnabled: true
    }),
    transitionConfig: () => ({
      transitionSpec: {
        duration: 200,
        easing: Easing.out(Easing.poly(4)),
        timing: Animated.timing,
      },
      screenInterpolator: sceneProps => {
        const { layout, position, scene } = sceneProps;
        const { index, route } = scene;

        let isVertical = false;
        /*if (route && route.routeName == 'preLogin' 
            || route.routeName == 'createWorks' 
            || route.routeName == 'recommendUsers'
            || route.routeName == 'selectUserTags')
          isVertical = true;*/

        const height = layout.initHeight;
        const width = layout.initWidth;
        const translatePosition = position.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [isVertical ? height:width, 0, 0],
        });

        const opacity = position.interpolate({
          inputRange: [index - 1, index - 0.99, index],
          outputRange: [0, 1, 1],
        });

        let transform = isVertical ? {translateY: translatePosition}:{translateX:translatePosition};

        return {
          opacity,
          left: 0,
          transform: [ transform ]
        };
      },
    })
  }
);

export default RootStack;