import {
  React,
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
  DeviceEventEmitter,
  Platform,
  Vibration,
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

import {User, Warehousing} from 'models';
// product list
import Product from '../products';
// offline item
import OfflineItem from './offline-item';

export default class StackOfflineList extends Base {
  constructor(props) {
    super(props, {
      offlineLogs: null
    });

  }

  componentDidMount() {
    super.componentDidMount();

    this.getOfflineLogs();
  }

  /**
   * get offline logs
   */
  getOfflineLogs() {
    // get offline list
    let query = Warehousing.query();
    query.where("ware_type = " + this.props.type);
    query.order("id", false);
    Warehousing.exec(query).then( list => {
      this.setState({offlineLogs: list, idx: this.state.idx+1});
    });
  }

  /**
   * show offline log detail page
   * @param {object} log
   */
  showOfflineLog(log) {
    log.getProducts().then( list => {
      let products = [];
      list.map( product => {
        products.push(product.data);
      });
      this.navigator.push('addNewForm', {
        products, 
        warehousing: log,
        formtype: log.data.ware_type,
        _parent: this
      });
    }).catch( error => {

    });
  }

  /**
   * render view
   */
  getView() {
    if (!this.state.offlineLogs || this.state.offlineLogs.length == 0) {
      if (this.props.from == 'segment') {
        return (
          <View style={{alignItems:'center', marginTop:50}}>
            <Text style={{fontSize:16, color: Constants.color.black3}}>没有要提交的数据</Text>
          </View>
        );
      } else {
        return null;
      }
    }

    let views = this.state.offlineLogs.map((log, key) => {
      return (
        <Touchable onPress={() => this.showOfflineLog(log)} key={"item:" + this.state.idx + ":" + log.data.id}>
          <View style={[styles.offlineItemBox, {marginTop: key == 0 ? 6*Constants.scaleRate:3*Constants.scaleRate}]}>
            <View style={styles.offlineItemHeader}>
              <Text style={styles.offlineItemHeaderText} numberOfLines={1}>单号22 {log.data.ware_no}</Text>
              <Text style={styles.offlineItemDateText}>{log.getCreationDate().substring(0, 16)}</Text>
            </View>
          </View>
          <OfflineItem warehousing={log}/>
        </Touchable>
      );
    });

    return (
      <ScrollView style={{height: Constants.contentHeight-80}}>
        {views}
      </ScrollView>
    )
  }
}
