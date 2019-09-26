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

export default class BoxOfflineLog extends Base {
  constructor(props) {
    super(props, {
      modalVisible: false,
      modalVisible2: false,
      products: [],
      selectedProduct: null,
      modalHideMode:false,
      stackLog: null
    });

    this.navItems = {
      rightItem: {},
      title: {
        text: '组垛'
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

    StackLog.find(logId).then( log => {
      let product = {product_id: log.data.product_id, product_name: log.data.product}
      this.setState({stackLog: log, selectedProduct: product});
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
    let stackLog = this.state.stackLog;
    stackLog.delete().then( result => {
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

    let log = this.state.stackLog;
    if (!log) {
      Tools.alert('没有找到该记录');
      return;
    }

    this.isPosting = true;

    let query = StackModel.query();
    let codelist = {};
    query.where("log_id = " + log.data.id);
    StackModel.exec(query).then( list => {
      list.map( stack => {
        codelist[stack.data.stack_code] = stack.data.box_code;
      });
      this.setState({ isLoading: true });

      Tools.post({
        url: Constants.api.associateStack,
        data: {productid: this.state.selectedProduct.product_id, stackcodes: codelist},
        success: (data) => {
          //this.submits += Object.keys(this.codelist).length;
          this.submits += data.successcount;
          this.setState({isLoading:false});
          Tools.alert('关联完成', '关联成功：'+data.successcount+'，关联失败：'+data.failedcount);

          // delete bottle log
          log.delete();

          // refresh parent & pop
          this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();
          this.navigator.pop();
        },
        error: (data) => {
          this.setState({isLoading:false});
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
    if (!this.state.stackLog)
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
          <Text style={styles.rowText}>待提交垛数      {this.state.stackLog.data.nums}</Text>
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
