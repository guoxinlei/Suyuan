import {
  React,
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  DeviceEventEmitter,
  Platform,
  Vibration,
  Keyboard,
  ScrollView,

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config,
  QRCodeText,
  styles,
  Touchable
} from 'components';

// model
import { Server } from 'models';

export default class AddServer extends Base {
  constructor(props) {
    super(props, {
      servers: null,
      serverName: props.server && props.server.data.name,
      serverURL: props.server && props.server.data.url
    });

    this.navItems = {
      rightItem: { },
      title: {
        text: '编辑服务器'
      }
    }
    
  }

  componentDidMount() {
    super.componentDidMount();

    Server.getServers().then( servers => {
      this.setState({servers});
    });

  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

  }

  /**
   * add server
   */
  addServer() {
    let name = this.state.serverName && this.state.serverName.trim();
    let url = this.state.serverURL && this.state.serverURL.trim();

    if (!name) {
      Tools.alert("请输入服务器名称");
      return;
    }

    if (!url) {
      Tools.alert("请输入服务器域名或IP");
      return;
    }

    // 编辑模式
    let task;
    if (this.props.server) {
      task = this.props.server.edit({
        name, url
      });
    } else {
      task = Server.add({
        name, url
      });
    }

    task.then( server => {
      global.EventEmitter.emit("server-added");
      Tools.alert( (this.props.server ? '编辑':"新增") + "服务器成功");
      this.navigator.pop();
    }).catch(error => {
      Tools.alert( (this.props.server ? '编辑':"新增") + "服务器失败", "请重试");
    });
  }

  /**
   * render servers
   */
  renderForm() {
    let textInputStyle = {
      width: Screen.width - 120,
      height: 40,
      fontSize: 14,
      marginTop:-3,
      paddingLeft:5,
      color: Constants.color.black5
    };

    let textInputContainerStyle = {
      height: Constants.scaleRate > 1.5 ? 35:26, 
      overflow:'hidden', 
      borderRadius:8, 
      backgroundColor:'#f4f4f4',
      borderWidth:1,
      borderColor: '#ccc'
    }

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={[styles.rowText, {width: 64}]}>名称</Text>
          <View style={textInputContainerStyle}>
            <TextInput
              ref={input => this.inputRef = input}
              style={textInputStyle} 
              underlineColorAndroid="transparent"
              placeholder="请输入服务器名称"
              placeholderTextColor="#aaa"
              value={this.state.serverName}
              onChangeText={(txt) => this.setState({ serverName: txt })}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowText, {width: 64}]}>域名/IP</Text>
          <View style={textInputContainerStyle}>
            <TextInput
              ref={input => this.inputRef = input}
              style={textInputStyle} 
              underlineColorAndroid="transparent"
              placeholder="请输入服务器域名或IP"
              placeholderTextColor="#aaa"
              value={this.state.serverURL}
              onChangeText={(txt) => this.setState({ serverURL: txt })}
            />
          </View>
        </View>
        <View style={{marginTop:20, marginBottom: 30, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          <Button style={{width: Screen.width-40}} title="提交" onPress={() => this.addServer()} fontStyle={{color: '#fff'}}/>
        </View>
      </View>
    );
  }

  /**
   * render view
   */
  getView() {
    return (
      <View style={styles.container}>

        {this.renderForm()}

      </View>
    )
  }

}
