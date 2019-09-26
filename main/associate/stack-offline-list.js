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

import {User, StackLog, Stack as StackModel} from 'models';
// product list
import Product from '../products';

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
    let query = StackLog.query();
    query.order("id", false);
    StackLog.exec(query).then( list => {
      this.setState({offlineLogs: list});
    });
  }

  /**
   * show offline log detail page
   * @param {object} log
   */
  showOfflineLog(log) {
    this.navigator.push('stackOfflineLog', {log, _parent: this});
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

    return this.state.offlineLogs.map((log) => {
      return (
        <Touchable onPress={() => this.showOfflineLog(log)} style={styles.offlineItemBox} key={"item" + log.data.id}>
          <View style={styles.offlineItemHeader}>
            <Text style={styles.offlineItemHeaderText} numberOfLines={1}>备注 {log.data.product}</Text>
            <Text style={styles.offlineItemDateText}>{log.getCreationDate().substring(0, 16)}</Text>
          </View>
          <View style={styles.offlineItemBody}>
            <Text style={styles.offlineItemBodyText}>待提交垛数 {log.data.nums}</Text>
          </View>
        </Touchable>
      );
    });
  }
}
