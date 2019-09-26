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
  Image,

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
// offline log list
import BottleOfflineList from './bottle-offline-list';
// icons
import { Associate as AssociateIcon } from 'images';

export default class Bottle extends Base {
  constructor(props) {
    super(props, {
      modalVisible: false,
      modalVisible2: false,
      products: [],
      selectedProduct: null,
      scanedBottles: 0,
      currentFocus: 'neima',
      currentCode: {neima:'', waima:''},
      unAssociateCode:'',
      modalHideMode:false,
      selectedSegment:0,
      idx: 0,
      isAssociated: null,
      associateItems: []
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

    this.onBarCodeRead = this.onBarCodeRead.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    /**
     * check offline un-submit data
     */
    Config.getItem('bottle-codes').then(result => {
      let codelist = result.codelist;
      if (codelist) {
        let keys = Object.keys(codelist);

        if (keys.length > 0) {
          this.codelist = codelist;
          this.setState({selectedProduct: result.product});
          Alert.alert(
            '有未提交的数据',
            '有' + keys.length + '条未提交的瓶码关联数据，是否现在提交？',
            [
              { text: '取消', onPress: () => {} },
              { text: '提交', onPress: () => this.associate() }
            ]
          );
        } else {
          this.showProductList(1);
        }
      } else {
        this.showProductList(1);
      }
    }).catch(error => {

    });

  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

    this.unmount = true;

    global.EventEmitter.removeListener("bar-code-read", this.onBarCodeRead);
  }

  onFocus() {
    global.EventEmitter.removeAllListeners(["bar-code-read"]);
    global.EventEmitter.addListener("bar-code-read", this.onBarCodeRead);
  }

  onBlur() {
    global.EventEmitter.removeListener("bar-code-read", this.onBarCodeRead);
  }

  testData() {
    let code = 99999999 - parseInt(Math.random() * 10000000);
    if (this.state.currentFocus == 'neima')
      this.onBarCodeRead({code: '' + code});
    else
      this.onBarCodeRead({code: '10' + code});

  }

  /**
   * on barcode read
   */
  onBarCodeRead(data) {
    console.log('on bar code read');
    if (this.unmount)
      return;

    let code = data.code.trim();
    code = Tools.getCode(code, this.state.selectedSegment == 1 ? false:true);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    // un-associate mode
    if (this.state.selectedSegment == 1) {
      this.setState({modalHideMode:false, unAssociateCode: code});

      this.queryAssociate(code);
      return;
    }

    // check current focus field & check code rules
    // neima (inner code)
    if (this.state.currentFocus == 'neima') {
      if (!User.checkRule('innercode', code)) {
        Tools.alert('瓶码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }

      let currentCode = this.state.currentCode;
      currentCode.neima = code;
      this.setState({currentFocus:'waima', currentCode});
    }
    // waima (outer code)
    else if (this.state.currentFocus == 'waima') {
      if (!User.checkRule('bottle', code)) {
        Tools.alert('盒码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }

      let currentCode = this.state.currentCode;
      currentCode.waima = code;
      this.codelist[currentCode.neima] = code;
      this.setState({currentFocus:'neima', currentCode});

      // save code list into AsyncStorage
      Config.setItem("bottle-codes", {product: this.state.selectedProduct, codelist: this.codelist});
      setTimeout(() => {
        this.setState({currentCode:{neima:'', waima:''}});
      }, 300);
    }
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
   * associate offline
   */
  associateOffline() {
    if (this.isPosting)
      return;

    // check data
    if (!this.state.selectedProduct || !this.state.selectedProduct.product_name) {
      Tools.alert("请选择商品");
      return;
    }

    if (Object.keys(this.codelist).length == 0) {
      Tools.alert("没有要提交的数据");
      return;
    }

    this.isPosting = true;
    this.setState({isLoading:true});

    // create bottle log
    let bottleLog = new BottleLog();
    bottleLog.setData({
      product: this.state.selectedProduct.product_name,
      product_id: this.state.selectedProduct.product_id,
      nums: Object.keys(this.codelist).length,
      create_at: new Date().getTime()
    });
    bottleLog.save().then( result => {
      if (!result) {
        this.isPosting = false;
        this.setState({isLoading: false});
        Tools.alert('保存出错了');
        return;
      }

      // save codes into bottles
      let logId = bottleLog.data.id;
      let keys = Object.keys(this.codelist);
      keys.map( (neima) => {
        let waima = this.codelist[neima];
        let bottle = new BottleModel();
        bottle.setData({
          log_id: logId,
          bottle_code: neima,
          case_code: waima,
          create_at: new Date().getTime()
        });
        bottle.save();
      });

      this.isPosting = false;
      this.codelist = {};
      this.setState({isLoading: false});
      Tools.alert('离线保存成功', '待提交瓶数：' + keys.length);
      Config.setItem("bottle-codes", {
        product: this.state.selectedProduct, 
        codelist: this.codelist
      });
      this.refs.offlineList && this.refs.offlineList.getOfflineLogs();
    });
  }

  // associate
  associate() {
    if (this.isPosting)
      return;

    // check data
    /*if (!this.state.selectedProduct || !this.state.selectedProduct.product_id) {
      Tools.alert("请选择商品");
      return;
    }*/

    if (Object.keys(this.codelist).length == 0) {
      Tools.alert("没有要提交的数据");
      return;
    }

    this.isPosting = true;
    this.setState({isLoading:true});

    let productId = this.state.selectedProduct && this.state.selectedProduct.product_id;
    Tools.post({
      url: Constants.api.associateBottle,
      data: {productid: productId || 0, codelist: this.codelist},
      success: (data) => {
        //this.submits += Object.keys(this.codelist).length;
        this.submits += data.successcount;
        this.codelist = {};
        this.setState({isLoading:false});
        Tools.alert('关联完成', '关联成功：'+data.successcount+'，关联失败：'+data.failedcount);

        Config.setItem("bottle-codes", {product: this.state.selectedProduct, codelist: this.codelist});
        this.isPosting = false;
      },
      error: (data) => {
        this.setState({isLoading:false});
        this.isPosting = false;
      }
    });
  }

  /**
   * 关联查询
   */
  queryAssociate(code) {
    if (!code) {
      Tools.alert("提示信息", "请扫描瓶码/盒码");
      return;
    }

    // remove code from codelist
    /*let newList = {};
    let keys = Object.keys(this.codelist);
    if (keys.length > 0) {
      for (let i = 0; i < keys.length; i++) {
        if (this.state.unAssociateCode == keys[i] || this.state.unAssociateCode == this.codelist[keys[i]])
          continue;
        newList[keys[i]] = this.codelist[keys[i]];
      }
      this.codelist = newList;
      Config.setItem("bottle-codes", {product: this.state.selectedProduct, codelist: this.codelist});
    }*/

    this.setState({isAssociated:false, associateItems: [], isLoading:true});

    Tools.post({
      url: Constants.api.getBottleInOrgItem,
      data: {Code: '' + code},
      success: (data) => {
        if (data.IsUnion)
          this.setState({ isAssociated:true, associateItems: [data], isLoading:false });
        else
          this.setState({ isAssociated: false, isLoading: false });
      },
      error: (data) => {
        this.setState({ isLoading: false });
      }
    });
    /*Tools.post({
      url: Constants.api.unAssociateBottle,
      data: {code: '' + this.state.unAssociateCode},
      success: (data) => {
        Tools.alert('该瓶码解除关联成功');
        this.setState({isLoading:false, unAssociateCode:''});
      },
      error: (data) => {
        this.setState({isLoading:false});
      }
    });*/

  }

  /**
   * 解除关联
   */
  unAssociate() {
    if (!this.state.unAssociateCode) {
      Tools.alert("提示信息", "请扫描瓶码/盒码");
      return;
    }

    Alert.alert(
      '是否要解除瓶盒关联？',
      '',
      [
        {text: '解除', onPress: () => this.doUnAssociate()},
        {text: '取消'}
      ]
    );
  }

  /**
   * 确定解除
   */
  doUnAssociate() {
    // remove code from codelist
    let newList = {};
    let keys = Object.keys(this.codelist);
    if (keys.length > 0) {
      for (let i = 0; i < keys.length; i++) {
        if (this.state.unAssociateCode == keys[i] || this.state.unAssociateCode == this.codelist[keys[i]])
          continue;
        newList[keys[i]] = this.codelist[keys[i]];
      }
      this.codelist = newList;
      Config.setItem("bottle-codes", {product: this.state.selectedProduct, codelist: this.codelist});
    }

    this.setState({isLoading:true});

    Tools.post({
      url: Constants.api.unAssociateBottle,
      data: {code: '' + Tools.getCode(this.state.unAssociateCode)},
      success: (data) => {
        Tools.alert('该瓶码解除关联成功');
        this.setState({isLoading:false, unAssociateCode:'', isAssociated: null, associateItems:[]});
      },
      error: (data) => {
        this.setState({isLoading:false});
      }
    });

  }

  /**
   * clear un-submit codelist
   */
  clear() {
    let unsubmits = Object.keys(this.codelist).length;
    this.setState({currentFocus: 'neima', currentCode:{neima:'', waima:''}});
    if (unsubmits > 0) {
      Alert.alert(
        '清除确认',
        '你确认要清除未提交的 '+unsubmits+" 条数据吗？",
        [
          {text: '取消', onPress: () => {} },
          {text: '确定', onPress: () => {
            this.codelist = {};
            this.setState({idx: this.state.idx+1});
            Config.setItem("bottle-codes", {});
          } }
        ]
      );
    }
  }

  /**
   * show un-associate modal
   */
  showUnAssociate() {
    this.setState({modalVisible2: true});
  }

  /**
   * set modal style (for qr camera display to fix modal cover camera view issue)
   */
  setModalStyle(status) {
    if (status == 'hide') {
      this.setState({modalHideMode:true})
    } else {
      this.setState({modalHideMode:false})
    }
  }

  /**
   * render segment 0: associate
   */
  renderAssociate() {
    let selectedProduct = this.state.selectedProduct;

    let unsubmits = Object.keys(this.codelist).length;
    let submits = this.submits;

    return (
      <View>
        <Product parent={this} selectedProduct={this.state.selectedProduct}/>
        <View style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd'}]}>
          <Text style={styles.rowText}>累计关联瓶数      {submits}</Text>
        </View>
        <View style={{marginTop:13, borderTopWidth:1, borderTopColor:'#ddd'}}>
          <View style={[styles.row, {paddingVertical:6}]}>
            <Text style={styles.rowText}>瓶码</Text>
            <QRCodeText style={[styles.textInput, this.state.currentFocus == 'neima' ? styles.textInputFocus:null, {width: Screen.width-90}]} parent={this}>
              {Tools.parseCode(this.state.currentCode.neima)}
            </QRCodeText>
          </View>
          <View style={[styles.row, {paddingVertical:6}]}>
            <Text style={styles.rowText}>盒码</Text>
            <QRCodeText style={[styles.textInput, this.state.currentFocus == 'waima' ? styles.textInputFocus:null, {width: Screen.width-90}]} parent={this}>
              {Tools.parseCode(this.state.currentCode.waima)}
            </QRCodeText>
          </View>
          <View style={styles.row2}>
            <View style={[styles.row, {borderBottomWidth:0, justifyContent:'space-between', paddingVertical:0, paddingTop:0}]}>
              <Text style={styles.rowText}>待提交瓶数       <Text style={{color: '#ff0000'}}>{unsubmits}</Text></Text>
              <Button title="清除" onPress={() => this.clear()} style={{width:60, backgroundColor:'#fff', paddingVertical:3}} fontStyle={{color: Constants.color.blue, fontSize:12, fontWeight:'400'}}/>
            </View>
            <View style={{alignItems:'flex-end', paddingRight:20, marginBottom:6}}><Text style={{fontSize:11, color:'#666'}}>清除目前所有的待提交数据</Text></View>
          </View>
        </View>

        {/*<TouchableOpacity onPress={() => this.showUnAssociate()} style={[styles.row, {marginLeft:150}]}>
          <Icons.Ionicons name='ios-radio-button-off-outline' size={20} style={{marginRight:10}}/>
          <Text>解除关联</Text>
        </TouchableOpacity>*/}
        <View style={{marginTop:12, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          { User.offline ? 
            <Button title="离线保存" onPress={() => this.associateOffline()} style={{width:110}}/>
            :
            <Button title="提交" onPress={() => this.associate()} style={{width:110}}/>
          }
          <Button title="返回" onPress={() => this.navigator.pop()} style={{width:110, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
        </View>

        {this.renderOfflineList()}
      </View>
    )
  }

  /**
   * render segment 1: unAssociate
   */
  renderUnAssociate() {
    return (
      <View>
        <View style={{borderTopWidth:1, borderTopColor:'#ddd'}}>
          <View style={[styles.row, {paddingVertical:8}]}>
            <Text style={styles.rowText}>盒码/瓶码</Text>
            <QRCodeText style={[styles.textInput, this.state.selectedSegment == 1 ? styles.textInputFocus:null, {width: Screen.width-125}]} parent={this}>
              {Tools.parseCode(this.state.unAssociateCode)}
            </QRCodeText>
          </View>
        </View>
        {
          this.state.isAssociated != null ? 
          <View>
            <View style={[styles.row, {paddingVertical:16}]}>
              <Text style={styles.rowText}>查询结果</Text>
              <Text style={styles.rowQueryText}>{ this.state.isAssociated ? '该码已做瓶盒关联':'该码未做瓶盒关联' }</Text>
            </View>
          </View>
          : null
        }

        {
          this.state.isAssociated === true ?
          <View style={{marginTop:20, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            <Button title="解除关联" onPress={() => this.unAssociate()} style={{width:Screen.width-40}}/>
          </View>
          :null
        }

        {this.renderAssociateItems()}
      </View>
    )
  }

  /**
   * render associated items
   */
  renderAssociateItems() {
    if (!this.state.associateItems || this.state.associateItems.length == 0)
      return;

    let views = this.state.associateItems.map( (item, key) => {
      let keys = Object.keys(item.ResultCodes);
      let bottleCode = keys[0];
      let packCode = item.ResultCodes[bottleCode];
      return (
        <View style={styles.associateItemsBox} key={"item" + key}>
          <Text style={styles.associateItemSubject}>
            {item.ProductName}
          </Text>
          <View style={styles.associateItemCodeBox}>
            <Image source={{uri: AssociateIcon.image}} style={{width: 18, height:18, tintColor:"lightgrey"}}/>
            <Text style={styles.associateItemCodeText}>关联瓶码 {Tools.getCode(bottleCode)}</Text>
          </View>
          <View style={styles.associateItemCodeBox}>
            <Image source={{uri: AssociateIcon.image}} style={{width: 18, height:18, tintColor:"lightgrey"}}/>
            <Text style={styles.associateItemCodeText}>关联盒码 {Tools.getCode(packCode)}</Text>
          </View>
        </View>
      );
    });

    return (
      <View style={styles.associateItemsContainer}>
        {views}
      </View>
    )
  }

  /**
   * render main body based on selected segment
   */
  renderSegmentBody() {
    switch (this.state.selectedSegment) {
      case 1:
        return this.renderUnAssociate();
      case 2:
        return this.renderOfflineList('segment');
      default:
        return this.renderAssociate();
    }

  }

  /**
   * render offline list
   */
  renderOfflineList(from) {
    return (<BottleOfflineList ref="offlineList" from={from}/>);
  }

  /**
   * switch segment
   */
  switchSegment(idx) {
    if (idx == 1) {
      /*setTimeout( () => {
        this.onBarCodeRead({code: 'http://test.zhongjiuyun.com/441806327487'});
      }, 2000);*/
    } else {
      this.setState({associateItems: [], isAssociated:null, unAssociateCode:''});
    }

    this.setState({selectedSegment: idx});
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
        <View style={styles.segmentBox}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({selectedSegment:0})} style={[styles.segmentItem, this.state.selectedSegment == 0 ? styles.segmentItemActive:null]}>
            <Text style={[styles.segmentText, this.state.selectedSegment == 0 ? styles.segmentTextActive:null]}>瓶盒关联</Text>
          </TouchableOpacity>
          { User.offline ?
            <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({selectedSegment:2})} style={[styles.segmentItem, this.state.selectedSegment == 2 ? styles.segmentItemActive:null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 2 ? styles.segmentTextActive:null]}>待提交关联</Text>
            </TouchableOpacity>
            :
            <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(1)} style={[styles.segmentItem, this.state.selectedSegment == 1 ? styles.segmentItemActive:null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 1 ? styles.segmentTextActive:null]}>查询关联</Text>
            </TouchableOpacity>
          }
        </View>

        {this.renderSegmentBody()}

        <View style={{paddingBottom:30}}/>
      </ScrollView>
    )
  }
}
