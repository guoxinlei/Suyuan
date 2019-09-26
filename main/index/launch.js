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

  Base,
  Tools,
  Constants,
  Screen,
  Actions,
  Config
} from 'components';

import {User} from 'models';
import rnfs from 'react-native-fs';

export default class Launch extends Base {
  constructor(props) {
    super(props, {
      showFlashImage: false
    });

    this.navBarHidden = true;
    this.statusBarStyle = 'default';
  }

  componentDidMount() {
    super.componentDidMount();

    // show flash screen
    // check if flash screen is specified
    Config.getItem("flash-screen").then( result => {
      console.log(result);
      if (result) {
        rnfs.exists(result.imgurl).then( exists => {
          console.log(exists);
          if (exists) {
            this.setState({showFlashImage: true, flashImage: result.imgurl});
            this.setTimeout( () => {
              //this.setState({showFlashImage: false});
              this.checkLogin();
            }, 2000);
          } else {
            this.checkLogin();
          }
        });
      } else {
        this.checkLogin();
      }
    }).catch( error => { this.checkLogin(); } );
  }

  /**
   * check login
   */
  async checkLogin() {
    // check user login
    await User.checkLogin();
    let user = User.getUser();
    // check user login info
    setTimeout( () => {
      if (!User.isLogin) {
        this.navigator.replace('login');
      } else {
        this.navigator.replace('home');
      }
    }, 200);
  }

  render() {
    if (this.state.showFlashImage) {
      console.log(this.state.flashImage);
      return (
        <View>
          <Image source={{uri: "file://"+this.state.flashImage}} style={{width:Screen.width, height: Screen.height}} resizeMode="cover"/>
        </View>
      );
    }

    return (
      <View></View>
    );

  }

}