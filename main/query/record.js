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
  Touchable,
  DateTimePicker,
  Colors
} from 'components';

import {User, BoxLog, } from 'models';
import Product from '../products'
import {Scan} from 'images';


export default class Record extends Base {
  constructor(props) {
    super(props, {
      comeSelectedProduct:null,
      goSelectedProduct:null,
      selectedSegment:0,
      comeStartDate:null,
      comeEndDate:null,
      goStartDate:null,
      goEndDate:null,
      isStart:true,
      comeReceiver: {},
      goReceiver: {},
      type:"出库",
      comeCode:"",
      goCode:"",
      showComeList:[],
      showGoList:[],

    });

    this.navItems = {
      rightItem: {},
      title: {
        text: '记录查询'
      }
    }
  }

  componentDidMount() {
    super.componentDidMount();
    let now = new Date()
    let startDate = new Date()
    let comeEndDate =  this.formatDate(now)
    startDate.setDate(now.getDate() - 30);
    let comeStartDate = this.formatDate(startDate)
    this.setState({
      comeStartDate:comeStartDate,
      comeEndDate:comeEndDate,
      goStartDate:comeStartDate,
      goEndDate:comeEndDate
    })
  }


  //日期转化
  formatDate=(date)=> {
    let myyear = date.getFullYear();
    let mymonth = date.getMonth()+1;
    let myweekday = date.getDate();

    if(mymonth < 10){
      mymonth = "0" + mymonth;
    }
    if(myweekday < 10){
      myweekday = "0" + myweekday;
    }
    return (myyear+"-"+mymonth + "-" + myweekday);
  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();
  }

  /**
   * switch segment
   */
  switchSegment=(idx)=> {
    this.setState({
      selectedSegment: idx,
      type:idx == 0?"出库":"入库"
    });
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

  /**
   * on barcode read
   */
  onBarCodeRead(data) {
    let code = data.code.trim();
    code = Tools.getCode(code);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    /*if (this.props.formtype == 2 && !(code+'').startsWith('2') ) {
      Tools.alert("扫码错误", "出库单号不正确");
      Vibration.vibrate();
      return;
    }*/
    if(this.state.selectedSegment == 0){
      this.setState({comeCode: code});
    }else{
      this.setState({goCode: code});
    }
  }




  preFormInfo(){
    let receiver = this.state.selectedSegment == 0?this.state.comeReceiver:this.state.goReceiver
    let FormType = this.state.selectedSegment == 0?2:1
    let FormNo = this.state.selectedSegment == 0?this.state.comeCode:this.state.goCode;
    let OrganizationId = receiver.id;
    let ProductId
    if(this.state.comeSelectedProduct || this.state.goSelectedProduct){
      ProductId = this.state.selectedSegment == 0?this.state.comeSelectedProduct.product_id:this.state.goSelectedProduct.product_id;
    }
    let StartTime = this.state.selectedSegment == 0?this.state.comeStartDate:this.state.goStartDate
    let EndTime = this.state.selectedSegment == 0?this.state.comeEndDate:this.state.goEndDate
    let PageSize = 100;
    let PageIndex = 1;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.getFormList,
      data: {FormType,FormNo,OrganizationId,ProductId,StartTime,EndTime,PageSize,PageIndex},
      alertOnError:false,
      success: (data) => {
        if(data.FormList.length == 0){
          Tools.toast("暂无数据")
          if(this.state.selectedSegment == 0){
            this.setState({showComeList:[],isLoading:false})
          }else{
            this.setState({showGoList:[],isLoading:false})
          }
        }else{
          if(this.state.selectedSegment == 0){
            this.setState({showComeList:data.FormList,isLoading:false})
          }else{
            this.setState({showGoList:data.FormList,isLoading:false})
          }
        }
      },
      error: (data) => {
        console.log(data);
      }
    });
  }

  showList(){
    let showList = this.state.selectedSegment == 0?this.state.showComeList:this.state.showGoList
    if(!showList || showList.length == 0)
      return;

    return(
        <View style={styles.listContainer}>
          <View style={itemStyles.listHeader} ref={(ref) => this.historyHeaderRef = ref}>
            <Text style={[itemStyles.listHeaderText, {color: '#aaa'}]}>{this.state.type}记录</Text>
          </View>
          <View style={{height: Screen.height-this.state.historyOffsetY}}>
            <FlatList
                data={showList}
                renderItem={this.renderCacheItem.bind(this)}
            />
          </View>
        </View>
    )
  }


  renderCacheItem(rowData) {
    let item = rowData.item;
    let index = rowData.index;

    let products = item.ProductList
    let productViews = products && products.map( product => {
      return (
          <View style={itemStyles.box} key={"item" + index}>
            <Text style={itemStyles.productName} numberOfLines={1}>{product.ProductMame}</Text>
            <View style={itemStyles.productNumbers}>
              <Text style={itemStyles.planText}>{this.state.selectedSegment == 0 ? '接收':'发出'}单位    <Text style={itemStyles.planNumber}>
                {this.state.selectedSegment == 0 ?item.ReceiveOrganizationName:item.SendOrganizationName}</Text></Text>
              <Text style={itemStyles.planText}>操作人    <Text style={itemStyles.planNumber}>{item.Operator}</Text></Text>
            </View>
            <View style={itemStyles.productNumbers}>
              <Text style={itemStyles.planText}>应收数量     <Text style={itemStyles.planNumber}>{product.PlanCount}</Text></Text>
              <Text style={itemStyles.planText}>实收数量     <Text style={itemStyles.planNumber}>{product.ActualCount}</Text></Text></View>
          </View>
      );
    });

    return (
        <View key={index}>
          <View style={[styles.offlineItemBox, {marginTop: index == 0 ? 6*Constants.scaleRate:3*Constants.scaleRate}]}>
            <View style={styles.offlineItemHeader}>
              <Text style={styles.offlineItemHeaderText} numberOfLines={1}>单号 {item.FormNo}</Text>
              <Text style={styles.offlineItemDateText}>{item.CreateTime}</Text>
            </View>
          </View>
          {productViews}
        </View>
    );
  }

  /**
   * render segment 0: scan
   */
  renderScan() {
    let textInputWidth = Screen.width-150;

    let marginTop = Constants.isAndroid && Platform.Version < 22 ? -6:-14;

    return (
        <View>
          <View style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd',}]} ref={(ref) => this.formNoRef = ref}>
            <Text style={styles.rowText}>{this.state.type}单号</Text>
            <View style={[styles.textInput, {height: 30, padding:0, width: textInputWidth, marginLeft:10}]}>
              <TextInput
                  style={{height: 40, marginTop, width: textInputWidth}}
                  underlineColorAndroid='transparent'
                  placeholder="请输入单号"
                  onChangeText={(text) => this.setFormNo(text)}
                  value={this.state.selectedSegment == 0?this.state.comeCode:this.state.goCode}
                  keyboardType='numeric'/>
            </View>
            <TouchableOpacity onPress={() => this.showScan()} style={{ alignItems: 'center', marginLeft: 20}}>
              <Image source={{uri: Scan.image}} style={{width:16, height:16, marginBottom:3}} />
              <Text style={{ fontSize: 10, color: Constants.color.blue }}>扫一扫</Text>
            </TouchableOpacity>
          </View>

          <View style={{marginTop:20, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
            <Button title="提交" onPress={() => this.preFormInfo()} style={{width:120}}/>
            <Button title="返回" onPress={() => this.navigator.pop()} style={{width:120, backgroundColor:'#fff'}} fontStyle={{color: Constants.color.blue}}/>
          </View>

          {this.showList()}

        </View>
    )
  }

  renderSender() {
    let receiver = this.state.selectedSegment == 0?this.state.comeReceiver:this.state.goReceiver
     return (
        <View>
          <View style={[styles.row, styles.senderBox, {
            justifyContent:'space-between',borderTopWidth:1, borderTopColor:'#ddd',}]}>
            <Text style={{fontSize: 16, color: '#555'}}>
              {this.state.selectedSegment == 0 ? '接收':'发出'}单位
            </Text>
            <TouchableOpacity onPress={() => this.navigator.push('receiverList',
                {_parent:this, wareType: this.props.formtype,from:"record"})} style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
              <Text style={{fontSize:16, color: Constants.color.blue}} numberOfLines={1}>
                {
                  receiver.id ||receiver.name == "全部" ?receiver.name:"请选择单位"
                }
              </Text>
              <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  /**
   * set receiver
   */
  setReceiver(receiver) {
    console.log(receiver);
    if(this.state.selectedSegment == 0){
      this.setState({comeReceiver:receiver});
    }else{
      this.setState({goReceiver:receiver});
    }
  }

  setFormNo(text) {
    let formNo = text && text.trim() || '';
    if(this.state.selectedSegment == 0){
      this.setState({comeCode: formNo});
    }else{
      this.setState({goCode: formNo});
    }
  }




  /**
   * render main body based on selected segment
   */
  renderSegmentBody() {
    return(
        <ScrollView>
          <Touchable style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd',justifyContent:"space-between"}]}
                     onPress={()=>this.showDateTimePicker(true)}>
            <Text style={styles.rowText}>开始时间</Text>
            <View style={{flexDirection:"row"}}>
              <Text style={[styles.rowText,{ color: Constants.color.blue}]}>
                {this.state.selectedSegment == 0?this.state.comeStartDate:this.state.goStartDate}
              </Text>
              <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
            </View>
          </Touchable>
          <Touchable style={[styles.row, {borderTopWidth:1, borderTopColor:'#ddd',justifyContent:"space-between"}]}
                     onPress={()=>this.showDateTimePicker(false)}>
            <Text style={styles.rowText}>截止时间</Text>
            <View style={{flexDirection:"row"}}>
              <Text style={[styles.rowText,{ color: Constants.color.blue}]}>
                {this.state.selectedSegment == 0?this.state.comeEndDate:this.state.goEndDate}
              </Text>
              <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
            </View>
          </Touchable>
          {   this.state.selectedSegment == 0?
          <Product parent={this} selectedProduct={this.state.comeSelectedProduct} from="record" type={this.state.type}/>
          : <Product parent={this} selectedProduct={this.state.goSelectedProduct} from="record" type={this.state.type}/>}
          {this.renderSender()}
          {this.renderScan()}
        </ScrollView>
    )
  }

  /**
   * set product
   */
  setProduct(idx, product) {
    if(this.state.selectedSegment == 0){
      this.setState({comeSelectedProduct:product});
    }else{
      this.setState({goSelectedProduct:product});
    }

  }

  onSelectDate(data){
    let date = this.formatDate(data)
    let isStart = this.state.isStart
    if(this.state.selectedSegment == 0){
      if(isStart){
        let istrue = this.testDate(date,this.state.comeEndDate)
        if(istrue){
          Tools.alert("截止时间不能小于开始时间","请重新选择")
        }else{
          this.setState({comeStartDate:date})
        }
      }else{
        let istrue = this.testDate(this.state.comeStartDate,date)
        if(istrue){
          Tools.alert("截止时间不能小于开始时间","请重新选择")
        }else {
          this.setState({comeEndDate: date})
        }
      }
    }else{
      if(isStart){
        let istrue = this.testDate(date,this.state.goEndDate)
        if(istrue){
          Tools.alert("截止时间不能小于开始时间","请重新选择")
        }else{
          this.setState({goStartDate:date})
        }
      }else{
        let istrue = this.testDate(this.state.goStartDate,date)
        if(istrue){
          Tools.alert("截止时间不能小于开始时间","请重新选择")
        }else {
          this.setState({goEndDate: date})
        }
      }
    }
  }

  testDate(start,end){
    let startDate = new Date(start)
    let endDate = new Date(end)
    if(startDate > endDate){
      return true
    }else{
      return false
    }
  }

  /**
   * show date time picker
   */
  showDateTimePicker=(isStart)=> {
    this.setState({isStart})
    DateTimePicker.selectDate(this.onSelectDate.bind(this),  'date');
  }



  /**
   * render view
   */
  getView() {

    return (
        <View style={styles.container}>
          <View style={styles.segmentBox}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => {
              this.switchSegment(0);
              global.EventEmitter.emit('change-bar', this.state.comeSelectedProduct)
            }} style={[styles.segmentItem, this.state.selectedSegment == 0 ? styles.segmentItemActive:null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 0 ? styles.segmentTextActive:null]}>出库查询</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => {
              this.switchSegment(1);
              global.EventEmitter.emit('change-bar', this.state.goSelectedProduct)}
            } style={[styles.segmentItem, this.state.selectedSegment == 1 ? styles.segmentItemActive : null]}>
              <Text style={[styles.segmentText, this.state.selectedSegment == 1 ? styles.segmentTextActive : null]}>入库查询</Text>
            </TouchableOpacity>
          </View>

          {this.renderSegmentBody()}

        </View>
    )
  }

}

/**
 * styles
 */
const itemStyles = StyleSheet.create({
  box: {
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
    // marginRight:10,
    width:Screen.width/2
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
})

