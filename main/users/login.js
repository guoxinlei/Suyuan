import {
  React,
  StyleSheet,
  Text,
  View,
  ListView,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Alert,
  Image,
  TextInput,
  Platform,
  Keyboard,

  Base,
  Tools,
  Constants,
  FormContainer,
  Styles,
  Screen,
  Icons,
  Colors,
  Touchable,
  AsyncStorage
} from 'components';

// user
import {User, Server, LoginHistory} from 'models';

import {LoginBackground, Logo, User as UserIcon, Password} from 'images';
import {getDeviceCountry} from "react-native-device-info";

export default class Login extends Base {
  constructor(props) {
    super(props, {
      txtLoginName: "",
      txtPassword: "",
      keyboardHeight: 0,
      txtFocus: false,
      defaultServer: null,
      loginNameOffsetY: 0,
      history: null
    });

    this.navBarHidden = true;
  }

  componentDidMount() {
    super.componentDidMount();

    if (Platform.OS === 'ios') {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange.bind(this)),
      ];
    } else {
      this.subscriptions = [
        Keyboard.addListener('keyboardDidHide', this.onKeyboardChange.bind(this)),
        Keyboard.addListener('keyboardDidShow', this.onKeyboardChange.bind(this)),
      ];
    }

    AsyncStorage.getItem("servers").then((value) => {
       if(value){
         const jsonValue = JSON.parse(value);
         let name = jsonValue.name
         let url = jsonValue.url
         Server.getServers().then( servers => {
           if(servers.length == 1){
             Server.add({name, url});
           }
         })
         // if(value.is_default){
         //   jsonValue.setDefault();
         //   this.setDefaultServer(jsonValue);
         // }
       }
    });

    Server.getDefault().then( server => {
      global.defaultServer = server;

      this.setState({defaultServer: server});
    }).catch( error => {
      Tools.alert("获取服务器信息失败");
    });
    this.getHistory();
  }

  getHistory() {
    LoginHistory.getHistory().then( list => {
      console.log(list);
      this.setState({history: list});
    }).catch( error => {

    })
  }

  onKeyboardChange(event) {
    if (!event) {
      this.setState({txtFocus:false});
      return;
    }

    //console.log(event);
    if (event && event.endCoordinates) {
      this.setState({keyboardHeight: event.endCoordinates.height});
      if (Platform.OS == 'android')
        this.setState({txtFocus: true});
    }
  }

  login() {
    let loginname = this.state.txtLoginName.trim();
    let password = this.state.txtPassword.trim();
    if (!loginname) {
      Tools.alert(' ', '请输入用户名');
      return;
    }

    if (!password) {
      Tools.alert(' ', '请输入密码');
      return;
    }

    // post query
    this.setState({ isLoading: true });
    Tools.post({
      url: Constants.api.login,
      data: { loginname, password: Tools.encrypt(password) },
      success: (data) => {
        this.handleResponse(data);
        this.setState({ isLoading: false });
      },
      error: (data) => {
        console.log(data);
        this.setState({ isLoading: false });
      }
    });
  }

  // handle login response
  handleResponse(response) {

    // transform coderules to object
    let coderules = response.coderules;
    let info = coderules.split(";");
    coderules = {};
    for (let i = 0; i < info.length; i++) {
      let rule = info[i];
      let info2 = rule.split(":");
      coderules[info2[0]] = info2[1];
    }

    let user = {
      userid: response.userid,
      token: response.token,
      coderules: coderules,
      username: response.username,
      orgId: response.orgId,
      orgName: response.orgName
    }

    // save login info
    User.saveToken(user);

    // 登录历史
    let loginname = this.state.txtLoginName.trim();
    let password = this.state.txtPassword.trim();
    LoginHistory.saveHistory({
      login_name: loginname,
      password: password,
      username: response.username,
      user_id: response.userid
    });

    this.navigator.replace('home');
  }

  /**
   * show servers
   */
  showServers() {
    this.navigator.push("servers", {_parent: this});
  }

  /**
   * set default server
   */
  setDefaultServer(server) {
    this.setState({defaultServer: server});
  }

  toggleHistory() {
    if (this.state.showHistory) {
      this.setState({showHistory:false});
      return;
    }

    this.loginNameRef && this.loginNameRef.measure( (ox, oy, w, h, px, py) => {
      this.setState({loginNameOffsetY: py + h, showHistory:true});
    });
  }

  removeHistory(history) {
    history && history.delete();

    setTimeout( () => {
      this.getHistory();
    }, 500);
  }

  selectHistory(history) {
    if (history && history.data.login_name)
      this.setState({txtLoginName: history.data.login_name});

    this.toggleHistory();
  }

  dismissKeyboard() {
    Keyboard.dismiss();

    this.setState({showHistory: false});
  }

  renderHistory() {
    if (!this.state.showHistory)
      return;

    let views = this.state.history && this.state.history.map( history => {
      return (
        <Touchable 
          onPress={() => this.selectHistory(history)} 
          style={[styles.inputBox, {justifyContent:'space-between', backgroundColor:'#f4f5f6'}]} 
          key={"item" + history.data.id}>
          <View style={{width: Screen.width-100}}>
            <Text style={{fontSize: 14, color: '#000'}} numberOfLines={1}>{history.data.login_name} ({history.data.username})</Text>
          </View>
          <Touchable onPress={() => this.removeHistory(history)} style={{marginRight: 20}}>
            <Icons.Ionicons name="ios-close-circle" size={20} color='#bbb'/>
          </Touchable>
        </Touchable>
      );
    });

    return (
      <View style={[styles.historyBox, {top: this.state.loginNameOffsetY}]}>
        {views}
      </View>
    );
  }

  getView() {
    let formFill = this.state.txtLoginName && this.state.txtPassword;
    let marginTop = Screen.height < 650 && this.state.txtFocus ? (this.state.keyboardHeight/2):0;
    return (
      <TouchableWithoutFeedback onPress={() => this.dismissKeyboard()}>
        <View style={{width: Screen.width, height: Screen.height, marginTop: -marginTop}}>
          <Image source={{uri: LoginBackground.image}} style={{width: Screen.width, height: Screen.height}} resizeMode="cover"/>
          <FormContainer style={{position:'absolute', top:0, left:0, right:0, width: Screen.width, height: Screen.height}}>
            <View style={styles.logoBox}>
              <Image source={{uri:Logo.image}} style={{width:105, height:105}}/>
            </View>
            <View style={styles.loginBox}>
              <View style={[styles.inputBox, this.state.currentFocus == 'mobile' ? styles.inputFocus:null]} ref={(ref) => this.loginNameRef = ref}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <View style={{top:1, marginRight:10}}>
                    <Image source={{uri: UserIcon.image}} style={{width: 20, height:20}} resizeMode="contain"/>
                  </View>
                  <TextInput
                    style={[styles.textInput, {flex:null, width: Screen.width-80}]}
                    underlineColorAndroid="transparent"
                    placeholder="请输入用户名"
                    placeholderTextColor='#bbb'
                    value={this.state.txtLoginName}
                    onFocus={() => this.setState({currentFocus:'mobile', showHistory:false})}
                    onChangeText={(text) => this.setState({ txtLoginName: text })}>
                  </TextInput>
                </View>
                {
                  this.state.history && this.state.history.length > 0 ?
                  <Touchable onPress={() => this.toggleHistory()} style={[styles.rightBox, {marginRight:20}]}>
                    <Icons.Ionicons name={this.state.showHistory ? "ios-arrow-up-outline":"ios-arrow-down-outline"} size={26} color='#bbb'/>
                  </Touchable>
                  :
                  <View style={[styles.rightBox, {marginRight:38}]}></View>
                }
              </View>
              <View style={[styles.inputBox, this.state.currentFocus == 'password' ? styles.inputFocus:null]}>
                <View style={{top:1, marginRight:10}}>
                  <Image source={{uri: Password.image}} style={{width: 20, height:20}} resizeMode="contain"/>
                </View>
                <TextInput
                  style={styles.textInput}
                  underlineColorAndroid="transparent"
                  placeholder="请输入密码"
                  placeholderTextColor='#bbb'
                  onFocus={() => this.setState({currentFocus:'password', showHistory:false})}
                  onChangeText={(text) => this.setState({ txtPassword: text })}
                  secureTextEntry={true}>
                </TextInput>
              </View>
              <Touchable onPress={() => this.showServers()} style={[styles.inputBox, {justifyContent:'space-between'}, this.state.currentFocus == 'password' ? styles.inputFocus:null]}>
                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                  <View style={{top:3, marginLeft:2, marginRight:15}}>
                    <Icons.Ionicons name="ios-apps-outline" size={24} color='#bbb'/>
                  </View>
                  <Text style={styles.text}>请选择服务器</Text>
                </View>
                <View style={styles.rightBox}>
                  <Text style={styles.rightText}>{this.state.defaultServer && this.state.defaultServer.data.name}</Text>
                  <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color='#bbb'/>
                </View>
              </Touchable>
            </View>
            <View>
              <TouchableOpacity activeOpacity={formFill ? 0.8:1} style={[styles.button, formFill ? styles.buttonActive:null]} onPress={() => {formFill && this.login()}}>
                <Text style={[styles.buttonText, formFill ? styles.buttonTextActive:null]}>登录</Text>
              </TouchableOpacity>
            </View>
          </FormContainer>
          {this.renderHistory()}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  loginBox: {
    backgroundColor: '#fff'
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    height: 53,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 15
  },
  inputFocus: {
    //borderBottomWidth: 2,
    //borderBottomColor: Constants.color.yellow,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    borderColor: 'rgba(0,0,0,0)',
    borderWidth: 0,
    marginTop: (Platform.OS === "android" && Platform.Version > 21 ? 3 : 9),
    paddingTop: (Platform.OS === "android" ? 3 : 0),
    top: (Platform.OS === "android" ? 3:0)
  },
  sendVerify: {
    marginRight: 10,
    borderRadius: 4,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    height: 30,
    padding: 8,
  },
  sendText: {
    fontSize: 12,
    color: '#666',
    marginTop: (Platform.OS === 'android' ? -2 : 0)
  },
  rowText: {
    fontSize: 16,
    color: Constants.color.black4
  },
  button: {
    height: 40,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: '#d7d7d7',
    marginHorizontal:10,
    marginTop:30,
    borderRadius: 6
  },
  buttonActive: {
    backgroundColor:Constants.color.blue
  },
  buttonText: {
    fontSize: 18,
    color: '#fff'
  },
  buttonTextActive: {
    color: '#fff'
  },
  logoBox: {
    height: 250,
    alignItems:'center',
    justifyContent:'center'
  },
  rightBox: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    marginRight:16
  },
  rightText: {
    fontSize: 15,
    color: Colors.blue,
    marginRight:5
  },
  text: {
    fontSize:15,
    color: '#bbb',
    marginTop:5
  },
  historyBox: {
    position:'absolute', 
    left:0, 
    width: Screen.width, 
    backgroundColor:'#fff'
  }
});
