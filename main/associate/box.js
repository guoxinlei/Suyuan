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

import {User, BoxLog, Box as BoxModel} from 'models';
// product list
import Product from '../products';
// offline log list
import BoxOfflineList from './box-offline-list';
// icons
import { Associate as AssociateIcon } from 'images';

export default class Box extends Base {
  constructor(props) {
    super(props, {
      modalVisible: false,
      modalVisible2: false,
      modalVisible3: false,
      modalVisible4: false,
      products: [],
      selectedProduct: null,
      scanedBottles: 0,
      currentCode: [],
      unAssociateCode:'',
      boxCode:'',
      txtBottlesPerBox:'',
      modalHideMode:false,
      selectedSegment: 0,
      isAssociated: null,
      associateItems: null,
      addSubstractCode: null,
      addSubstractType: null
    });

    this.navItems = {
      rightItem: {},
      title: {
        text: '组箱'
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
    Config.getItem('box-codes').then(result => {
      let codelist = result.codelist;
      if (codelist) {
        let keys = Object.keys(codelist);

        if (keys.length > 0) {
          this.codelist = codelist;
          this.setState({selectedProduct: result.product});
          Alert.alert(
            '有未提交的数据',
            '有' + keys.length + '条未提交的盒码关联数据，是否现在提交？',
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

  /**
   * on barcode read
   */
  onBarCodeRead(data) {
    if (this.unmount || this.showingModal)
      return;

    // check product
    if (this.state.selectedSegment != 1 && !this.state.modalVisible3 && !this.state.modalVisible4) {
      /*if (!this.state.selectedProduct) {
        Tools.alert('请先选择商品');
        Vibration.vibrate();
        return;
      }*/

      // check bottles per box
      if (!this.state.txtBottlesPerBox) {
        Tools.alert('请设置每箱瓶数');
        Vibration.vibrate();
        return;
      }
    }

    let code = data.code.trim();
    code = Tools.getCode(code, this.state.selectedSegment == 1 ? false:true);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    // add or substract
    if (this.state.modalVisible4) {
      global.EventEmitter.emit("box-add-substract-barcode", {code});
      return;
    }
    // un-associate mode
    else if (this.state.selectedSegment == 1) {
      // check code
      if (!User.checkRule('bottle', Tools.getCode(code))) {
        Tools.alert('盒码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
      this.setState({modalHideMode:false, unAssociateCode: code});
      this.queryAssociate(code);
      return;
    }

    // box code scan
    if (this.state.modalVisible3) {
      // check code
      if (!User.checkRule('box', code)) {
        Tools.alert('箱码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
      this.setState({modalHideMode:false, boxCode: code});
      setTimeout(() => {
        this.setBoxCode();
      }, 200);
      return;
    }

    // check current focus field & check code rules
    if (!User.checkRule('bottle', code)) {
      Tools.alert('盒码错误', '请重新扫描');
      Vibration.vibrate();
      return;
    }

    let currentCode = this.state.currentCode;
    let found = false;
    for (let i = 0; i < currentCode.length; i++) {
      if (currentCode[i] == code) {
        found = true;
        break;
      }
    }
    if (!found) {
      currentCode.push(code);
      this.setState({currentCode: currentCode});
    }

    // reach the number of bottles per box
    if (currentCode.length + '' == this.state.txtBottlesPerBox) {
      // display box code interface
      this.showingModal = true;
      setTimeout( () => {
        this.setState({modalVisible3: true, modalHideMode:false});
        this.showingModal = false;
      }, 1000);
      return;
    }

    // save code list into AsyncStorage
    //Config.setItem("box-codes", {product: this.state.selectedProduct, codelist: this.codelist});
    //setTimeout(() => {
    //  this.setState({currentCode:''});
    //}, 300);
  }

  testData(type) {
    let code = 99999999 - parseInt(Math.random() * 10000000);
    this.onBarCodeRead({code: (type == 'box' ? '20':'10') + code});

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

    // check current scan bottle number
    if (this.state.currentCode.length > 0) {
      if (this.state.currentCode.length+'' == this.state.txtBottlesPerBox) {
        this.setState({modalVisible3:true});
        return;
      } else {
        Tools.alert("您有未完成的箱码");
        return;
      }
    }

    if (Object.keys(this.codelist).length == 0) {
      Tools.alert("没有要提交的数据");
      return;
    }

    this.isPosting = true;
    this.setState({isLoading:true});

    // create box log
    let boxLog = new BoxLog();
    boxLog.setData({
      product: this.state.selectedProduct.product_name,
      product_id: this.state.selectedProduct.product_id,
      nums: Object.keys(this.codelist).length,
      create_at: new Date().getTime()
    });
    boxLog.save().then( result => {
      if (!result) {
        this.isPosting = false;
        this.setState({isLoading: false});
        Tools.alert('保存出错了');
        return;
      }

      // save codes into boxes
      let logId = boxLog.data.id;
      let keys = Object.keys(this.codelist);
      keys.map( (boxCode) => {
        let codes = this.codelist[boxCode];
        let box = new BoxModel();
        box.setData({
          log_id: logId,
          box_code: boxCode,
          case_code: codes,
          create_at: new Date().getTime()
        });
        box.save();
      });

      this.isPosting = false;
      this.codelist = {};
      this.setState({isLoading: false});
      Tools.alert('离线保存成功', '待提交箱数：' + keys.length);
      Config.setItem("box-codes", {});
      this.refs.offlineList && this.refs.offlineList.getOfflineLogs();
    }).catch( error => {
      Tools.alert('保存失败了', '请重试');
      this.setState({isLoading: false});
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

    // check current scan bottle number
    if (this.state.currentCode.length > 0) {
      if (this.state.currentCode.length+'' == this.state.txtBottlesPerBox) {
        this.showingModal = true;
        setTimeout( () => {
          this.setState({modalVisible3: true});
          this.showingModal = false;
        }, 1000);
        return;
      } else {
        Tools.alert("您有未完成的箱码");
        return;
      }
    }

    if (Object.keys(this.codelist).length == 0) {
      Tools.alert("没有要提交的数据");
      return;
    }

    this.isPosting = true;
    this.setState({isLoading:true});

    let productId = this.state.selectedProduct && this.state.selectedProduct.product_id;
    Tools.post({
      url: Constants.api.associateBox,
      data: {productid: productId || 0, boxcodes: this.codelist},
      success: (data) => {
        //this.submits += Object.keys(this.codelist).length;
        this.submits += data.successcount;
        this.codelist = {};
        this.setState({isLoading:false});
        Tools.alert('关联完成', '关联成功：'+data.successcount+'，关联失败：'+data.failedcount);
        Config.setItem("box-codes", {})
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
      Tools.alert("提示信息", "请扫描盒码");
      return;
    }

    this.setState({isAssociated:false, associateItems: null, isLoading:true});

    Tools.post({
      url: Constants.api.getItemsInBox,
      data: {Code: '' + Tools.getCode(code)},
      success: (data) => {
        console.log(data);
        if (data.IsUnion)
          this.setState({ isAssociated:true, associateItems: data, isLoading:false });
        else
          this.setState({ isAssociated: false, isLoading: false });
      },
      error: (data) => {
        this.setState({ isLoading: false });
      }
    });

  }

  /**
   * 解除关联
   */
  unAssociate() {
    if (!this.state.unAssociateCode) {
      Tools.alert("提示信息", "请扫描要解除关联的盒码");
      return;
    }

    Alert.alert(
      '是否要解除该箱的箱盒关联？',
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
        if ( this.codelist[keys[i]].indexOf(this.state.unAssociateCode) >= 0)
          continue;
        newList[keys[i]] = this.codelist[keys[i]];
      }
      this.codelist = newList;
      Config.setItem("box-codes", {product: this.state.selectedProduct, codelist: this.codelist});
    }

    let item = this.state.associateItems;
    let itemKeys = Object.keys(item.ResultCodes);
    let boxCode = itemKeys[0];

    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.unAssociateBox,
      data: {
        BoxCode: ''+boxCode,
        OriginItemCode: '' + this.state.unAssociateCode
      },
      success: (data) => {
        Tools.alert('该盒码解除关联成功');
        this.setState({isLoading:false, unAssociateCode:''});
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
    this.setState({currentCode:[]});
    if (unsubmits > 0) {
      Alert.alert(
        '清除确认',
        '你确认要清除未提交的 '+unsubmits+" 条数据吗？",
        [
          {text: '取消', onPress: () => {} },
          {text: '确定', onPress: () => {
            this.codelist = {};
            this.setState({idx: this.state.idx+1});
            Config.setItem("box-codes", {product: this.state.selectedProduct, codelist: {}});
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
   * set box code
   */
  setBoxCode() {
    let boxCode = this.state.boxCode;
    let currentCode = this.state.currentCode;
    this.codelist[boxCode] = currentCode.join(",");

    this.setState({boxCode:'', currentCode:[], modalVisible3:false});
    Config.setItem("box-codes", {product: this.state.selectedProduct, codelist: this.codelist});
  }

  /**
   * set modal style (for qr camera display to fix modal cover camera view issue)
   */
  setModalStyle(status) {
    if (status == 'hide') {
      this.setState({modalHideMode:true});
    } else {
      this.setState({modalHideMode:false});
    }
  }

  /**
   * set bottles per box
   */
  setBottlesPerBox(newAmount) {
    if (newAmount && (!Tools.isNumber(newAmount) || newAmount < 1) ) {
      Tools.alert("提示信息", "请输入正确的数量");
      this.setState({ txtBottlesPerBox: "" + this.state.txtBottlesPerBox });
      return;
    }

    this.setState({txtBottlesPerBox:newAmount})
  }

  /**
   * render segment 0: associate
   */
  renderAssociate() {
    let selectedProduct = this.state.selectedProduct;

    let unsubmits = Object.keys(this.codelist).length;
    let submits = this.submits;

    let currentCode = this.state.currentCode;
    if (currentCode.length > 0) {
      currentCode = currentCode[currentCode.length-1];
    } else {
      currentCode = '';
    }

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView>
          <Product parent={this} selectedProduct={this.state.selectedProduct} from="box"/>
          <View style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd'}]}>
            <Text style={styles.rowText}>累计关联箱数      {submits}</Text>
          </View>
          <View style={{marginTop:13, borderTopWidth:1, borderTopColor:'#ddd'}}>
            <View style={[styles.row, {paddingVertical:8}]}>
              <Text style={styles.rowText}>请设定每箱 </Text>
              <View style={[styles.textInput, {paddingTop:5, marginLeft:0, paddingLeft:Constants.isAndroid ? 2:5}]}>
                <TextInput
                  style={{height: 35, marginTop: Constants.isAndroid ? -6:-8, fontSize: 12}}
                  underlineColorAndroid='transparent'
                  onChangeText={(text) => this.setBottlesPerBox(text)}
                  value={this.state.txtBottlesPerBox}
                  keyboardType='numeric'
                />
              </View>
              <Text style={styles.rowText}> 盒</Text>
              <View style={{alignItems:'flex-end', width: Screen.width-190}}>
                <Text style={styles.rowText}>当前已扫<Text style={{color: '#ff0000'}}>{this.state.currentCode.length}</Text>盒</Text>
              </View>
            </View>
            <View style={[styles.row, {paddingVertical:8}]}>
              <Text style={styles.rowText}>盒码</Text>
              <QRCodeText style={[styles.textInput, styles.textInputFocus, {width: Screen.width-90}]} parent={this}>
                {Tools.parseCode(currentCode)}
              </QRCodeText>
            </View>
            <View style={styles.row2}>
              <View style={[styles.row, {borderBottomWidth:0, justifyContent:'space-between', paddingVertical:0, paddingTop:0}]}>
                <Text style={styles.rowText}>待提交箱数       <Text style={{color: '#ff0000'}}>{unsubmits}</Text></Text>
                <Button title="清除" onPress={() => this.clear()} style={{width:60, backgroundColor:'#fff', paddingVertical:3}} fontStyle={{color: Constants.color.blue, fontSize:12, fontWeight:'400'}}/>
              </View>
              <View style={{alignItems:'flex-end', paddingRight:20, marginBottom:6}}><Text style={{fontSize:11, color:'#666'}}>清除目前所有的待提交数据</Text></View>
            </View>
          </View>

          <View style={{marginTop:12, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            {User.offline ?
              <Button title="离线保存" onPress={() => this.associateOffline()} style={{ width: 110 }} />
              :
              <Button title="提交" onPress={() => this.associate()} style={{ width: 110 }} />
            }
            <Button title="返回" onPress={() => this.navigator.pop()} style={{ width: 110, backgroundColor: '#fff' }} fontStyle={{ color: Constants.color.blue }} />
          </View>

          {this.renderOfflineList()}

        </ScrollView>
      </TouchableWithoutFeedback>
    )
  }

  /**
   * render segment 1: unAssociate
   */
  renderUnAssociate() {
    let item = this.state.associateItems;
    return (
      <View>
        <View style={{borderTopWidth:1, borderTopColor:'#ddd'}}>
          <View style={[styles.row, {paddingVertical:8}]}>
            <Text style={styles.rowText}>盒码</Text>
            <QRCodeText style={[styles.textInput, this.state.selectedSegment == 1 ? styles.textInputFocus:null, {width: Screen.width-90}]} parent={this}>
              {Tools.parseCode(this.state.unAssociateCode)}
            </QRCodeText>
          </View>
        </View>
        {
          this.state.isAssociated != null ? 
          <View>
            <View style={[styles.row, {paddingVertical:8*Constants.scaleRate}]}>
              <Text style={styles.rowText}>查询结果</Text>
              <View style={{width: Screen.width-80}}>
                <Text style={styles.rowQueryText}>
                  { 
                    this.state.isAssociated ? 
                    '该盒码已做盒箱关联，是第'+item.SequenceNo+'盒，共'+item.TotalCount+'盒'
                    :
                    '该盒码未做盒箱关联' 
                  }
                </Text>
              </View>
            </View>
          </View>
          : null
        }

        {
          this.state.isAssociated === true ?
          <View>
            <View style={styles.buttonBox}>
              <Button title="箱加盒" onPress={() => this.showAddSubstract('add')} style={{ width: (Screen.width-60)/2, backgroundColor: '#fff' }} fontStyle={{ color: Constants.color.blue }} icon="md-add-circle"/>
              <Button title="箱减盒" onPress={() => this.showAddSubstract('substract')} style={{ width: (Screen.width-60)/2, backgroundColor: '#fff' }} fontStyle={{ color: Constants.color.blue }} icon="md-remove-circle"/>
            </View>
            <View style={{marginTop:0, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
              <Button title="解除关联" onPress={() => this.unAssociate()} style={{width:Screen.width-40}}/>
            </View>
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
    if (!this.state.associateItems)
      return;

    let item = this.state.associateItems;

    let keys = Object.keys(item.ResultCodes);
    let boxCode = keys[0];
    let packCode = item.ResultCodes[boxCode];
    return (
      <View style={styles.associateItemsContainer}>
        <View style={styles.associateItemsBox}>
          <Text style={styles.associateItemSubject}>
            {item.ProductName}
          </Text>
          <View style={styles.associateItemCodeBox}>
            <Image source={{uri: AssociateIcon.image}} style={{width: 18, height:18, tintColor:"lightgrey"}}/>
            <Text style={styles.associateItemCodeText}>关联箱码 {Tools.getCode(boxCode)}</Text>
          </View>
          <View style={styles.associateItemCodeBox}>
            <Image source={{uri: AssociateIcon.image}} style={{width: 18, height:18, tintColor:"lightgrey"}}/>
            <Text style={styles.associateItemCodeText}>关联盒码 {Tools.getCode(packCode)}</Text>
          </View>
        </View>
      </View>
    );

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
    return (<BoxOfflineList ref="offlineList" from={from}/>);
  }

  /**
   * show add or substract modal
   */
  showAddSubstract(type) {
    this.setState({modalVisible4: true, addSubstractType: type});
    /*setTimeout( () => {
      this.onBarCodeRead({code: 'http://test.zhongjiuyun.com/Product/OriginDetail?code=10232240718256042690'});
    }, 2000);*/
  }

  /**
   * hide add or substract modal
   */
  hideAddSubstract(type) {
    this.setState({modalVisible4: false});
  }

  /**
   * switch segment
   */
  switchSegment(idx) {
    if (idx == 1) {
      /*setTimeout( () => {
        this.onBarCodeRead({code: '10563230314226961370'});
      }, 2000);*/
    } else {
      this.setState({associateItems: null, isAssociated:null, unAssociateCode: ''});
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
      <View style={styles.container}>
        <View style={styles.segmentBox}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(0)} style={[styles.segmentItem, this.state.selectedSegment == 0 ? styles.segmentItemActive:null]}>
            <Text style={[styles.segmentText, this.state.selectedSegment == 0 ? styles.segmentTextActive:null]}>组箱关联</Text>
          </TouchableOpacity>
          { User.offline ?
            <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(2)} style={[styles.segmentItem, this.state.selectedSegment == 2 ? styles.segmentItemActive:null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 2 ? styles.segmentTextActive:null]}>待提交关联</Text>
            </TouchableOpacity>
            :
            <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(1)} style={[styles.segmentItem, this.state.selectedSegment == 1 ? styles.segmentItemActive : null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 1 ? styles.segmentTextActive : null]}>查询关联</Text>
            </TouchableOpacity>
          }
        </View>

        {this.renderSegmentBody()}

        {
          this.state.modalVisible3 ?
          <View style={styles.mask}>
            <View style={styles.maskContent}>
              <Text style={styles.maskText}>箱码</Text>
              <QRCodeText style={[styles.textInput, {width: Screen.width - 100, marginLeft:0}]} parent={this}>
                {Tools.parseCode(this.state.boxCode)}
              </QRCodeText>
            </View>
          </View>
          : null
        }

        {
          this.state.modalVisible4 ?
          <AddSubstract 
            item={this.state.associateItems}
            code={this.state.addSubstractCode} 
            type={this.state.addSubstractType} 
            parent={this}
          />
          : null
        }

      </View>
    )
  }

}

/**
 * add or substract component
 */
class AddSubstract extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      code: '',
      message: ''
    }

    this.actionType = this.props.type == 'add' ? '加':'减';
    this.onBarCodeRead = this.onBarCodeRead.bind(this);
  }

  componentDidMount() {
    global.EventEmitter.addListener("box-add-substract-barcode", this.onBarCodeRead);
  }

  componentWillUnmount() {
    global.EventEmitter.removeListener("box-add-substract-barcode", this.onBarCodeRead);
  }

  onBarCodeRead(data) {
    let code = data.code;
    this.setState({code: code});

    let item = this.props.item;
    if (!item || !item.ResultCodes) {
      Tools.alert('没有查询到箱码');
      return;
    }

    let codes = {};
    let keys = Object.keys(item.ResultCodes);
    let boxCode = keys[0];
    codes[boxCode] = ''+code;

    Tools.post({
      url: this.props.type == 'add' ? Constants.api.boxAddOrgItem:Constants.api.boxRemoveOrgItem,
      data: {ProductId: item.ProductId, BoxCodes: codes },
      alertOnError: false,
      success: (data) => {
        //console.log(data);
        this.setState({message: '箱'+this.actionType+'盒完成，可以继续扫码操作', code: ''});
        setTimeout( () => {
          this.setState({message: ''});
        }, 1500);
      },
      error: (data) => {
        console.log(data);
        this.setState({message: '失败，'+( (data && data.descr) || '箱'+this.actionType+'盒失败了'), code: ''});
      }
    });
  }

  render() {
    return (
      <View style={styles.mask}>
        <View style={styles.maskContent}>
          <View style={styles.maskRow}>
            <Text style={styles.maskText}>盒码</Text>
            <QRCodeText style={[styles.textInput, {width: Screen.width - 140, marginLeft:10, marginTop:-3}]} parent={this}>
              {Tools.getCode(this.state.code)}
            </QRCodeText>
          </View>
          {
            this.state.message ? 
            <View style={styles.maskInfo}>
              <Text style={styles.maskInfoText}>{this.state.message}</Text>
            </View>
            :null
          }
          <View style={{marginTop:0, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            <Button title="返回" onPress={() => this.props.parent.hideAddSubstract()} style={{width:Screen.width-90}}/>
          </View>
        </View>
      </View>
    );
  }
}
