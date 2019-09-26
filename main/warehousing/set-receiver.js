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
  Config
} from 'components';

import {User, Warehousing, WarehousingProduct} from 'models';

export default class SetReceiver extends Base {
  constructor(props) {
    super(props, {
      formNoCode:'',
      receiver: {},
      keyboardHeight: 0,
      marginTop: 0
    });

    this.formTypeName = this.getFormTypeName();
    this.navItems = {
      rightItem: {},
      title: {
        text: '设置' + (this.props.formtype == 2 ? '接收':'发出') + '单位'
      }
    }
  }

  componentDidMount() {
    super.componentDidMount();
  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

    this.unmount = true;
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
   * update form
   * formno 出入库单号(string)
2.formtype   单据类型(int)          1 入库 2 出库 3 生产入库 4退货入库
3.SendOrganization  发货机构id (int)   不知道此参数请传递小于0 的值，建议为-1
4.ReceiveOrganization
   */
  updateForm() {
    if (this.isPosting)
      return;

    if (!this.state.receiver.id) {
      Tools.alert('请选择' + (this.props.formtype == 2 ? '接收':'发出') + '单位');
      return;
    }
    let postData = {
      formno: this.props.data.formno,
      formtype: this.props.formtype
    };

    if (this.props.formtype == 2)
      postData.ReceiveOrganization = this.state.receiver.id;
    else
      postData.SendOrganization = this.state.receiver.id;
    
    this.isPosting = true;
    this.setState({isLoading:true});
    Tools.post({
      url: Constants.api.saveFormOrganization,
      data: postData,
      success: (data) => {
        console.log(data);
        this.navigator.replace('submitForm', { data: this.props.data, formtype: this.props.formtype, _parent: this.props._parent});

        this.isPosting = false;
        this.setState({isLoading: false})
      },
      error: (data) => {
        console.log(data);
        this.isPosting = false;
        this.setState({isLoading: false})
      }
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
   * render view
   */
  getView() {

    let buttonWidth = this.props.warehousing && this.props.from != 'submit' ? 90:120;
    let height = this.isScene ? Constants.contentHeight:Constants.contentHeight-80;

    return (
      <FormContainer style={[styles.container, {height,marginTop: 15 - this.state.marginTop}]}>
        <View style={[styles.row, {justifyContent:'space-between', borderTopWidth:1, borderTopColor:'#ddd', marginBottom: this.state.receiver.id ? 0:15}]}>
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
        <View style={{marginTop:20, marginBottom:30, alignItems:'center', justifyContent:'center', flexDirection:'row'}}>
          <Button title="提交" onPress={() => this.updateForm()} style={{width:buttonWidth}}/>
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
    borderWidth:1,
    borderColor: '#ccc',
    borderRadius:8,
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
  }
});
