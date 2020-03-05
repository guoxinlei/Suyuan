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
  Switch,
  ScrollView,
  Keyboard,

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
  DateTimePicker
} from 'components';

import {User, WarehousingCode, WarehousingCache} from 'models';
import Moment from 'moment';

const Radio = ({title, selected, parent, codetype}) => {
  if (codetype == 4) {
    return (
        <TouchableOpacity onPress={() => parent.toggleDelete()} style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginRight:20}}>
          <Icons.Ionicons name={selected ? 'ios-checkbox':'ios-square-outline'} size={20} style={{marginRight:5}} />
          <Text>{title}</Text>
        </TouchableOpacity>
    )
  }

  return (
      <TouchableOpacity onPress={() => parent.setState({codetype})} style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginRight:20}}>
        <Icons.Ionicons name={selected ? 'md-radio-button-on':'md-radio-button-off'} size={20} style={{marginRight:5}} />
        <Text>{title}</Text>
      </TouchableOpacity>
  )
}

/**
 * submit form
 */
export default class WareHousingSubmit extends Base {
  constructor(props) {
    super(props, {
      codetype: props.formtype == 3 ? 3:2,
      isDelete: false,
      currentCode:'',
      formDetails: [],
      modalVisible3: false,
      modalVisible4: false,
      formno: props.data && props.data.formno,
      productionLine: props.productionLine,
      productionBatch: props.productionBatch || '',
      productionDate: null,
      submitMode: false,
      isLoading: false,
      selectedProduct: null,
      perBoxBottleNumber: '',
      perStackBoxNumber: '',
      keyboardHeight: 0,
      marginTop: 0
    });

    this.formTypeName = this.getFormTypeName();
    this.navItems = {
      rightItem: {},
      title: {
        text: this.formTypeName+'单扫描'
      }
    }

    this.onBarCodeRead = this.onBarCodeRead.bind(this);
    this.onKeyboardChange = this.onKeyboardChange.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    let formDetails = this.props.data.originformdetails || this.props.data.formdetails || [];
    this.setState({formDetails});

    // get products
    this.reloadProducts();

    // 离线模式，更新完成数量；如果只有一个商品，设置为selected
    if (User.offline && formDetails) {
      if  (formDetails.length == 1)
        this.setState({selectedProduct: 0});

      setTimeout( () => {
        this.updateOfflineCount();
      }, 500);
    }

    // set keyboard event
    if (Platform.OS == 'ios') {
      Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange);
    } else {
      Keyboard.addListener('keyboardDidHide', this.onKeyboardChange);
      Keyboard.addListener('keyboardDidShow', this.onKeyboardChange);
    }

    // 读取缓存数据
    if (this.props.formtype == 3&&this.props.cacheItem) {
      let cacheData = this.props.cacheItem.data;
      if (cacheData.production_batch)
        this.setState({productionBatch: cacheData.production_batch});
      if (cacheData.production_line)
        this.setState({productionLine: JSON.parse(cacheData.production_line)});
    }

    // 非离线模式：记录历史数据
    if (!User.offline) {
      setTimeout( () => {
        this.updateCache();
      }, 1000 );
    }

    /*
    setTimeout( () => {
      this.onBarCodeRead({code: 'http://c.zhongjiu.cn/Product/OriginDetail?code=201905220021725797'});
    }, 2000);

    setTimeout( () => {
      this.onBarCodeRead({code: 'http://c.zhongjiu.cn/Product/OriginDetail?code=201905220034632319'});
    }, 4000);*/

  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

    this.unmount = true;

    global.EventEmitter.removeListener("bar-code-read", this.onBarCodeRead);

    // 将上级设置为入库单扫描界面
    if (this.props._parent && this.props._parent.switchSegment)
      this.props._parent.switchSegment(0);

    // set keyboard event
    if (Platform.OS == 'ios') {
      Keyboard.removeListener('keyboardWillChangeFrame', this.onKeyboardChange);
    } else {
      Keyboard.removeListener('keyboardDidHide', this.onKeyboardChange);
      Keyboard.removeListener('keyboardDidShow', this.onKeyboardChange);
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
      case 4:
        formName = "退货";
        break;
    }

    return formName;
  }

  /**
   * 离线模式：更新商品
   */
  reloadProducts() {
    if (this.props.warehousing) {
      this.props.warehousing.getProducts().then( list => {
        this.props.warehousing.products = list;
        let products = [];
        console.log(list);
        list.map( product => {
          products.push({
            productid: product.data.product_id,
            productname: product.data.product,
            plancount: product.data.box_nums,
            actualcount: 0,
            count: 0
          });
        });
        this.setState({formDetails: products});
      });
    }
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
    if (this.unmount || this.isPosting)
      return;

    // 离线模式，商品有多个，则需要选择商品
    let details = this.state.formDetails;
    if (User.offline && !this.state.submitMode && details && details.length > 0 && this.state.selectedProduct === null) {
      Tools.alert('请选择当前扫码的商品');
      return;
    }

    // 离线模式，需要输入对应的箱数
    if (User.offline && !this.state.submitMode) {
      if (this.state.codetype == 3 && !this.state.perStackBoxNumber) {
        Tools.alert('请输入1垛的箱数');
        return;
      } else if (this.state.codetype == 1 && !this.state.perBoxBottleNumber) {
        Tools.alert('请输入1箱的瓶数');
        return;
      }
    }

    let code = data.code.trim();
    code = Tools.getCode(code);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    // stack or box
    if (this.state.codetype == 3) {
      if (!User.checkRule('box', code) && !User.checkRule('stack', code)) {
        Tools.alert('剁码或箱码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
    }
    // box
    else if (this.state.codetype == 2) {
      if (!User.checkRule('box', code)) {
        Tools.alert('箱码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
    }
    // bottle
    else {
      if (!User.checkRule('bottle', code)) {
        Tools.alert('盒码错误', '请重新扫描');
        Vibration.vibrate();
        return;
      }
    }

    this.setState({currentCode: code});
    this.isPosting = true;

    // 离线模式
    if ( User.offline && !this.state.submitMode ) {
      this.submitOffline(code);
    }
    // 在线模式
    else {
      this.submitOnline(code);
    }
  }

  testData(type) {
    let code = 99999999 - parseInt(Math.random() * 10000000);
    //this.onBarCodeRead({code: (type == 'stack' ? '30':'20') + code});
    if (this.state.codetype == 3)
      code = '30' + code;
    else if (this.state.codetype == 2)
      code = '20' + code;
    else
      code = '10' + code;

    this.onBarCodeRead({code: code});

  }

  /**
   * set production line
   */
  setProductionLine(item) {
    this.setState({productionLine: item});
  }

  /**
   * 更新本次完成和累计完成数
   * @param {float} number
   */
  updateOfflineCount(number) {
    console.log('---------- update count');
    let formDetails = this.state.formDetails;
    let product = formDetails[this.state.selectedProduct];

    // 扫码模式
    if (number) {
      if (this.state.isDelete) {
        product.count = product.count - number;
        product.actualcount = product.actualcount - number;
      } else {
        product.count = product.count + number;
        product.actualcount = product.actualcount + number;
      }
      if (product.count < 0)
        product.count = 0;
      if (product.actualcount < 0)
        product.actualcount = 0;

      this.setState({formDetails});
      return;
    }

    // 页面加载，获得完成数
    this.props.warehousing.getCodes().then( codes => {
      codes && codes.map( code => {
        console.log(code.data);
        let productId = code.data.product_id;
        for (let i = 0; i < formDetails.length; i++) {
          let p = formDetails[i];
          if (p.productid == productId) {
            if (code.data.action_type == 1)
              p.actualcount -= code.data.box_number;
            else
              p.actualcount += code.data.box_number;
            break;
          }
        }
      });

      console.log('+++++++++++++++++++');
      console.log(formDetails);
      this.setState({formDetails});
    }).catch( error => {
      console.log(error);
    });
  }

  /**
   * submit offline
   */
  submitOffline(code) {
    let warehousing = this.props.warehousing;

    let number = 1;
    if (this.state.codetype == 3)
      number = parseInt(this.state.perStackBoxNumber);
    else if (this.state.codetype == 1)
      number = 1/( parseInt(this.state.perBoxBottleNumber) || 1 );

    let formDetails = this.state.formDetails;
    let product = formDetails[this.state.selectedProduct];

    let warehousingCode = new WarehousingCode();
    warehousingCode.setData({
      ware_id: warehousing.data.id,
      code_type: this.state.codetype,
      action_type: this.state.isDelete ? 1:0,
      code: code,
      box_number: number,
      product_id: product.productid
    });

    warehousingCode.save().then( result => {
      Tools.toast('离线保存成功', {position:'center'});
      this.isPosting = false;

      // 更新累计完成和本次完成
      this.updateOfflineCount(number);

      setTimeout(() => {
        this.setState({currentCode:'', });
      }, 2000);
    }).catch( error => {
      Tools.alert('离线保存失败了');
      this.isPosting = false;
    });
  }

  /**
   * submit online
   */
  submitOnline(code) {
    console.log({
      test: '>>>>>>>>>>>>>>>',
      formno: this.state.formno,
      codetype: this.state.codetype,
      code: code,
      isdelete: this.state.isDelete ? 1:0
    });

    this.setState({isLoading:true});
    Tools.post({
      url: this.state.codetype == 1 ? Constants.api.submitFormCase:Constants.api.submitForm,
      data: {
        formno: this.state.formno,
        codetype: this.state.codetype,
        code: code,
        isdelete: this.state.isDelete ? 1:0
      },
      debug: true,
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
        setTimeout(() => {
          this.setState({currentCode:''});
        }, 2000);

        this.updateCache();
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.setState({isLoading:false});
      }
    });
  }

  /**
   * 更新缓存
   */
  updateCache( type ) {
    let formNo = this.state.formno;
    let formType = this.props.formtype;
    let products = this.state.formDetails;

    // 检查是否已完成
    /*let hasFinished = true;
    products && products.map( product => {
      if (product.plancount > product.actualcount)
        hasFinished = false;
    });*/

    // 已完成的单号删除
    if (type == 'finished') {
      WarehousingCache.deleteItem({formNo, formType});
      return;
    }

    WarehousingCache.updateItem({
      formNo,
      formType,
      productionLine: this.state.productionLine,
      productionBatch: this.state.productionBatch,
      products
    }).then( (cache) => {

    }).catch( error => {

    });
  }

  /**
   * toggle delete status
   */
  toggleDelete() {
    this.setState({isDelete: !this.state.isDelete});
  }

  /**
   * finish form
   * @param {int} type: 0 显示部分入库和完全入库对话框 1 部分入库 2 完全入库
   */
  finishForm(type) {
    if (this.isPosting)
      return;

    // 生产入库：检查生产线、生产时间、生产批次
    if (this.props.formtype == 3) {
      if (!this.state.productionLine) {
        Tools.alert('请选择生产线');
        return;
      }

      if (!this.state.productionBatch) {
        Tools.alert('请填写生产批次');
        return;
      }

      /*if (!this.state.productionDate) {
        Tools.alert('请选择生产时间');
        return;
      }*/
    }

    // check plan count & actual count
    if (type == 0) {
      let details = this.state.formDetails;
      let hasGreater = false, hasLess = false;
      for (let i = 0; i < details.length; i++) {
        let d = details[i];
        if (d.actualcount > d.plancount) {
          hasGreater = true;
        }

        if (d.actualcount < d.plancount) {
          hasLess = true;
        }
      }

      // 没有超过计划的，但有少于计划的，弹出部分入库对话框
      if (!hasGreater && hasLess) {
        this.setState({modalVisible3: true});
        return;
      }

      // 有超过计划的，弹出详情对话框
      if (hasGreater) {
        this.setState({modalVisible4: true});
        return;
      }
    }

    // 部分入库（生产入库的部分入库需要提交，其他情况直接关闭页面）
    if (type == 1 && this.props.formtype != 3) {
      this.setState({modalVisible3:false, modalVisible4:false});
      // this.navigator.pop();
      // return;
    }
    this.setState({isLoading:true});
    this.isPosting = true;

    let postData = {
      formno: this.state.formno
    };
    if (this.props.formtype == 3) {
      postData.sendorganizationid = this.state.productionLine.id;
      //postData.productiondate = Moment(this.state.productionDate).format("YYYY-MM-DD HH:mm");
      postData.productionbatch = this.state.productionBatch;
      postData.ispartialfinish = type == 1 ? 1:0;
    }

    Tools.post({
      url: this.props.formtype == 3 ? Constants.api.finishProductionForm:Constants.api.finishForm,
      data: postData,
      success: (data) => {
        console.log(data);
        this.setState({isLoading:false,modalVisible3:false, modalVisible4:false});
        this.isPosting = false;

        // 生产入库：部分入库，留在当前界面
        if (this.props.formtype == 3 && type == 1 ) {
          //this.reCreateForm();
          // 将本次完成清零
          let details = this.state.formDetails;
          details && details.map( detail => {
            detail.count = 0;
          });
          this.setState({formDetails: details});

          Tools.toast("部分入库成功");
        }
        // 完成入库，清除缓存列表
        else if (type != 1) {
          this.updateCache( 'finished' );
        }

        this.navigator.pop();

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
   * 根据当前生产入库单的商品信息新建入库单
   */
  reCreateForm() {
    Alert.alert(
        "操作成功，是否重建生产入库单？",
        "",
        [
          {text: '不了'},
          {text: '重建', onPress: () => this.doReCreateForm()}
        ]
    );
  }

  doReCreateForm() {
    if (this.isPosting)
      return;

    // 获得当前表单的商品信息
    let details = this.state.formDetails;
    let formProducts = [];
    for (let i = 0; i < details.length; i++) {
      let detail = details[i];
      formProducts.push({
        productid: detail.productid,
        plancount: detail.plancount
      });
    }

    // check data
    if (formProducts.length < 1) {
      Tools.alert('重建生产入库单失败', '没有获取到商品信息');
      this.navigator.pop();
      return;
    }

    let formInfo = {
      formtype: this.props.formtype
    };

    this.isPosting = true;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.addForm,
      data: {forminfo: formInfo, forminfodtls: formProducts},
      success: (data) => {
        console.log(data);
        this.navigator.replace('submitFormReplace', {
          data,
          formtype: this.props.formtype,
          productionLine: this.state.productionLine,
          productionBatch: this.state.productionBatch,
          _parent: this.props._parent
        });
        this.isPosting = false;
        this.setState({isLoading: false});
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.navigator.pop();
      }
    });
  }

  /**
   * 将离线数据提交到服务器
   */
  async submitData() {
    let warehousing = this.props.warehousing;
    // 创建单号
    let formProducts = [];
    let products = [];
    let isProductValid = true;
    warehousing.products && warehousing.products.map( product => {
      if (!product.data.product_id)
        isProductValid = false;

      formProducts.push({
        ProductId: product.data.product_id,
        PlanCount: product.data.box_nums
      });

      products.push(product.data);
    });

    // 商品信息不完整
    if (!isProductValid) {
      Tools.alert('补充商品信息', '商品信息不完整，需要补充完整才能提交');
      this.navigator.push('addNewForm', {
        warehousing,
        products,
        from: 'submit',
        _parent: this
      });
      return;
    }

    let FormInfo = {
      FormType: warehousing.data.ware_type
    };

    // 出库需要指定接收单位
    if (warehousing.data.ware_type == 2) {
      FormInfo.ReceiveOrganizationId = warehousing.data.receiver_id
    }

    // 如果手工输入了单号
    if (warehousing.data.ware_no.indexOf("LS") != 0) {
      FormInfo.FormNo = warehousing.data.ware_no;
    }

    // get codes
    let codes = await warehousing.getCodes();
    let codesInfo = [];
    if (codes) {
      codes.map( code => {
        codesInfo.push({
          ID: code.data.id,
          CodeType: parseInt(code.data.code_type),
          Code: code.data.code,
          IsDelete: parseInt(code.data.action_type)
        });
      });
    }

    let FormDetails = {
      ProductInfos: formProducts,
      ProCodeInfos: codesInfo
    }

    this.isPosting = true;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.addOfflineForm,
      data: {FormInfo: FormInfo, FormDetail: FormDetails},
      success: (data) => {
        console.log(data);

        // 删除临时数据
        warehousing.delete();

        // 刷新列表
        this.props._parent && this.props._parent.getOfflineLogs && this.props._parent.getOfflineLogs();

        // update form detail in state
        let details = this.state.formDetails;
        if (data.FormDetailResps && data.FormDetailResps.length > 0) {
          for (let i = 0; i < details.length; i++) {
            let detail = details[i];
            for (let n = 0; n < data.FormDetailResps.length; n++) {
              let item = data.FormDetailResps[n];
              if (detail.productid == item.ProductId) {
                // 累计完成大于计划完成，弹出提示
                let newCount = item.ActualCount;
                if (detail.actualcount <= detail.plancount && newCount > detail.plancount) {
                  Tools.alert(
                      '',
                      '当前“' + detail.productname + '”的累计完成箱数已经大于计划箱数，请注意入库商品数量！',
                      [ {text: '我知道了'} ]
                  );
                }
                detail.actualcount = newCount;
                if (!detail.count)
                  detail.count = item.CurCompleteCount;
                else
                  detail.count = detail.count + item.CurCompleteCount;

                break;
              }
            }
            details[i] = detail;
          }
        }

        // 设置当前状态为“完成入库”模式
        this.setState({formDetails: details, submitMode:true, isLoading:false, formno: data.FormNo});
        this.isPosting = false;
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.setState({isLoading: false});
      }
    });

    // 提交操作数据
  }

  /**
   * 设置出入库单号
   */
  setWareNO(newNO) {
    let warehousing = this.props.warehousing;
    if (!warehousing)
      return;

    warehousing.setData({
      ware_no: newNO
    });
    warehousing.save();

    this.setState({formno: newNO});
  }

  /**
   * 出入库单号
   */
  renderWareNO() {
    return (
        <Touchable onPress={() => this.showMark()} style={[styles.row,{justifyContent:'space-between'}]}>
          <View style={[styles.row, {padding:0, paddingVertical:0,margin:0,borderBottomWidth:0}]}>
            <Text style={styles.rowText}>单号</Text>
            <Text style={[styles.rowText, {marginLeft:30}]}>{this.state.formno}</Text>
          </View>
          { User.offline && !this.state.submitMode ?
              <View style={{height: 20, overflow:'hidden'}}>
                <Icons.Ionicons name="ios-arrow-forward" size={24} color='#ddd' style={{marginTop:-2, marginLeft:5}}/>
              </View>
              : null
          }
        </Touchable>
    )
  }

  /**
   * render production info
   */
  renderProductionInfo() {
    if (this.props.formtype != 3)
      return null;

    // 离线模式：提交状态才显示生产线
    if (User.offline && !this.state.submitMode)
      return null;

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
          {/*
        <Touchable onPress={() => this.showDatePicker()} style={[styles.row, {justifyContent:'space-between'}]}>
          <Text style={styles.rowText}>生产时间</Text>
          <View style={styles.rowRight}>
            <Text style={styles.rowText2}>
            { this.state.productionDate ?
              Moment(this.state.productionDate).format("YYYY-MM-DD HH:mm")
              : '请选择生产时间'
            }
            </Text>
            <View style={{height: 20, overflow:'hidden'}}>
              <Icons.Ionicons name="ios-arrow-forward" size={24} color='#ddd' style={{marginTop:-2, marginLeft:5}}/>
            </View>
          </View>
        </Touchable>
        */}
        </View>
    );
  }

  /**
   * show production lines
   */
  showProductionLines() {
    this.navigator.push('productionLines', {_parent: this});
  }

  /**
   * date selected event
   */
  onSelectDate(date) {
    this.setState({productionDate: date});
  }

  /**
   * show date picker
   */
  showDatePicker() {
    DateTimePicker.selectDate(this.onSelectDate.bind(this), "datetime", null, this.state.productionDate || new Date());
  }

  /**
   * show warehousing no. mark
   */
  showMark() {
    if (!User.offline || this.state.submitMode)
      return;

    this.navigator.push('warehousingMark', {_parent: this, formno: this.state.formno});
  }

  setBoxNumber(number, type) {
    if (type == 'stack')
      this.setState({perStackBoxNumber: number});
    else
      this.setState({perBoxBottleNumber: number});
  }

  onTextFocus() {
    this.refs.textInput && this.refs.textInput.measure( (ox, oy, width, height, px, py) => {
      //console.log(ox, oy, width, height, px, py);
      setTimeout(() => {
        let offsetHeight = py + height + 10;
        let maxOffset = Screen.height - this.state.keyboardHeight;
        if (offsetHeight >= maxOffset) {
          this.setState({marginTop: offsetHeight-maxOffset+10});
        }
      }, 200);
    });
  }

  onTextBlur() {

  }

  selectProduct(item, index) {
    this.setState({selectedProduct: index});
  }

  /**
   * set delete mode
   * @param {boolean} status
   */
  setDeleteMode(status) {
    if (!status) {
      this.setState({isDelete: status});
      return;
    }

    // 如果是剔除模式，并且当前累计完成数是0，则提示用户
    let details = this.state.formDetails;

    if (!details || details.length == 0) {
      Tools.alert('当前完成数量为0，无法剔除');
      return;
    }

    // 离线模式：查找对应的商品的完成数量
    if (User.offline && !this.state.submitMode && details && details.length > 0 && this.state.selectedProduct === null) {
      Tools.alert('请选择当前扫码的商品');
      return;
    }

    if (User.offline && !this.state.submitMode) {
      let product = details[this.state.selectedProduct];
      if (product.actualcount <= 0) {
        Tools.alert('当前完成数量为0，无法剔除');
        return;
      }
    } else {
      let canDelete = false;
      for (let i = 0; i < details.length; i++) {
        let product = details[i];
        if (product.actualcount > 0) {
          canDelete = true;
          break;
        }
      }

      if (!canDelete) {
        Tools.alert('当前完成数量为0，无法剔除');
        return;
      }
    }

    this.setState({isDelete: status});
  }

  /**
   * render modal 4
   */
  renderModal4() {
    if (!this.state.modalVisible4)
      return;

    let details = this.state.formDetails;

    /*details = [
      {productname: 'test', plancount:0, count:0, actualcount:0}
    ];*/

    let views = details.map( (v, k) => {
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
          <View style={styles.alertProductItem}>
            <View style={[styles.row2, {backgroundColor:'#f4f5f6', padding:10, borderBottomWidth:2, borderBottomColor:'#fff'}]} key={"product:"+this.state.idx + ":" + k}>
              <View style={styles.column1}>
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
            </View>
          </View>
      );
    } )

    return (
        <View style={styles.mask}>
          <View style={[styles.maskContent, {alignItems:'center', justifyContent:'center', paddingTop:0, paddingBottom:0}]}>
            <Text style={[styles.maskText, {marginBottom:0, paddingVertical:10}]}>{this.formTypeName}详情</Text>
            {views}
            <View style={{marginVertical:10, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
              <Button title='返回编辑' onPress={() => this.setState({modalVisible4:false})} style={{width:120, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
              <Button title={"确认" + this.formTypeName} onPress={() => this.finishForm(2)} style={{width:120}}/>
            </View>
          </View>
        </View>
    );
  }

  renderBoxNumbers() {
    if ( !User.offline || this.state.submitMode || this.state.codetype == 2)
      return;

    let number = 0;
    // 按垛
    if (this.state.codetype == 3) {
      number = this.state.perStackBoxNumber + '';
      return (
          <View style={styles.row2}>
            <View style={[styles.row]}>
              <Text style={styles.rowText}>1垛 =</Text>
              <TextInput
                  ref="textInput"
                  style={[styles.textInput, {marginLeft:10, width: Screen.width-150}]}
                  underlineColorAndroid='transparent'
                  placeholder="请输入箱数"
                  onChangeText={(text) => this.setBoxNumber(text, 'stack')}
                  value={number}
                  keyboardType='numeric'
                  onFocus={() => this.onTextFocus()}
                  onBlur={() => this.onTextBlur()}
              />
              <Text style={styles.rowText}> 箱</Text>
            </View>
          </View>
      );
      // 按盒
    } else if (this.state.codetype == 1) {
      number = this.state.perBoxBottleNumber;

      return (
          <View style={styles.row2}>
            <View style={[styles.row]}>
              <Text style={styles.rowText}>1箱 =</Text>
              <TextInput
                  ref="textInput"
                  style={[styles.textInput, {marginLeft:10, width: Screen.width-150}]}
                  underlineColorAndroid='transparent'
                  placeholder="请输入瓶数"
                  onChangeText={(text) => this.setBoxNumber(text, 'bottle')}
                  value={number}
                  keyboardType='numeric'
                  onFocus={() => this.onTextFocus()}
                  onBlur={() => this.onTextBlur()}
              />
              <Text style={styles.rowText}> 瓶</Text>
            </View>
          </View>
      );
    }


  }

  renderCheckBox(item, index) {
    let details = this.state.formDetails;

    if (!User.offline || !details || details.length <= 1)
      return;

    let selected = this.state.selectedProduct == index;

    if (!selected) {
      return (<View style={styles.checkBox}></View>);
    }
    return (
        <View style={[styles.checkBox, {borderColor: 'blue'}]}>
          <Icons.Ionicons name="ios-checkmark-outline" size={20} color='blue'/>
        </View>
    );
  }

  renderButtons() {
    let finishButton;
    if ( User.offline && !this.state.submitMode ) {
      finishButton = (
          <Button title={"提交"} onPress={() => this.submitData()} style={{width:120}}/>
      );
    }
    // 出库类型并且表单状态是2（已完成），按钮不可点击
    else if (this.props.formtype == 2 && this.props.formstate == 2) {
      finishButton = (
          <Button title={"完成" + this.formTypeName} onPress={() => { Tools.toast('该出库单已完成') } } style={{width:120, backgroundColor: '#ccc'}}/>
      );
    }
    else {
      finishButton = (
          <Button title={"完成" + this.formTypeName} onPress={() => this.finishForm(0)} style={{width:120}}/>
      );
    }

    return (
        <View style={{marginTop:20, marginBottom: 30, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          {finishButton}
          <Button title="返回" onPress={() => this.navigator.pop()} style={{width:120, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
        </View>
    );
  }

  /**
   * render view
   */
  getView() {
    let data = this.props.data;

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
      )
    });

    let codeString;
    switch (this.state.codetype) {
      case 1:
        codeString = '盒码';
        break;
      case 2:
        codeString = '箱码';
        break;
      case 3:
        codeString = '垛码\n或箱码';
        break;
      default:
    }

    return (
        <View style={[styles.container, {marginTop: 20 - this.state.marginTop, borderTopWidth:1, borderTopColor: '#ddd'}]}>
          <ScrollView>

            {this.renderWareNO()}

            {this.renderProductionInfo()}

            <View>
              {productsView}
            </View>
            <View style={[styles.segmentBox, {marginTop:0}]}>
              {
                this.props.formtype == 4? null :
                    <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({codetype:3})} style={[styles.segmentItem2, this.state.codetype == 3 ? styles.segmentItemActive:null]}>
                      <Text style={[styles.segmentText, this.state.codetype == 3 ? styles.segmentTextActive:null]}>按垛</Text>
                    </TouchableOpacity>
              }
              <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({codetype:2})} style={[this.props.formtype == 4?styles.segmentItem:styles.segmentItem2, this.state.codetype == 2 ? styles.segmentItemActive:null]}>
                <Text style={[styles.segmentText, this.state.codetype == 2 ? styles.segmentTextActive:null]}>按箱</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({codetype:1})} style={[this.props.formtype == 4?styles.segmentItem:styles.segmentItem2, this.state.codetype == 1 ? styles.segmentItemActive:null]}>
                <Text style={[styles.segmentText, this.state.codetype == 1 ? styles.segmentTextActive:null]}>按盒</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row2}>
              <View style={[styles.row, {borderTopWidth:1, borderTopColor: '#ddd', borderBottomWidth:0}]}>
                <Text style={[styles.rowText, {textAlign:'center', fontSize: this.state.codetype == 3 ? 12:14}]}>{codeString}</Text>
                <QRCodeText style={[styles.textInput, {width:Screen.width-(this.state.codetype == 3 ? 158:150), marginLeft:10, marginRight:10}]} parent={this}>{Tools.parseCode(this.state.currentCode)}</QRCodeText>
                <Text style={[styles.rowText, {fontSize:14}]}>剔除 </Text>
                <View style={{transform: [{scale:0.8}]}}>
                  <Switch
                      onTintColor={Constants.color.blue}
                      onValueChange={(value) => this.setDeleteMode(value)}
                      thumbTintColor={Platform.OS == 'android' ? '#fff':null}
                      tintColor="#ccc"
                      value={this.state.isDelete}/>
                </View>
              </View>
              <View style={{alignItems:'flex-start', paddingHorizontal:10, marginBottom:10}}><Text style={{fontSize:12, color:'#666'}}>开启剔除开关，扫码可以取消该箱/垛的{this.formTypeName}，如果整垛50箱需{this.formTypeName}48箱，可以按照整垛{this.formTypeName}后，剔除2箱{this.formTypeName}以便简化操作。</Text></View>
            </View>
            {this.renderBoxNumbers()}
            {this.renderButtons()}
          </ScrollView>
          {
            this.state.modalVisible3 ?
                <TouchableWithoutFeedback onPress={() => this.setState({modalVisible3:false})}>
                  <View style={styles.mask}>

                    <View style={[styles.maskContent, {alignItems:'center', justifyContent:'center'}]}>
                      <Text style={[styles.maskText, {marginBottom:0}]}>完成箱数小于计划箱数，请选择</Text>
                      <View style={{marginVertical:10, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
                        <Button title={"部分" + this.formTypeName} onPress={() => this.finishForm(1)} style={{width:120}}/>
                        {/*
                  <Button title={"全部" + this.formTypeName} onPress={() => this.finishForm(2)} style={{width:120}}/>
                  */}
                      </View>
                      <View>
                        <Text style={{fontSize:12, color:'#aaa'}}>如果{this.formTypeName}未完成，请选择部分{this.formTypeName}，点击全部{this.formTypeName}将无法再增加或剔除</Text>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                : null
          }
          {this.renderModal4()}
        </View>
    )
  }
}
