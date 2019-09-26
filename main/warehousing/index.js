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
  Image,
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
  Colors
} from 'components';

import {User, WarehousingCache, Product} from 'models';
import {Scan} from 'images';
import AddForm from './add';
// offline logs list
import OfflineList from './offline-list';

export default class WareHousingIndex extends Base {
  constructor(props) {
    super(props, {
      formNoCode:'',
      selectedSegment: User.offline ? 1:0,
      caches: [],
      candidates: [],
      selectedCandidate: null,
      productionLine: null,
      productionBatch: '',
      formNoOffsetY: 0,
      historyOffsetY: 285
    });

    this.formTypeName = this.getFormTypeName();
    this.navItems = {
      rightItem: {},
      title: {
        text: this.formTypeName
      }
    }

    // 判断是否在当前页面，避免在出入库单操作扫码时重复处理
    this.focus = true;

    this.onBarCodeRead = this.onBarCodeRead.bind(this);

  }

  componentDidMount() {
    super.componentDidMount();

    this.getCache();
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
   * 获得缓存
   */
  getCache() {
    WarehousingCache.getItems({formType: this.props.formtype}).then( list => {
      console.log(list);
      this.setState({caches: list});
    }).catch( error => {
      console.log(error);
    });
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
   * 设置当前页面是否focus
   */
  setFocus(status) {
    this.focus = status;
  }

  onFocus() {
    this.focus = true;

    this.getCache();
    global.EventEmitter.addListener("bar-code-read", this.onBarCodeRead);
  }

  onBlur() {
    this.focus = false;
    global.EventEmitter.removeListener("bar-code-read", this.onBarCodeRead);
  }

  /**
   * on barcode read
   */
  onBarCodeRead(data) {
    if (this.unmount)
      return;

    let code = data.code.trim();
    code = Tools.getCode(code);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    if (this.props.formtype == 1 && !(code+'').startsWith('1') ) {
      Tools.alert("扫码错误", "入库单号不正确");
      Vibration.vibrate();
      return;
    }

    /*if (this.props.formtype == 2 && !(code+'').startsWith('2') ) {
      Tools.alert("扫码错误", "出库单号不正确");
      Vibration.vibrate();
      return;
    }*/

    this.setState({formNoCode: code});
  }

  preFormInfo() {
    // 模糊搜索结果模式：首先更新表单信息
    if (this.state.selectedCandidate) {
      // 检查生产线和生成批次信息
      let productionLine = this.state.productionLine;
      let productionBatch = this.state.productionBatch;
      if (!productionLine || !productionLine.id) {
        Tools.alert("请选择生成线");
        return;
      }
      if (!productionBatch) {
        Tools.alert("请输入生产批次");
        return;
      }

      // 保存
      this.saveFormInfo(productionLine, productionBatch);
    } else {
      this.getFormInfo();
    }
  }

  saveFormInfo(productionLine, productionBatch) {
    let selectedCandidate = this.state.selectedCandidate;
    let formNo = selectedCandidate.formno;

    console.log({
      FormNo: formNo,
      SendOrganization: productionLine.id,
      ProductLot: productionBatch
    })

    Tools.post({
      url: Constants.api.saveFormInfo,
      data: {
        FormNo: formNo,
        SendOrganization: productionLine.id,
        ProductLot: productionBatch
      },
      success: (data) => {
        this.getFormInfo({
          data: {
            ware_no: formNo
          }
        });
      },
      error: (data) => {

      }
    });
  }

  /**
   * get form info
   */
  getFormInfo(item) {
    Keyboard.dismiss();
    if (this.isPosting)
      return;

    //Tools.alert(' ', JSON.stringify({formno: this.state.formNoCode, formtype: this.props.formtype}));
    let formno = item && item.data.ware_no || this.state.formNoCode;
    if (!formno) {
      Tools.alert("提示信息", "请输入"+this.formTypeName+"单号");
      return;
    }
    //formno = '21272678036';

    if (this.props.formtype == 1 && !(formno+'').startsWith('1') ) {
      Tools.alert("入库单错误", "入库单号不正确");
      Vibration.vibrate();
      return;
    }

    /*if (this.props.formtype == 2 && !(formno+'').startsWith('2') ) {
      Tools.alert("出库单错误", "出库单号不正确");
      Vibration.vibrate();
      return;
    }*/

    this.isPosting = true;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.getFormInfo,
      data: {formno, formtype: this.props.formtype},
      success: (data) => {
        // 如果需要设置接收单位
        if (data.isneedorganization) {
          this.navigator.push('setReceiver', {
            data, 
            formtype: this.props.formtype, 
            _parent: this
          });
          this.setState({isLoading:false});
          this.isPosting = false;
          this.focus = false;
          return;
        }
        // 生产入库转到组垛界面
        if (this.props.formtype == 3) {
          this.getStackStandard(data, item);
        } else {
          this.navigator.push('submitForm', {
            data, 
            formtype: this.props.formtype, 
            _parent: this,
            cacheItem: item,
            formstate: data && data.formstate
          });
        }
        this.setState({isLoading:false});
        this.isPosting = false;
        this.focus = false;
      },
      error: (data) => {
        this.setState({isLoading:false});
        this.isPosting = false;
      }
    });
  }

  /**
   * 获取商品垛规
   */
  getStackStandard(data, item) {
    if (item && item.data && item.data.boxes_per_stack) {
      this.navigator.push('associateStack', {
        data,
        formtype: this.props.formtype,
        productionLine: {id: data.sendorganizationid, name: data.sendorganizationName},
        productionBatch: data.productionbatch,
        stacks: item && item.data && item.data.stacks || 0,
        formstate: data && data.formstate,
        stackstandard: item && item.data && item.data.boxes_per_stack
      });
      return;
    }

    let details = data.originformdetails;
    if (!details || details.length == 0) {
      this.navigator.push('associateStack', {
        data,
        formtype: this.props.formtype,
        productionLine: {id: data.sendorganizationid, name: data.sendorganizationName},
        productionBatch: data.productionbatch,
        stacks: 0,
        formstate: data && data.formstate,
        stackstandard: ''
      });
      return;
    }

    let product = details[0];
    Product.getProductById(product.productid).then( item => {
      this.navigator.push('associateStack', {
        data,
        formtype: this.props.formtype,
        productionLine: {id: data.sendorganizationid, name: data.sendorganizationName},
        productionBatch: data.productionbatch,
        stacks: 0,
        formstate: data && data.formstate,
        stackstandard: item && item.data && item.data.stackstandard
      });
    }).catch( error => {
      this.navigator.push('associateStack', {
        data,
        formtype: this.props.formtype,
        productionLine: {id: data.sendorganizationid, name: data.sendorganizationName},
        productionBatch: data.productionbatch,
        stacks: 0,
        formstate: data && data.formstate,
        stackstandard: ''
      });
    });
  }

  /**
   * add new form
   */
  addNewForm() {
    this.navigator.push('addNewForm', {formtype: this.props.formtype});
  }

  /**
   * show scan
   */
  showScan() {
    this.navigator.push('qrScan', {_parent: this});
  }

  /**
   * set qr scan result
   */
  setScanResult(code) {
    this.onBarCodeRead({code});
  }

  showForm(item) {
    this.getFormInfo(item);
  }

  clearCaches() {
    Alert.alert(
      '清空历史记录',
      '确信清空历史记录吗？',
      [
        {text: '取消'},
        {text: '确定', onPress: () => this.doClearCaches()}
      ]
    );
  }

  doClearCaches() {
    WarehousingCache.clear({formType: this.props.formtype});

    setTimeout( () => {
      this.getCache();
    }, 500);
  }

  /**
   * 删除
   */
  deleteItem(item) {
    //console.log(item);
    Alert.alert(
      '删除确认',
      '确信删除该历史记录吗？',
      [
        {text: '取消'},
        {text: '确定', onPress: () => this.doDeleteItem(item)}
      ]
    );
  }

  doDeleteItem(item) {
    item.delete();

    setTimeout( () => {
      this.getCache();
    }, 200);
  }

  setFormNo(text) {
    let formNo = text && text.trim() || '';
    this.setState({formNoCode: formNo});

    if (this.props.formtype != 3)
      return;

    // 模糊搜索
    if (formNo.length > 5) {
      this.searchForm(formNo);
    } else {
      this.setState({
        candidates: [],
        showCandidates: false,
        selectedCandidate: null,
        productionLine: null,
        productionBatch: ''
      });
    }
  }

  searchForm(formNo) {
    Tools.post({
      url: Constants.api.getFormInfo2,
      data: {formno: formNo},
      alertOnError:false,
      success: (data) => {
        console.log(data);

        this.formNoRef && this.formNoRef.measure( (dx, dy, w, h, ox, oy) => {
          this.setState({formNoOffsetY: dy + h});
          console.log(dy + h);
        });
        this.setState({
          candidates: data && data.FormList, 
          showCandidates: true
        });
      },
      error: (data) => {
        console.log(data);
        this.setState({candidates: [], showCandidates: false});
      }
    });
  }

  selectCandidate(item) {
    this.setState({
      selectedCandidate: item, 
      productionLine: {id: item && item.sendorganizationid, name: item.sendorganizationName},
      productionBatch: item.productionbatch,
      showCandidates: false
    });

    this.getHistoryOffsetY();
  }

  getHistoryOffsetY() {
    setTimeout( () => {
      this.historyHeaderRef && this.historyHeaderRef.measure( (dx, dy, w, h, ox, oy) => {
        this.setState({historyOffsetY: oy + h});
      });
    }, 1000);
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

  onTextInputFocus() {
    this.setState({showCandidates: true});
  }

  onTextInputBlur() {
    this.setState({showCandidates: false});
  }

  removeSelectedCandidate() {
    this.setState({
      selectedCandidate: null,
      productionLine: null,
      productionBatch: '',
      historyOffsetY: 285
    });
  }

  renderCacheItem(rowData) {
    let item = rowData.item;
    let index = rowData.index;

    let products = item.data.products && JSON.parse(item.data.products);
    let productViews = products && products.map( product => {
      return (
        <View style={itemStyles.container} key={"item" + product.productid}>
          <Text style={itemStyles.productName} numberOfLines={1}>{product.productname}</Text>
          <View style={itemStyles.productNumbers}>
            <Text style={itemStyles.planText}>计划    <Text style={itemStyles.planNumber}>{product.plancount}</Text></Text>
            <Text style={itemStyles.planText}>上次完成    <Text style={itemStyles.planNumber}>{product.account || 0}</Text></Text>
            <Text style={itemStyles.planText}>累计    <Text style={itemStyles.planNumber}>{product.actualcount}</Text></Text>
          </View>
        </View>
      );
    });

    return (
      <Touchable onLongPress={() => this.deleteItem(item)} onPress={() => this.showForm(item)}>
        <View style={[styles.offlineItemBox, {marginTop: index == 0 ? 6*Constants.scaleRate:3*Constants.scaleRate}]}>
          <View style={styles.offlineItemHeader}>
            <Text style={styles.offlineItemHeaderText} numberOfLines={1}>单号 {item.data.ware_no}</Text>
            <Text style={styles.offlineItemDateText}>{item.getCreationDate().substring(0, 16)}</Text>
          </View>
        </View>
        {productViews}
      </Touchable>
    );
  }

  renderCaches() {
    if (!this.state.caches || this.state.caches.length == 0)
      return;
    
    return (
      <View style={styles.listContainer}>
        <View style={itemStyles.listHeader} ref={(ref) => this.historyHeaderRef = ref}>
          <Text style={[itemStyles.listHeaderText, {color: '#aaa'}]}>历史记录</Text>
          <Touchable onPress={() => this.clearCaches()} style={styles.listHeaderRight}>
            <Text style={itemStyles.listHeaderText}>清空记录</Text>
          </Touchable>
        </View>
        <View style={{height: Screen.height-this.state.historyOffsetY}}>
          <FlatList
            data={this.state.caches}
            renderItem={this.renderCacheItem.bind(this)}
          />
        </View>
      </View>
    );
  }

  renderSearchCandidates() {
    let candidates = this.state.candidates;
    if (!this.state.showCandidates || !candidates || candidates.length == 0)
      return;

    let views = this.state.candidates && this.state.candidates.map( item => {
      return (
        <Touchable 
          onPress={() => this.selectCandidate(item)} 
          style={itemStyles.candidateItemBox} 
          key={"item" + item.formno}>
          <View style={{width: Screen.width-100}}>
            <Text style={{fontSize: 14, color: '#000'}} numberOfLines={1}>{item.formno}</Text>
          </View>
        </Touchable>
      );
    });

    return (
      <View style={[itemStyles.candidatesBox, {top: this.state.formNoOffsetY}]}>
        {views}
      </View>
    );
  }

  renderProductInfo() {
    let selectedItem = this.state.selectedCandidate;
    let details = selectedItem && selectedItem.originformdetails;
    if (!details || details.length == 0)
      return;

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
        <View style={[styles.row2, {backgroundColor:'#f4f5f6', padding:10, borderBottomWidth:2, borderBottomColor:'#fff'}]} key={"product:"+this.state.idx + ":" + k}>
          <View style={[styles.column1, {flexDirection:'row', alignItems:'center'}]}>
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
      );
    });

    return (
      <View>
        <View style={{flexDirection: 'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#fff', padding:8}}>
          <Text style={{fontSize: 14, color: '#000'}}>单号：{selectedItem.formno}</Text>
          <Touchable onPress={() => this.removeSelectedCandidate()}>
            <Icons.Ionicons name="md-close" size={20} color="#ccc"/>
          </Touchable>
        </View>
        {productsView}
      </View>
    );
  }

  renderBatchLine() {
    let selectedCandidate = this.state.selectedCandidate;
    if (!selectedCandidate)
      return;

    let productionLine = this.state.productionLine;

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
              { productionLine && productionLine.id ? 
                productionLine.name
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
   * render segment 0: scan
   */
  renderScan() {
    let textInputWidth = Screen.width-150;
    if (this.props.formtype == 3)
      textInputWidth -= 30;

    let marginTop = Constants.isAndroid && Platform.Version < 22 ? -6:-14;

    return (
      <View>
        <View style={[styles.row, {paddingVertical:8}]} ref={(ref) => this.formNoRef = ref}>
          <Text style={styles.rowText}>{this.formTypeName}单号</Text>
          <View style={[styles.textInput, {height: 30, padding:0, width: textInputWidth, marginLeft:10}]}>
            <TextInput
              style={{height: 40, marginTop, width: textInputWidth}}
              underlineColorAndroid='transparent'
              placeholder="请输入单号"
              onChangeText={(text) => this.setFormNo(text)}
              value={this.state.formNoCode}
              keyboardType='numeric'
              onFocus={() => this.onTextInputFocus()}
              onBlur={() => this.onTextInputBlur()}
            />
          </View>
          <TouchableOpacity onPress={() => this.showScan()} style={{ alignItems: 'center', marginLeft: 20}}>
            <Image source={{uri: Scan.image}} style={{width:16, height:16, marginBottom:3}} />
            <Text style={{ fontSize: 10, color: Constants.color.blue }}>扫一扫</Text>
          </TouchableOpacity>
        </View>

        {this.renderProductInfo()}

        {this.renderBatchLine()}

        <View style={{marginTop:20, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          <Button title="提交" onPress={() => this.preFormInfo()} style={{width:120}}/>
          <Button title="返回" onPress={() => this.navigator.pop()} style={{width:120, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
        </View>

        {this.renderCaches()}
        {this.renderSearchCandidates()}

      </View>
    )
  }

  /**
   * render segment 1: add
   */
  renderAdd() {
    return (
      <AddForm formtype={this.props.formtype} parent={this}/>
    )
  }

  /**
   * switch segment
   */
  switchSegment(idx, focus) {
    // 离线模式
    if (idx == 0 && User.offline) {
      idx = 2;
    }

    this.setState({selectedSegment: idx});
    if (idx != 0)
      this.focus = false;
    else if (idx == 0)
      this.focus = true;

    if (focus != undefined)
      this.focus = focus;
  }

  /**
   * render segment body
   */
  renderSegmentBody() {
    switch(this.state.selectedSegment) {
      case 0:
        return this.renderScan();
      case 1:
        return this.renderAdd();
      case 2:
        return this.renderOfflineList('segment');
    }
    
  }

  /**
   * render offline list
   */
  renderOfflineList(from) {
    return (<OfflineList ref="offlineList" from={from} type={this.props.formtype}/>);
  }

  /**
   * render view
   */
  getView() {
    let modalHideModeStyle;
    if (this.state.modalHideMode)
      modalHideModeStyle = {backgroundColor:'transparent', marginTop:1000};

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View style={[styles.segmentBox, {borderBottomWidth:1, borderBottomColor:'#ddd'}]}>
            {User.offline ? null:              
              <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(0)} style={[styles.segmentItem, this.state.selectedSegment == 0 ? styles.segmentItemActive:null]}>
                <Text style={[styles.segmentText, this.state.selectedSegment == 0 ? styles.segmentTextActive:null]}>{this.formTypeName}单扫描</Text>
              </TouchableOpacity>
            }
            <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(1)} style={[styles.segmentItem, this.state.selectedSegment == 1 ? styles.segmentItemActive:null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 1 ? styles.segmentTextActive:null]}>新增{this.formTypeName}单</Text>
            </TouchableOpacity>
            { User.offline ? 
              <TouchableOpacity activeOpacity={0.8} onPress={() => this.switchSegment(2)} style={[styles.segmentItem, this.state.selectedSegment == 2 ? styles.segmentItemActive : null]}>
                <Text style={[styles.segmentText, this.state.selectedSegment == 2 ? styles.segmentTextActive : null]}>待提交{this.formTypeName}单</Text>
              </TouchableOpacity>
              : null
            }
          </View>

          {this.renderSegmentBody()}

        </View>
      </TouchableWithoutFeedback>
    );
  }

  /**
   * render view
   */
  /*getView() {
    let formType = this.props.formtype == 1 ? '入':'出';
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text>{formType}库单号：</Text>
          <QRCodeText style={[styles.textInput, {width:200}]} parent={this}>{this.state.formNoCode}</QRCodeText>
        </View>
        <View style={styles.row}>
          <Button title="确定" onPress={() => this.getFormInfo()} style={{width:90}}/>
          <Button title={"新增" + formType + "库单"} onPress={() => this.addNewForm()} style={{width:90}}/>
          <Button title="返回" onPress={() => this.navigator.pop()} style={{width:90, backgroundColor:'#fff'}}/>
        </View>

      </View>
    )
  }*/
}

/**
 * styles
 */
const itemStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 3,
    borderBottomColor:'#fff',
    padding: 6 * Constants.scaleRate
  },
  productName: {
    fontSize: 16,
    color: '#555',
  },
  planText: {
    marginTop: 6 * Constants.scaleRate,
    fontSize: 16,
    color: '#999',
    marginRight:10
  },
  planNumber: {
    color: Constants.color.black4
  },
  productNumbers: {
    flexDirection:'row'
  },
  listHeader: {
    paddingTop: 20,
    paddingHorizontal:10,
    flexDirection:'row',
    justifyContent:'space-between',
    backgroundColor:'transparent'
  },
  listHeaderText: {
    fontSize:14,
    color: Colors.blue
  },
  candidatesBox: {
    position:'absolute', 
    left:0, 
    width: Screen.width, 
    backgroundColor:'#fff'
  },
  candidateItemBox: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    height: 53,
    alignItems: 'center',
    paddingLeft: 15,
    justifyContent:'space-between', 
    backgroundColor:'#fff'
  },
  productItem: {
    padding: 10,
    paddingVertical: 10,
    borderTopWidth:1,
    borderTopColor: '#ddd',
    backgroundColor:'#fff',
    flexDirection:'row'
  },
  productImage: {
    width: 60,
    height:60,
    borderWidth:1,
    borderColor:'#f0f0f0',
    marginRight:10
  },
  productName: {
    fontSize: 16,
    fontWeight: Constants.fonts.bold2,
    color: '#333'
  },
});
