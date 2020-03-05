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
  Touchable,
  Colors,
  AsyncStorage
} from 'components';

// model
import { Server } from 'models';

export default class Servers extends Base {
  constructor(props) {
    super(props, {
      servers: null
    });

    this.navItems = {
      rightItem: { text: '新增'},
      title: {
        text: '选择服务器'
      }
    }

    this.onServerAdded = this.onServerAdded.bind(this);
    
  }

  componentDidMount() {
    super.componentDidMount();

    global.EventEmitter.addListener("server-added", this.onServerAdded);

    this.reload();

  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();
    global.EventEmitter.removeListener("server-added", this.onServerAdded);

  }

  /**
   * on right item clicked
   */
  onRight() {
    this.navigator.push('addServer');
  }

  /**
   * on server added event: refresh
   */
  onServerAdded() {
    setTimeout( () => {
      this.reload();
    }, 300);
  }

  /**
   * load servers
   */
  reload() {
    Server.getServers().then( servers => {
      this.setState({servers});
    });
  }

  /**
   * remove server
   */
  remove(server) {
    Alert.alert(
      '删除确认',
      '是否确定删除该服务器？',
      [
        {text: '取消'},
        {text: '确定', onPress: () => this.doRemove(server)}
      ]
    )
  }

  doRemove(server) {
    
    server && server.delete().then( () => {
      if (server.data.is_default) {
        Server.find(1).then( server => {
          server.setDefault();
          this.props._parent.setDefaultServer(server);
        });
      }
      AsyncStorage.removeItem("servers")
      setTimeout( () => {
        this.reload();
      }, 300);
    }).catch( error => {
      Tools.alert("删除失败了");
      this.reload();
    });
  }

  /**
   * edit server
   */
  edit(server) {
    this.navigator.push('addServer', {server});
  }

  /**
   * select server
   */
  selectServer(server) {
    server.setDefault().then( () => {
      global.defaultServer =  server;
      this.props._parent.setDefaultServer(server);
      this.navigator.pop();
    });
  }

  /**
   * render servers
   */
  renderServers() {
    return this.state.servers && this.state.servers.map( (server, key) => {
      return (
        <Touchable onPress={() => this.selectServer(server)} style={[styles.row, {justifyContent:'space-between'}]} key={"server"+key}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', paddingLeft:10}}>
            <Icons.Ionicons name="md-radio-button-on" size={26} color={server.data.is_default ? Colors.blue:"#fff"}/>
            <Text style={{fontSize:15, color: Colors.black, marginLeft:10}}>{server.data.name}</Text>
          </View>
          { server.data.id > 1 ?
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', paddingRight:10}}>
              <Touchable onPress={() => this.edit(server)}>
                <Icons.Ionicons name="ios-create-outline" size={26} color={Colors.grey}/>
              </Touchable>
              <Touchable onPress={() => this.remove(server)} style={{marginLeft:20}}>
                <Icons.Ionicons name="ios-trash-outline" size={26} color={Colors.grey}/>
              </Touchable>
            </View>
            : null
          }
        </Touchable>
      );
    });
  }

  /**
   * render view
   */
  getView() {
    return (
      <View style={styles.container}>

        {this.renderServers()}

      </View>
    )
  }

}
