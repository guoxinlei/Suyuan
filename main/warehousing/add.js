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
  FormContainer,
  Keyboard,

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config,
  Touchable
} from 'components';

import {User, Warehousing, WarehousingProduct, WarehousingCache} from 'models';
// product list
import Product from '../products';

export default class AddNewForm extends Base {
  constructor(props) {
    super(props, {
      formNoCode:'',
      products: [{ idx:-1, product:{} }],
      receiver: {},
      keyboardHeight: 0,
      marginTop: 0,
      productionLine: null,
      productionBatch: '',
      isLoading: false
    });

    this.formTypeName = this.getFormTypeName();
    this.navItems = {
      rightItem: {},
      title: {
        text: (this.props.warehousing ? '编辑':'新增')+this.formTypeName+'单'
      }
    }
    this.productsIdx = 0;
    this.textInputs = {};

    this.onBarCodeRead = this.onBarCodeRead.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    // set keyboard event
    if (Platform.OS == 'ios') {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange.bind(this)),
      ];
    } else {
      this.subscriptions = [
        Keyboard.addListener('keyboardDidHide', this.onKeyboardChange.bind(this)),
        Keyboard.addListener('keyboardDidShow', this.onKeyboardChange.bind(this)),
      ];
    }

    // 设置商品信息
    this.initializeProducts();

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
   * 获得单号类别
   */
  getFormTypeName() {
    let formName = '';
    switch (this.props.formtype) {
      case 1:
        formName = '入库';
        break;
      case 2:
        formName = '出库';
        break;
      case 3:
        formName = "生产入库";
        break;
    }

    return formName;
  }

  /**
   * 设置商品信息
   */
  initializeProducts() {
    // 编辑模式
    if (this.props.products) {
      let products = [];
      this.props.products.map( (product, key) => {
        products.push({
          idx: key,
          product: {
            product_id: product.product_id,
            product_name: product.product,
            plancount: product.box_nums
          }
        });
      });

      // append empty product
      products.push({idx: products.length, product:{} });

      // receiver
      let receiver = {id: this.props.warehousing.data.receiver_id, name: this.props.warehousing.data.receiver_name};
      this.setState({products, receiver});
    } 
    // 新增模式
    else {
      this.setState({products: [{idx:0, product: {} }]});
    }
  }

  /**
   * keyboard event
   * @param {*} event 
   */
  onKeyboardChange(event) {
    if (!event) {
      this.setState({txtFocus:false, keyboardHeight:0, marginTop:0});
      return;
    }

    if (event && event.endCoordinates) {
      if (event.endCoordinates.screenY) {
        let height = Screen.height - event.endCoordinates.screenY;
        this.setState({keyboardHeight: height});
        if (height == 0)
          this.setState({marginTop:0});
      } else {
        this.setState({keyboardHeight: event.endCoordinates.height});
      }

      if (Platform.OS == 'android')
        this.setState({txtFocus: true});
    } 
  }

  /**
   * hide keyboard
   */
  hideKeyboard() {
    Keyboard.dismiss();
    setTimeout( () => {
      this.setState({keyboardHeight:0, marginTop:0});
    }, 300);
  }

  /**
   * textinput focus: calculate keyboard's height & append padding at bottom
   */
  onTextFocus(offsetHeight) {
    let maxOffset = Screen.height - this.state.keyboardHeight;
    if (offsetHeight >= maxOffset) {
      this.setState({marginTop: offsetHeight-maxOffset+10});
    }
  }

  /**
   * on barcode read
   */
  onBarCodeRead(data) {
    if (this.unmount)
      return;

    let code = data.code.trim();

    this.setState({formNoCode: code});
  }

  /**
   * get form info
   */
  getFormInfo() {
    Tools.post({
      url: Constants.api.getFormInfo,
      data: {formno: this.state.formNoCode, formtype: this.props.formtype},
      alertOnError: false,
      success: (data) => {

      },
      error: (data) => {

      }
    });
  }

  /**
   * add new form
   */
  addNewForm() {
    this.navigator.push('addNewForm', {formtype: this.props.formtype});
  }

  /**
   * show product list
   */
  showProductList(idx) {
    this.refs.productList.showList(idx);
  }

  /**
   * check if product is already selected
   */
  checkProduct(idx, product) {
    let products = this.state.products;

    // check if product is already added
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      if (!p.product.product_id && !product.product_id) { 
        if (p.product.product_name == product.product_name && idx != p.idx) 
          return true;
        else
          return false;
      }
      else if (p.product.product_id == product.product_id && idx != p.idx) {
        return true;
      }
    }

    return false;

  }

  /**
   * set product
   */
  setProduct(idx, product) {
    let products = this.state.products;

    let newProducts = [];
    let hasEmptyProduct = false;
    let maxIdx = 0;
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      maxIdx = p.idx;
      if (p.idx == idx)
        p = {idx, product};

      newProducts.push(p);

      if (!p.product.product_name)
        hasEmptyProduct = true;
    }

    if (!hasEmptyProduct)
      newProducts.push({idx: maxIdx+1, product:{} });

    this.setState({products:newProducts});

    // 设置每垛多少箱
    if (!this.stackstandard && product && product.stackstandard)
      this.stackstandard = product.stackstandard;
  }

  /**
   * set product amount
   */
  setAmount(idx, amount) {
    let products = this.state.products;
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      if (p.idx == idx) {
        p.product.plancount = amount;
        products[i] = p;
        break;
      }
    }

    this.setState({products});
  }

  /**
   * add product
   */
  addProduct() {
    let products = this.state.products;
    this.productsIdx++;
    products.push({idx: this.productsIdx, product:{} });
    this.setState({products});
  }

  /**
   * remove product
   */
  removeProduct(idx) {
    if (this.state.products.length == 1)
      return;

    Alert.alert(
      '移除确认',
      '是否确认移除该商品？',
      [
        {text: '取消', onPress:() => {} },
        {text: '确定', onPress:() => this.doRemoveProduct(idx)}
      ]
    );
  }

  /**
   * do remove product
   */
  doRemoveProduct(idx) {
    let products = this.state.products;
    let newProducts = [];
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      if (p.idx == idx) {
        continue;
      }
      newProducts.push(p);
    }

    this.setState({products:newProducts});
  }

  /**
   * create form offline
   */
  createFormOffline() {
    if (this.isPosting)
      return;

    // check data
    let products = this.state.products;
    if (products.length <= 1) {
      Tools.alert('请设置商品');
      return;
    }

    let formProducts = [];
    for (let i = 0; i < products.length-1; i++) {
      let product = products[i].product;
      if (!product || !product.product_name || !product.plancount) {
        Tools.alert('请设置完整商品信息');
        return;
      }
      formProducts.push({
        product_id: product.product_id,
        product_name: product.product_name,
        plancount: product.plancount
      });
    }

    // 出库单检查接收单位
    if (this.props.formtype == 2 || this.props.formtype == 4) {
      if (!this.state.receiver.id) {
        Tools.alert('请选择接收单位');
        return;
      }
    }

    // 创建/编辑出入库单
    let warehousing = this.props.warehousing;
    // 新建模式
    if (!warehousing) {
      warehousing = new Warehousing();
      // 设置临时单号
      let modelData = {
        ware_no: "LS" + ( 99999999 - parseInt(Math.random() * 1000000) ),
        ware_type: this.props.formtype,
        create_at: new Date().getTime(),
        receiver_id: this.state.receiver && this.state.receiver.id,
        receiver_name: this.state.receiver && this.state.receiver.name
      }
      warehousing.setData(modelData);
      warehousing.save().then( result => {
        this.doCreateFormOffline(warehousing, formProducts);
      }).catch(error => {
        Tools.alert('新增'+this.formTypeName+'失败了');
      });
    } 
    // 编辑模式
    else {
      warehousing.setData({
        receiver_id: this.state.receiver && this.state.receiver.id,
        receiver_name: this.state.receiver && this.state.receiver.name
      });
      warehousing.save().then( result => {
        this.doCreateFormOffline(warehousing, formProducts);
      }).catch(error => {
        Tools.alert('编辑'+this.formTypeName+'失败了');
      });
    }

  }

  /**
   * do create form offline
   */
  doCreateFormOffline(warehousing, formProducts) {
    // 删除商品记录
    let query = WarehousingProduct.query('delete');
    query.where("ware_id = " + warehousing.data.id);
    WarehousingProduct.exec(query).then( result => {
      let formDetails = [];
      formProducts.map( product => {
        let wareProduct = new WarehousingProduct();
        wareProduct.setData({
          ware_id: warehousing.data.id,
          product_id: product.product_id,
          product: product.product_name,
          box_nums: product.plancount
        });
        wareProduct.save();

        formDetails.push({
          productid: product.product_id,
          productname: product.product_name,
          plancount: product.plancount,
          actualcount: 0
        });
      });

      // push submit form
      let data = {
        formno: warehousing.data.ware_no,
        formdetails:formDetails
      };

      // 从扫码表单push过来的
      if (this.props.from == 'submit') {
        this.props._parent && this.props._parent.reloadProducts && this.props._parent.reloadProducts();
        this.navigator.pop();
        return;
      }
      
      // refresh parent list
      this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();
      // switch segment
      setTimeout(() => {
        this.props.parent && this.props.parent.switchSegment && this.props.parent.switchSegment(0, false);
      },1000);

      if (this.props.warehousing)
        this.navigator.replace('submitForm', {data, warehousing, formtype: this.props.formtype, _parent: this.props._parent});
      else
        this.navigator.push('submitForm', {data, warehousing, formtype: this.props.formtype, _parent: this.props.parent});

    }).catch( error => {
      Tools.alert( (this.props.warehousing ? '编辑':'新增')+this.formTypeName+'失败了');
    });
  }

  /**
   * create form
   */
  createForm() {
    if (this.isPosting)
      return;

    // check data
    let products = this.state.products;
    if (products.length <= 1) {
      Tools.alert('请设置商品');
      return;
    }

    let formProducts = [];
    for (let i = 0; i < products.length-1; i++) {
      let product = products[i].product;
      if (!product || !product.id || !product.plancount) {
        Tools.alert('请设置完整商品信息');
        return;
      }
      formProducts.push({
        productid: product.product_id,
        plancount: product.plancount
      });
    }

    let formInfo = {
      formtype: this.props.formtype
    };

    if (this.props.formtype == 2) {
      if (!this.state.receiver.id) {
        Tools.alert('请选择接收单位');
        return;
      }
      formInfo.receiveorganizationid = this.state.receiver.id;
    } else if (this.props.formtype == 1 || this.props.formtype == 4) {
      if (!this.state.receiver.id) {
        Tools.alert('请选择发出单位');
        return;
      }
      formInfo.sendorganizationid = this.state.receiver.id;
      formInfo.receiveorganizationid = User.orgId;
    }

    // 生产入库，需要选择生产线和生产批次
    if (this.props.formtype == 3) {
      if (!this.state.productionLine) {
        Tools.alert("请选择生产线");
        return;
      }

      if (!this.state.productionBatch) {
        Tools.alert("请输入生产批次");
        return;
      }

      formInfo.sendorganizationid = this.state.productionLine.id;
      formInfo.productionbatch = this.state.productionBatch;
    }
    
    this.isPosting = true;
    this.setState({isLoading:true});
    this.props.parent && this.props.parent.setState({isLoading:true});
    
    Tools.post({
      url: Constants.api.addForm,
      data: {
        forminfo: formInfo, 
        forminfodtls: formProducts
      },
      success: (data) => {
        console.log(data);

        setTimeout(() => {
          this.props.parent && this.props.parent.switchSegment && this.props.parent.switchSegment(0, false);
        },1000);

        this.isPosting = false;
        this.setState({isLoading: false});
        this.props.parent && this.props.parent.setState({isLoading:false});

        // 历史记录
        this.updateCache(data);

        // 生产入库跳转到组垛
        if (this.props.formtype == 3) {
          this.navigator.push('associateStack', {
            data,
            formtype: this.props.formtype,
            productionLine: this.state.productionLine,
            productionBatch: this.state.productionBatch,
            stacks: 0,
            stackstandard: this.stackstandard
          });
        } else {
          this.navigator.push('submitForm', {data, formtype: this.props.formtype, _parent: this.props.parent});
        }
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.setState({isLoading: false})
        this.props.parent && this.props.parent.setState({isLoading:false});

      }
    });

  }

  /**
   * 更新缓存
   */
  updateCache(data) {
    let formNo = data.formno;
    let formType = this.props.formtype;
    let products = data.formdetails;

    WarehousingCache.updateItem({
      formNo, 
      formType,
      productionLine: this.state.productionLine,
      productionBatch: this.state.productionBatch,
      products,
      stacks: 0
    }).then( (cache) => {

    }).catch( error => {

    });
  }

  /**
   * show receiver list
   */
  showReceiers() {
    this.refs.organization.showList();
  }

  /**
   * set receiver
   */
  setReceiver(receiver) {
    console.log(receiver);

    this.setState({receiver});
  }

  /**
   * delete warehousing
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
    let warehousing = this.props.warehousing;
    warehousing.delete();
    
    setTimeout( () => {
      // refresh parent & pop
      this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();
      this.navigator.pop();
    }, 500);
  }

  /**
   * show production lines
   */
  showProductionLines() {
    this.navigator.push('productionLines', {_parent: this});
  }

  /**
   * set production line
   */
  setProductionLine(item) {
    this.setState({productionLine: item});
  }

  renderSender() {
    // 出库和入库
    if (this.props.formtype == 2 || this.props.formtype == 1 || this.props.formtype == 4) {
      return (
        <View>
          <View style={[styles.row, styles.senderBox, {marginBottom: this.state.receiver.id ? 0:15}]}>
            <Text style={{fontSize: 16, color: '#555'}}>{this.props.formtype == 2 ? '接收':'发出'}单位</Text>
            <TouchableOpacity onPress={() => this.navigator.push('receiverList', {_parent:this, wareType: this.props.formtype})} style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
              <Text style={{fontSize:16, color: Constants.color.blue}} numberOfLines={1}>请选择单位</Text>
              <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
            </TouchableOpacity>
          </View>
          {this.state.receiver.id ?
            <View style={[styles.row, {marginBottom:15}]}>
              <Text style={styles.rowText}>{this.state.receiver.name}</Text>
            </View>
            : null
          }
        </View>
      );
    }

    // 退货
    /*if (this.props.formtype == 4) {
      let user = User.getUser();
      console.log('++++++++++++++');
      console.log(user);
      return (
        <View>
          <View style={[styles.row, styles.senderBox]}>
            <Text style={{fontSize: 16, color: '#555'}}>发出单位</Text>
          </View>
          <View style={[styles.row, {marginBottom:15}]}>
            <Text style={styles.rowText}>{user.orgName}</Text>
          </View>
        </View>
      );
    }*/
  }

  renderReceiver() {
    if (this.props.formtype == 4) {
      let user = User.getUser();
      console.log('++++++++++++++');
      console.log(user);
      return (
        <View>
          <View style={[styles.row, styles.senderBox]}>
            <Text style={{fontSize: 16, color: '#555'}}>接收单位</Text>
          </View>
          <View style={[styles.row, {marginBottom:15}]}>
            <Text style={styles.rowText}>{user.orgName}</Text>
          </View>
        </View>
      );
    }

    /*
    if (this.props.formtype == 4) {
      return (
        <View style={[styles.row, styles.senderBox, {marginBottom: this.state.receiver.id ? 0:15}]}>
          <Text style={{fontSize: 16, color: '#555'}}>接收单位</Text>
          <TouchableOpacity onPress={() => this.navigator.push('receiverList', {_parent:this, wareType: 2})} style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:16, color: Constants.color.blue}} numberOfLines={1}>请选择单位</Text>
            <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
          </TouchableOpacity>
        </View>
      );
    }*/
  }

  renderBatchLine() {
    if (this.props.formtype != 3)
      return;

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
      borderRadius:4, 
      backgroundColor:'#f4f4f4',
      borderWidth:0.5,
      borderColor: '#ccc'
    };

    return (
      <View>
        <Touchable onPress={() => this.showProductionLines()} style={[styles.row, {justifyContent:'space-between'}]}>
            <Text style={styles.rowText}>生产线</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowText2}>
              { this.state.productionLine ? 
                this.state.productionLine.name
                : '请选择生产线'
              }
              </Text>
              <View style={{height: 20, overflow:'hidden'}}>
                <Icons.Ionicons name="ios-arrow-forward" size={24} color='#ddd' style={{marginTop:-2, marginLeft:5}}/>
              </View>
            </View>
          </Touchable>
          <View style={[styles.row, {justifyContent:'space-between', paddingVertical:3*Constants.scaleRate}]}>
            <Text style={styles.rowText}>生产批次</Text>
            <View style={textInputContainerStyle}>
              <TextInput
                ref={input => this.inputRef = input}
                style={textInputStyle} 
                underlineColorAndroid="transparent"
                placeholder="请输入生产批次"
                placeholderTextColor="#aaa"
                value={this.state.productionBatch}
                onChangeText={(txt) => this.setState({ productionBatch: txt })}
              />
            </View>
          </View>
      </View>
    );
  }

  /**
   * render view
   */
  getView() {
    let productsView = this.state.products.map( (v, k) => {
      return (
        <Product 
          parent={this} 
          idx={v.idx} 
          formType={this.props.formtype}
          type="warehousing" 
          key={"product"+v.idx} 
          selectedProduct={v.product}/>
      )
    });

    let buttonWidth = this.props.warehousing && this.props.from != 'submit' ? 90:120;
    let height = this.isScene ? Constants.contentHeight:Constants.contentHeight-80;

    return (
      <FormContainer style={[styles.container, {height,marginTop: 15 - this.state.marginTop}]}>
        {this.renderSender()}
        {this.renderReceiver()}
        {this.renderBatchLine()}
        {productsView}
        <View style={{marginTop:20, marginBottom:30, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          { User.offline ? 
            <Button title="离线保存" onPress={() => this.createFormOffline()} style={{width:buttonWidth}}/>
            :
            <Button title="提交" onPress={() => this.createForm()} style={{width:buttonWidth}}/>
          }
          { this.props.warehousing && this.props.from != 'submit' ? 
            <Button title="删除" onPress={() => this.delete()} style={{width:buttonWidth, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
            :null
          }
          <Button title="返回" onPress={() => this.navigator.pop()} style={{width:buttonWidth, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
        </View>
      </FormContainer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: Screen.width,
    height: Constants.contentHeight-80,
    backgroundColor:'#f5f5f5'
  },
  row: {
    flexDirection:'row',
    alignItems:'center',
    padding:10,
    paddingVertical:13,
    backgroundColor:'#fff',
    borderBottomColor:'#ddd',
    borderBottomWidth:1
  },
  rowText: {
    fontSize: 16,
    color: '#555'
  },
  row2: {
    flexDirection:'column',
    justifyContent:'flex-start',
    backgroundColor:'#fff',
    borderBottomWidth:1,
    borderBottomColor:'#ddd'
  },
  selectBox: {
    borderWidth:1,
    borderColor:'#ccc',
    flexDirection:'row',
    alignItems:'center',
    paddingRight:10
  },
  modalContainer: {
    width: Screen.width,
    height: Screen.height,
    backgroundColor:'rgba(0,0,0,.3)',
    alignItems:'center',
    justifyContent:'center'
  },
  productItem: {
    padding: 15,
    borderBottomWidth:1,
    borderBottomColor: '#ccc',
    backgroundColor:'#fff'
  },
  textInput: {
    borderWidth:0.5,
    borderColor: '#ccc',
    borderRadius:4,
    overflow:'hidden',
    height: 35,
    width: 50,
    padding:5,
    marginLeft: 30,
    backgroundColor:'#f4f4f4'
  },
  textInputFocus: {
    borderColor: Constants.color.yellow
  },
  modalBox: {
    width:Screen.width-60,
    height: 200,
    backgroundColor:'#fff',
    borderRadius:8,
    padding:20,
    alignItems:'center',
    justifyContent:'center'
  },
  segmentBox: {
    flexDirection: 'row',
    alignItems:'center',
    marginTop:17,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    backgroundColor:'#fff'
  },
  segmentItem: {
    width: Screen.width/2,
    padding: 14,
    alignItems:'center',
    justifyContent:'center',
    borderBottomWidth:2,
    borderBottomColor: 'transparent'
  },
  segmentItemActive: {
    borderBottomColor: Constants.color.yellow,
  },
  segmentText: {
    fontSize: 17,
    fontWeight: Constants.fonts.bold1,
    color: '#888'
  },
  segmentTextActive: {
    color: Constants.color.yellow
  },
  mask: {
    position:'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent:'center'
  },
  maskContent: {
    backgroundColor: '#fff',
    padding: 20,
    paddingHorizontal: 30,
    width: Screen.width - 40
  },
  maskText: {
    fontSize: 18,
    fontWeight: Constants.fonts.bold1,
    color: '#555',
    marginBottom:10
  },
  senderBox: {
    justifyContent:'space-between', 
    borderTopWidth:1, 
    borderTopColor:'#ddd', 
    marginBottom: 0
  },
  rowRight: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
});
