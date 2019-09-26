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

import {User, Stack as StackModel, StackLog, WarehousingCache} from 'models';
// product list
import Product from '../products';
// offline log list
import StackOfflineList from './stack-offline-list';
// icons
import { Associate as AssociateIcon } from 'images';

export default class Stack extends Base {
  constructor(props) {

    let formDetails = [];
    if (props.data)
      formDetails = props.data.originformdetails || props.data.formdetails;

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
      stackCode:'',
      txtBoxesPerStack:'' + (props.stackstandard || ''),
      modalHideMode:false,
      selectedSegment: 0,
      isAssociated: null,
      associateItems: null,
      addSubstractCode: null,
      addSubstractType: null,
      formDetails: formDetails || [],
      hasFinished: false
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
    this.submits = props.stacks || 0;

    this.onBarCodeRead = this.onBarCodeRead.bind(this);

    console.log(props.data);

    this.stackCacheKey = 'stack-codes-';
    if (props.data && props.data.formno)
      this.stackCacheKey += props.data.formno;
  }

  componentDidMount() {
    super.componentDidMount();

    /**
     * check offline un-submit data
     */
    Config.getItem( this.stackCacheKey ).then(result => {
      let currentCode = result.currentCode;
      if (currentCode) {

        if (currentCode.length > 0) {
          this.setState({selectedProduct: result.product, currentCode, txtBoxesPerStack: result.boxesPerStack });
          this.productRef && this.productRef.setState({selectedProduct: result.product});
          Alert.alert(
            '有未提交的数据',
            '有' + currentCode.length + '条未提交的垛码关联数据，是否现在提交？',
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

    // 生产入库模式：如果只有一个商品，设置为selected
    if (this.props.formtype) {
      setTimeout( () => {
        let formDetails = this.state.formDetails;
        if  (formDetails && formDetails.length == 1) {
          formDetails[0].product_id = formDetails[0].productid;
          this.setState({selectedProduct: formDetails[0]});
        }
      }, 1000);

      this.checkPlanCount();
    }

    /*setTimeout( () => {
      //this.onBarCodeRead({code: '201906100016092970'});
      //this.updateCount('substract');
      this.updateCache();
    }, 5000);*/
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
    // 组件unmount、显示垛码生成对话框的时候忽略扫码
    if (this.unmount || this.showingModal || this.state.modalVisible3)
      return;

    // check product
    if (this.state.selectedSegment != 1 && !this.state.modalVisible4) {
      /*if (!this.state.selectedProduct) {
        Tools.alert('请先选择商品');
        Vibration.vibrate();
        return;
      }*/

      if (this.props.formtype) {
        // check data
        if (!this.state.selectedProduct 
            || ( !this.state.selectedProduct.id && !this.state.selectedProduct.product_id) ) {
          Tools.alert("请选择商品");
          return;
        }
      }

      // check boxes per stack
      if (!this.state.txtBoxesPerStack) {
        Tools.alert('请设置每垛箱数');
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
      global.EventEmitter.emit("stack-add-substract-barcode", {code});
      return;
    }
    // un-associate mode
    else if (this.state.selectedSegment == 1) {
      // check code
      if (!User.checkRule('box', Tools.getCode(code))) {
        Tools.alert('箱码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
      this.setState({modalHideMode:false, unAssociateCode: code});
      this.queryAssociate(code);
      return;
    }

    // box code scan - 弃用（2019-08-26）
    /*if (this.state.modalVisible3) {
      // check code
      if (!User.checkRule('stack', code)) {
        Tools.alert('垛码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
      this.setState({modalHideMode:false, stackCode: code, });
      setTimeout(() => {
        this.setStackCode();
      }, 200);
      return;
    }*/

    // check current focus field & check code rules
    if (!User.checkRule('box', code)) {
      Tools.alert('箱码错误', '请重新扫描');
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

    // save code list into AsyncStorage
    Config.setItem( this.stackCacheKey, {
      product: this.state.selectedProduct,
      currentCode: currentCode,
      boxesPerStack: this.state.txtBoxesPerStack
    });

    // reach the number of bottles per box
    if (currentCode.length + '' == this.state.txtBoxesPerStack) {
      this.showingModal = true;
      // display box code interface
      setTimeout( () => {
        this.setState({modalVisible3: true, modalHideMode:false});
        this.showingModal = false;
      }, 1000);
      return;
    }

  }

  testData(type) {
    let code = 99999999 - parseInt(Math.random() * 10000000);
    this.onBarCodeRead({code: (type == 'stack' ? '30':'20') + code});

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

    if (product && product.stackstandard) {
      this.setState({txtBoxesPerStack: '' + product.stackstandard});
    }
  }

  // associate offline
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
      if (this.state.currentCode.length+'' == this.state.txtBoxesPerStack) {
        this.setState({modalVisible3:true});
        return;
      } else {
        Tools.alert("您有未完成的垛");
        return;
      }
    }

    if (Object.keys(this.codelist).length == 0) {
      Tools.alert("没有要提交的数据");
      return;
    }

    this.isPosting = true;
    this.setState({isLoading:true});

    // create stack log
    let stackLog = new StackLog();
    stackLog.setData({
      product: this.state.selectedProduct.product_name,
      product_id: this.state.selectedProduct.product_id,
      nums: Object.keys(this.codelist).length,
      create_at: new Date().getTime()
    });
    stackLog.save().then( result => {
      if (!result) {
        this.isPosting = false;
        this.setState({isLoading: false});
        Tools.alert('保存出错了');
        return;
      }

      // save codes into boxes
      let logId = stackLog.data.id;
      let keys = Object.keys(this.codelist);
      keys.map( (stackCode) => {
        let codes = this.codelist[stackCode];
        let stack = new StackModel();
        stack.setData({
          log_id: logId,
          stack_code: stackCode,
          box_code: codes,
          create_at: new Date().getTime()
        });
        stack.save();
      });

      this.isPosting = false;
      this.codelist = {};
      this.setState({isLoading: false});
      Tools.alert('离线保存成功', '待提交垛数：' + keys.length);
      Config.setItem( this.stackCacheKey, {product: this.state.selectedProduct, currentCode: []});
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
    if (!this.state.selectedProduct 
        || ( !this.state.selectedProduct.id && !this.state.selectedProduct.product_id) ) {
      Tools.alert("请选择商品");
      return;
    }

    // check current scan bottle number
    if (this.state.currentCode.length > 0) {
      if (this.state.currentCode.length+'' == this.state.txtBoxesPerStack) {
        this.showingModal = true;
        setTimeout( () => {
          this.setState({modalVisible3:true});
          this.showingModal = false;
        }, 1000);
        return;
      } else {
        Tools.alert("您有未完成的垛");
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
      url: Constants.api.associateStack,
      data: {
        productid: productId || 0, 
        stackcodes: this.codelist,
        ProductLot: this.props.data && this.props.data.productionbatch || this.props.productionBatch
      },
      success: (data) => {
        console.log(data);
        //this.submits += Object.keys(this.codelist).length;
        if (!this.props.formtype)
          this.submits += 1;

        this.codelist = {};
        this.setState({isLoading:false});
        Tools.alert('关联完成', '关联成功：'+data.successcount+'箱，关联失败：'+data.failedcount+'箱');

        Config.setItem( this.stackCacheKey, {product: this.state.selectedProduct, currentCode: []});
        this.isPosting = false;

        // 生产入库的组垛模式：提交生产入库
        if (this.props.formtype && data.stackcode)
          this.submitWarehousing(data.stackcode);
      },
      error: (data) => {
        this.setState({isLoading:false});
        this.isPosting = false;
      }
    });
  }

  /**
   * 组垛成功之后提交入库
   */
  submitWarehousing(code) {
    // 查询关联模式
    if (this.state.selectedSegment == 1) {
      let items = this.state.associateItems;
      if (!items || !items.ResultCodes)
        return;

      let keys = Object.keys(items.ResultCodes);
      if (!keys || keys.length == 0)
        return;

      code = keys[0];
    }
    
    if (!code) {
      return;
    }

    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.submitForm,
      data: {
        formno: this.props.data.formno,
        codetype: 3,
        code: code,
        isdelete: 0
      },
      timeout: 20000,
      success: (data) => {
        console.log(data);
        // update form detail in state
        let details = this.state.formDetails;
        for (let i = 0; i < details.length; i++) {
          let detail = details[i];
          if (detail.productname == data.productname) {
            // 累计完成大于计划完成，弹出提示
            let newCount = data.actualcount;
            if (detail.actualcount <= detail.plancount && newCount > detail.plancount) {
              Tools.alert(
                '', 
                '当前“' + detail.productname + '”的累计完成箱数已经大于计划箱数，请注意入库商品数量！', 
                [ {text: '我知道了'} ]
              );
            }
            detail.actualcount = newCount;
            if (!detail.count)
              detail.count = data.curcompletecount;
            else
              detail.count = detail.count + data.curcompletecount;
          }
          details[i] = detail;
        }

        this.setState({formDetails: details, isLoading:false});
        this.isPosting = false;

        this.submits += 1;
        setTimeout( () => {
          this.updateCache();
          this.checkPlanCount();
        }, 100);
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.setState({isLoading:false});
      }
    });
  }

  /**
   * finish form
   * @param {int} type: 1 部分入库 2 完全入库
   */
  finishForm(type) {
    if (this.isPosting)
      return;

    this.setState({isLoading:true});
    this.isPosting = true;

    let postData = {
      formno: this.props.data.formno,
      sendorganizationid: this.props.productionLine.id,
      productionbatch: this.props.productionBatch,
      ispartialfinish: type == 1 ? 1:0
    }

    this.updateCache();

    Tools.post({
      url: Constants.api.finishProductionForm,
      data: postData,
      success: (data) => {
        console.log(data);
        this.setState({isLoading:false,modalVisible3:false, modalVisible4:false});
        this.isPosting = false;

        // 生产入库：部分入库，留在当前界面
        if (this.props.formtype == 3 && type == 1 ) {
          // 将本次完成清零
          let details = this.state.formDetails;
          details && details.map( detail => {
            detail.count = 0;
          });
          this.setState({formDetails: details});
          
          Tools.toast("部分入库成功");
        } else {
          this.navigator.pop();
        }
        
      },
      error: (data) => {
        console.log(data);
        //Tools.alert('提交出错了', JSON.stringify(data));
        this.setState({isLoading:false});
        this.isPosting = false;
      }
    });
  }

  /**
   * 更新缓存
   */
  updateCache() {
    let formNo = this.props.data.formno;
    let formType = this.props.formtype;
    let products = this.state.formDetails;

    // 检查是否已完成
    let hasFinished = true;
    products && products.map( product => {
      if (product.plancount > product.actualcount)
        hasFinished = false;
    });

    // 已完成的单号删除
    if (hasFinished) {
      WarehousingCache.deleteItem({formNo, formType});
      return;
    }

    WarehousingCache.updateItem({
      formNo, 
      formType,
      productionLine: this.props.productionLine,
      productionBatch: this.props.productionBatch,
      products,
      stacks: this.submits,
      boxesPerStack: parseInt(this.state.txtBoxesPerStack)
    }).then( (cache) => {

    }).catch( error => {

    });
  }

  /**
   * 关联查询
   */
  queryAssociate(code) {
    if (!code) {
      Tools.alert("提示信息", "请扫描箱码");
      return;
    }

    this.setState({isAssociated:false, associateItems: null, isLoading:true});

    Tools.post({
      url: Constants.api.getBoxesInStack,
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
      Tools.alert("提示信息", "请扫描要解除关联的箱码");
      return;
    }

    Alert.alert(
      '是否要解除该垛的箱垛关联？',
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
    let currentCode = this.state.currentCode;
    if (currentCode.length > 0) {
      for (let i = 0; i < currentCode.length; i++) {
        if ( currentCode[i].indexOf(this.state.unAssociateCode) >= 0)
          continue;
        newList[i] = currentCode[i];
      }
      this.setState({currentCode: newList});
      Config.setItem( this.stackCacheKey, {product: this.state.selectedProduct, currentCode: newList, boxesPerStack: this.state.boxesPerStack});
    }

    let item = this.state.associateItems;
    let itemKeys = Object.keys(item.ResultCodes);
    let stackCode = itemKeys[0];

    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.unAssociateStack,
      data: {
        StackCode: ''+stackCode,
        BoxCode: '' + this.state.unAssociateCode
      },
      success: (data) => {
        Tools.alert('该箱码对应的垛码解除箱垛关联成功');
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
    //let unsubmits = Object.keys(this.codelist).length;
    let unsubmits = this.state.currentCode && this.state.currentCode.length;
    if (unsubmits > 0) {
      Alert.alert(
        '清除确认',
        '你确认要清除未提交的 '+unsubmits+" 条数据吗？",
        [
          {text: '取消', onPress: () => {} },
          {text: '确定', onPress: () => {
            this.codelist = {};
            this.setState({currentCode:[], idx: this.state.idx+1});
            Config.setItem( this.stackCacheKey, {});
          } }
        ]
      );
    }
  }

  /**
   * 清除上一个
   */
  removeLast() {
    //let unsubmits = Object.keys(this.codelist).length;
    let unsubmits = this.state.currentCode && this.state.currentCode.length;
    if (unsubmits > 0) {
      Alert.alert(
        '清除确认',
        '你确认要清除上一条数据吗？',
        [
          {text: '取消', onPress: () => {} },
          {text: '确定', onPress: () => {
            let codes = this.state.currentCode;
            codes.pop();

            this.setState({currentCode: codes, idx: this.state.idx+1});

            if (codes.length == 0) {
              Config.setItem( this.stackCacheKey, {});
            } else {
              Config.setItem( this.stackCacheKey, {
                product: this.state.selectedProduct,
                currentCode: codes,
                boxesPerStack: this.state.txtBoxesPerStack
              });
            }
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
   * set stack code
   */
  setStackCode(stack) {
    let stackCode = this.state.stackCode;
    let currentCode = this.state.currentCode;
    // system stack
    if (stack == -1) {
      this.codelist["-1"] = currentCode.join(",");
    } else {
      this.codelist[stackCode] = currentCode.join(",");
    }

    this.setState({stackCode:'', currentCode:[], modalVisible3:false});
    setTimeout(() => {
      if (User.offline)
        this.associateOffline();
      else
        this.associate();
    }, 200);
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
   * set boxes per stack
   */
  setBoxesPerStack(newAmount) {
    if (newAmount && (!Tools.isNumber(newAmount) || newAmount < 1) ) {
      Tools.alert("提示信息", "请输入正确的数量");
      this.setState({ txtBoxesPerStack: "" + this.state.txtBoxesPerStack });
      return;
    }

    this.setState({txtBoxesPerStack:newAmount})
  }

  /**
   * 生产入库表单
   */
  showSubmitForm() {
    if (this.isSubmiting)
      return;

    this.isSubmiting = true;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.getFormInfo,
      data: {formno: this.props.data.formno, formtype: this.props.formtype},
      success: (data) => {
        this.navigator.push('submitForm', {
          data, 
          productionLine: data.sendorganizationid && data.productionbatch ? {id: data.sendorganizationid, name: data.sendorganizationName}:null,
          productionBatch: data.productionbatch,
          formtype: this.props.formtype,
          formstate: this.props.data && this.state.data.formstate
        });

        this.setState({isLoading:false});
        this.isSubmiting = false;
      },
      error: (data) => {
        this.setState({isLoading:false});
        this.isSubmiting = false;
      }
    });
  }

  selectProduct(item, index) {
    item.product_id = item.productid;
    this.setState({selectedProduct: item});
  }

  /**
   * 检查是否完成计划数
   */
  checkPlanCount() {
    let details = this.state.formDetails;
    if (!details || details.length == 0)
      return;

    for (let i = 0; i < details.length; i++) {
      let detail = details[i];
      if (detail.plancount > detail.actualcount) {
        this.setState({hasFinished:false});
        return;
      }
    }

    this.setState({hasFinished:true});
  }

  /**
   * 商品信息
   */
  renderProducts() {
    // 从创建出入库表单过来的
    if (this.props.formtype) {
      let details = this.state.formDetails;

      /*details = [
        {productname: 'test', plancount:0, count:0, actualcount:0}
      ];*/

      // get products info
      let productsView = details.map( (v, k) => {
        let colorCount = '#999', colorActualCount = '#999';
        if ( v.count && v.count > v.plancount)
          colorCount = 'red';
        if (v.actualcount > v.plancount)
          colorActualCount = 'red';

          let count = v.count || 0;
          if (count)
            count = count.toFixed(2);
    
          let actualCount = v.actualcount || 0;
          if (actualCount)
            actualCount = actualCount.toFixed(2);
    
        return (
          <Touchable onPress={() => this.selectProduct(v, k)} style={[styles.row2, {backgroundColor:'#f4f5f6', padding:10, borderBottomWidth:2, borderBottomColor:'#fff'}]} key={"product:"+this.state.idx + ":" + k}>
            <View style={[styles.column1, {flexDirection:'row', alignItems:'center'}]}>
              {this.renderCheckBox(v, k)}
              <Text style={styles.rowText} numberOfLines={1}>{v.productname}</Text>
            </View>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:10}}>
              <Text style={{fontSize: 14, color: '#999', width: 60}}>计划箱数</Text>
              <Text style={{fontSize: 14, color: '#999', width: 40}}>{v.plancount || 0}</Text>
              <Text style={{fontSize: 14, color: colorCount, width: 60}}>本次完成</Text>
              <Text style={{fontSize: 14, color: colorCount, width: 40}}>{count}</Text>
              <Text style={{fontSize: 14, color: colorActualCount, width: 60}}>累计完成</Text>
              <Text style={{fontSize: 14, color: colorActualCount, width: 40}}>{actualCount}</Text>
            </View>
          </Touchable>
        );
      });

      return (
        <View>
          {productsView}
        </View>
      );
    } else {
      return (
        <Product 
          parent={this} 
          selectedProduct={this.state.selectedProduct} 
          from="stack" 
          ref={(ref) => this.productRef = ref}
        />
      );
    }
  }

  /**
   * 提交按钮
   */
  renderSubmitButton(type) {
    // 离线模式
    if (User.offline) {
      return (
        <Button title="离线保存" onPress={() => this.associateOffline()} style={{ width: 110 }} />
      );
    }

    // 生产入库模式
    if (this.props.formtype) {
      // 完成入库
      if (this.state.hasFinished) {
        return (
          <Button 
            title='完成入库' 
            onPress={() => this.finishForm(2)} 
            style={{ width: type == 'queryMode' ? Screen.width-40:110 }} 
            ignoreFontSize={type == 'queryMode'}
          />
        );
      } 
      // 部分入库
      else {
        return (
          <Button 
            title='部分入库' 
            onPress={() => this.finishForm(1)} 
            style={{ width: type == 'queryMode' ? Screen.width-40:110 }} 
            ignoreFontSize={type == 'queryMode'}
          />
        );
      }
    }

    // 其他情况
    return (
      <Button title="提交" onPress={() => this.associate()} style={{ width: 110 }} />
    );
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
          {this.renderProducts()}
          <Touchable>
            <View style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd'}]}>
              <Text style={styles.rowText}>累计关联垛数      {submits}</Text>
            </View>
            <View style={{marginTop:13, borderTopWidth:1, borderTopColor:'#ddd'}}>
              <View style={[styles.row, {paddingVertical:8}]}>
                <Text style={styles.rowText}>请设定每垛 </Text>
                <View style={[styles.textInput, {paddingTop:5, marginLeft:0, paddingLeft:Constants.isAndroid ? 2:5}]}>
                  <TextInput
                    style={{height: 35, marginTop: Constants.isAndroid ? -6:-8, fontSize: 12}}
                    underlineColorAndroid='transparent'
                    onChangeText={(text) => this.setBoxesPerStack(text)}
                    value={this.state.txtBoxesPerStack}
                    keyboardType='numeric'
                  />
                </View>
                <Text style={styles.rowText}> 箱</Text>
              </View>
              <View style={styles.row2}>
                <View style={[styles.row, {borderBottomWidth:0, justifyContent:'space-between', paddingVertical:0, paddingTop:0}]}>
                  <Text style={styles.rowText}>当前已扫<Text style={{color: '#ff0000'}}>{this.state.currentCode.length}</Text>箱</Text>
                  <View style={{flexDirection:'row'}}>
                    <Button title="清除上一个" onPress={() => this.removeLast()} style={{width:80, backgroundColor:'#fff', paddingVertical:3}} fontStyle={{color: Constants.color.blue, fontSize:12, fontWeight:'400'}}/>

                    <Button title="清除" onPress={() => this.clear()} style={{width:60, backgroundColor:'#fff', paddingVertical:3}} fontStyle={{color: Constants.color.blue, fontSize:12, fontWeight:'400'}}/>
                  </View>
                </View>
                <View style={{alignItems:'flex-end', paddingRight:20, marginBottom:6}}><Text style={{fontSize:11, color:'#666'}}>清除目前所有的待提交数据</Text></View>
              </View>
              <View style={[styles.row, {paddingVertical:8}]}>
                <Text style={styles.rowText}>箱码</Text>
                <QRCodeText style={[styles.textInput, styles.textInputFocus, {width: Screen.width-90}]} parent={this}>
                  {Tools.parseCode(currentCode)}
                </QRCodeText>
              </View>
            </View>
          </Touchable>

          <View style={{marginTop:12, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            {this.renderSubmitButton()}
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
            <Text style={styles.rowText}>箱码</Text>
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
                    '该箱码已做箱垛关联，是第'+item.SequenceNo+'箱，共'+item.TotalCount+'箱'
                    :
                    '该箱码未做箱垛关联' 
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
              <Button title="垛加箱" onPress={() => this.showAddSubstract('add')} style={{ width: (Screen.width-60)/2, backgroundColor: '#fff' }} fontStyle={{ color: Constants.color.blue }} icon="md-add-circle"/>
              <Button title="垛减箱" onPress={() => this.showAddSubstract('substract')} style={{ width: (Screen.width-60)/2, backgroundColor: '#fff' }} fontStyle={{ color: Constants.color.blue }} icon="md-remove-circle"/>
            </View>
            <View style={{marginTop:0, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
              <Button title="解除关联" onPress={() => this.unAssociate()} style={{width:Screen.width-40}}/>
            </View>
            { this.props.formtype ?
              <View style={{marginTop:0, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
                {this.renderSubmitButton('queryMode')}
              </View>
              : null
            }
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
            <Text style={styles.associateItemCodeText}>关联垛码 {Tools.getCode(boxCode)}</Text>
          </View>
          <View style={styles.associateItemCodeBox}>
            <Image source={{uri: AssociateIcon.image}} style={{width: 18, height:18, tintColor:"lightgrey"}}/>
            <Text style={styles.associateItemCodeText}>关联箱码 {Tools.getCode(packCode)}</Text>
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
    return (<StackOfflineList ref="offlineList" from={from}/>);
  }

  /**
   * show add or substract modal
   */
  showAddSubstract(type) {
    this.setState({modalVisible4: true, addSubstractType: type});
    /*setTimeout( () => {
      this.onBarCodeRead({code: 'http://test.zhongjiuyun.com/Product/OriginDetail?code=207368818091598672'});
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
        this.onBarCodeRead({code: 'http://sy.qkj.com.cn/a.aspx?code=32766300786532539292'});
      }, 2000);*/
    } else {
      this.setState({associateItems: null, isAssociated:null, unAssociateCode: ''});
    }

    this.setState({selectedSegment: idx});
  }

  /**
   * 更新本次完成/累计完成（垛加减箱操作）
   */
  updateCount(type) {
    let details = this.state.formDetails;
    if (!details || details.length == 0)
      return;

    let detail = details[0];
    detail.actualcount = detail.actualcount + ( type == 'add' ? 1:-1);
    if (detail.actualcount < 0)
      detail.actualcount = 0;
    
    detail.count = (detail.count || 0) + ( type == 'add' ? 1:-1);
    if (detail.count < 0)
      detail.count = 0;

    this.setState({formDetails: details});
  }

  renderCheckBox(item, index) {
    let details = this.state.formDetails;

    if (!this.props.formtype || !details || details.length <= 1)
      return;

    let selected = this.state.selectedProduct && this.state.selectedProduct.productid == item.productid;

    if (!selected) {
      return (<View style={styles.checkBox}></View>);
    }
    return (
      <View style={[styles.checkBox, {borderColor: 'blue'}]}>
        <Icons.Ionicons name="ios-checkmark-outline" size={20} color='blue' style={{top:-0.5}}/>
      </View>
    );
  }

  /**
   * 显示单号
   */
  renderWareNo() {
    if (!this.props.data || !this.props.data.formno)
      return;

    return (
      <View style={[styles.row,{justifyContent:'space-between', borderBottomWidth:0}]}>
        <View style={[styles.row, {padding:0, paddingVertical:0,margin:0,borderBottomWidth:0}]}>
          <Text style={styles.rowText}>单号</Text>
          <Text style={[styles.rowText, {marginLeft:30}]}>{this.props.data.formno}</Text>
        </View>
      </View>
    );
  }

  /**
   * render view
   */
  getView() {
    let modalHideModeStyle;
    if (this.state.modalHideMode)
      modalHideModeStyle = {backgroundColor:'transparent', marginTop:1000};

    let marginTop = this.props.data && this.props.data.formno ? {marginTop:0}:null;

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View>
          <ScrollView style={styles.container}>
            <View style={{marginTop:13}}>
              {this.renderWareNo()}
              <View style={[styles.segmentBox, marginTop]}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(0)} style={[styles.segmentItem, this.state.selectedSegment == 0 ? styles.segmentItemActive:null]}>
                  <Text style={[styles.segmentText, this.state.selectedSegment == 0 ? styles.segmentTextActive:null]}>组垛关联</Text>
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
            </View>
            {this.renderSegmentBody()}

          </ScrollView>
          {
            this.state.modalVisible3 ?
            <View style={styles.mask}>
              <View style={styles.maskContent}>
                { User.offline ? null:
                  <View style={{marginTop:10}}>
                    <Button title="系统生成垛码后提交" onPress={() => this.setStackCode(-1)} style={{width:Screen.width-100, marginLeft:0}}/>
                  </View>
                }
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
      </TouchableWithoutFeedback>
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
      message: '',
      isAssociated: false,
      associateItems: null,
      isLoading: false
    }

    this.actionType = this.props.type == 'add' ? '加':'减';
    this.onBarCodeRead = this.onBarCodeRead.bind(this);
  }

  componentDidMount() {
    global.EventEmitter.addListener("stack-add-substract-barcode", this.onBarCodeRead);
  }

  componentWillUnmount() {
    global.EventEmitter.removeListener("stack-add-substract-barcode", this.onBarCodeRead);
  }

  onBarCodeRead(data) {
    let code = data.code;
    this.setState({code: code, message:'', associateItems: null});

    let item = this.props.item;
    let codes = {};
    let keys = Object.keys(item.ResultCodes);
    let stackCode = Tools.getCode(keys[0]);
    codes[stackCode] = ''+Tools.getCode(code);

    Tools.post({
      url: this.props.type == 'add' ? Constants.api.stackAddBox:Constants.api.stackRemoveBox,
      data: {StackCodes: codes },
      alertOnError: false,
      success: (data) => {
        //console.log(data);
        this.setState({message: '垛'+this.actionType+'箱完成，可以继续扫码操作', code: ''});

        // 如果是垛加箱，则查询该箱码的关联情况
        if (this.actionType == '加') {
          this.queryAssociate(code);
        }

        this.props.parent && this.props.parent.updateCount(this.props.type);
        setTimeout( () => {
          this.setState({message: ''});
        }, 1500);
      },
      error: (data) => {
        this.setState({message: '失败，'+(data.descr || '垛'+this.actionType+'箱失败了'), code: ''});
      }
    });
  }

  /**
   * 关联查询
   */
  queryAssociate(code) {
    if (!code) {
      return;
    }

    this.setState({isAssociated:false, associateItems: null, isLoading:true});

    Tools.post({
      url: Constants.api.getBoxesInStack,
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

  render() {
    let associateItem = this.state.associateItems;

    return (
      <View style={styles.mask}>
        <View style={styles.maskContent}>
          <View style={styles.maskRow}>
            <Text style={styles.maskText}>箱码</Text>
            <QRCodeText style={[styles.textInput, {width: Screen.width - 140, marginLeft:10, marginTop:-3}]} parent={this}>
              {Tools.parseCode(this.state.code)}
            </QRCodeText>
          </View>
          {
            this.state.message ? 
            <View style={styles.maskInfo}>
              <Text style={styles.maskInfoText}>{this.state.message}</Text>
            </View>
            :null
          }
          {
            this.actionType == '加' && this.state.associateItems ?
            <View style={styles.maskInfo}>
              <Text style={styles.maskInfoText}>关联成功，是第{associateItem.SequenceNo}箱，共{associateItem.TotalCount}箱</Text>
            </View>
            : null
          }
          <View style={{marginTop:0, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            <Button title="返回" onPress={() => this.props.parent.hideAddSubstract()} style={{width:Screen.width-90}}/>
          </View>
        </View>
      </View>
    );
  }
}