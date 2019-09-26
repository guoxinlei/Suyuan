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

import {User, BottleLog, Bottle as BottleModel} from 'models';
// product list
import Product from '../products';

export default class BottleOfflineLog extends Base {
  constructor(props) {
    super(props, {
      modalVisible: false,
      modalVisible2: false,
      products: [],
      selectedProduct: null,
      modalHideMode:false,
      bottleLog: null
    });

    this.navItems = {
      rightItem: {},
      title: {
        text: '瓶盒关联'
      }
    }
    this.products = [];
    this.allProducts = [];
    this.codelist = {};
    this.submits = 0;
  }

  componentDidMount() {
    super.componentDidMount();

    this.getOfflineLogs();
  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

    this.unmount = true;
  }

  /**
   * get offline logs
   */
  getOfflineLogs() {
    // get offline list
    let logId = this.props.log && this.props.log.data.id;
    if (!logId) {
      Tools.alert('没有指定要编辑的记录');
      this.navigator.pop();
      return;
    }

    BottleLog.find(logId).then( log => {
      console.log(log);
      let product = {product_id: log.data.product_id, product_name: log.data.product}
      this.setState({bottleLog: log, selectedProduct: product});
    }).catch( error => {
      Tools.alert('没有找到要编辑的记录', '该记录可能已经被删除');
      this.navigator.pop();
      return;
    });
  }

  /**
   * show product list
   */
  showProductList(idx) {
    this.refs.productList.showList(idx);
  }

  /**
   * set product
   */
  setProduct(idx, product) {
    this.setState({selectedProduct:product});
  }

  /**
   * delete log
   */
  delete() {
    Alert.alert(
      '确定要删除吗？', 
      '删除后不可恢复',
      [
        {text: '暂不删除'},
        {text: '删除', onPress: () => this.doDelete()}
      ]
    )
  }

  /**
   * do delete
   */
  doDelete() {
    let bottleLog = this.state.bottleLog;
    bottleLog.delete().then( result => {
      // refresh parent & pop
      this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();
      this.navigator.pop();
    }).catch( error => {
      Tools.alert('删除失败了', '请稍候重试');
    });
  }

  /**
   * associate
   */
  associate() {
    if (this.isPosting)
      return;

    // check data
    if (!this.state.selectedProduct || !this.state.selectedProduct.product_id) {
      Tools.alert("请选择商品");
      return;
    }

    let log = this.state.bottleLog;
    if (!log) {
      Tools.alert('没有找到该记录');
      return;
    }

    this.isPosting = true;

    let query = BottleModel.query();
    let codelist = {};
    query.where("log_id = " + log.data.id);
    BottleModel.exec(query).then( list => {
      list.map( bottle => {
        codelist[bottle.data.bottle_code] = bottle.data.case_code;
      });
      this.setState({ isLoading: true });

      Tools.post({
        url: Constants.api.associateBottle,
        data: { productid: this.state.selectedProduct.product_id, codelist: codelist },
        success: (data) => {
          this.submits += data.successcount;
          this.setState({ isLoading: false });
          Tools.alert('关联完成', '关联成功：' + data.successcount + '，关联失败：' + data.failedcount);

          // delete bottle log
          log.delete();

          // refresh parent & pop
          this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();
          this.navigator.pop();
        },
        error: (data) => {
          this.setState({ isLoading: false });
          this.isPosting = false;
        }
      });
    }).catch( error => {
      this.isPosting = false;
      Tools.alert('读取数据失败');
      return;
    });
  }

  /**
   * render offline log
   */
  renderOfflineLog() {
    if (!this.state.bottleLog)
      return null;

    let selectedProduct = this.state.selectedProduct;

    let unsubmits = Object.keys(this.codelist).length;
    let submits = this.submits;

    return (
      <View>
        <View style={{borderBottomWidth:1, borderBottomColor: '#ddd'}}>
          <Product parent={this} selectedProduct={this.state.selectedProduct}/>
        </View>
        <View style={[styles.row, {marginTop:13, borderTopWidth:1, borderTopColor:'#ddd'}]}>
          <Text style={styles.rowText}>待提交瓶数      {this.state.bottleLog.data.nums}</Text>
        </View>

        <View style={{marginTop:12, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          <Button title="删除" onPress={() => this.delete()} style={{width:110, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
          <Button title="提交" onPress={() => this.associate()} style={{width:110}}/>
        </View>
      </View>
    )
  }

  /**
   * render view
   */
  getView() {
    let modalHideModeStyle;
    if (this.state.modalHideMode)
      modalHideModeStyle = {backgroundColor:'transparent', marginTop:1000};

    return (
      <ScrollView style={styles.container}>
        {this.renderOfflineLog()}
      </ScrollView>
    )
  }
}
