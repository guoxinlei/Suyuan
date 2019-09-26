import {
  React,
  View,
  TextInput,
  StatusBar,
  Platform,

  Base,
  ReduxConnect,
  Screen,
  Colors
} from "components";

import {NativeModules} from 'react-native';

import Moment from 'moment';

import SplashScreen from 'react-native-smart-splash-screen';

// event emitter
import {AppState, Text as RNText} from 'react-native';
import Events from 'events';

// user
import {User, Server} from 'models';

// index routes
import IndexRoutes from '../routers/';

global.User = User;
global.EventEmitter = new Events.EventEmitter();
global.EventEmitter.setMaxListeners(200);
global.User.checkLogin().catch(error => {});

// disable console in distribution
if (!__DEV__) {
  global.console = {
    info: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
  };
}

console.ignoredYellowBox = [
  'Setting a timer'
];

Server.getDefault().then( server => {
  global.defaultServer = server;
}).catch( error => {
  
});

/**
 * main component
 */
class Main extends Base {
  constructor(props) {
    super(props, {
      appState: AppState.currentState
    });

  }

  async componentDidMount() {
    super.componentDidMount();
    RNText.defaultProps.allowFontScaling = false;
    TextInput.defaultProps.allowFontScaling = false;

    // register app state event
    AppState.addEventListener('change', this._handleAppStateChange);

    if (Platform.OS == 'android') {
      SplashScreen.close({
        animationType: SplashScreen.animationType.none,
        duration: 500,
        delay: 300,
      });
      
      if (Screen.isOldAndroid) {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(Colors.whiteTwo);
      } else {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor("transparent");
      }
    } else {
      StatusBar.setHidden('false');
    }

    // check user login status
    global.User.checkLogin().then( (user) => {
      this.actions.userActions.setUser({user:user, isLogin:true});
    }).catch( error => {

    });

    // check new version
    setTimeout(() => {
      NativeModules.ToolsModule.setBackground && NativeModules.ToolsModule.setBackground();
    }, 5000);
  }

  _handleAppStateChange = (nextAppState) => {
    if ( nextAppState === 'background' ) {
      //console.log('app background');
      this.appState = 'background';
      global.EventEmitter.emit('on-app-state', 'background');
    }
    else if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      this.appState = 'active';

      setTimeout( () => {
        if (global.User.isLogin) {
          global.EventEmitter.emit('startup-user-login');
        }

        global.EventEmitter.emit('app-active');
        global.EventEmitter.emit('on-app-state', 'active');

      }, 1000);
    }
    this.setState({appState: nextAppState});
  }

  /**
   * view layout event
   * set dimensions in Screen model
   */
  onLayout(event) {
    let {width, height} = event.nativeEvent.layout;
    Screen.dimensions = {width, height};
  }

  /**
   * render main
   */
  render() {
    return (
      <View style={{width: Screen.width, height: Screen.height}} onLayout={(event) => this.onLayout(event)}>
        <IndexRoutes />
      </View>
    );
  }
}

export default ReduxConnect(Main, 'user', 'userActions');