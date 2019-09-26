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
  Image,

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config
} from 'components';

import {User, Product as ProductModel} from 'models';
import {Add} from 'images';

export default class Product extends Base {
  constructor(props) {
    super(props, {
      selectedProduct: {},
      txtAmount:''
    });
  }

  componentDidMount() {
    if (this.props.selectedProduct) {
      console.log(this.props.selectedProduct);
      // get product info
      if (this.props.selectedProduct.product_id) {
        ProductModel.getProductById(this.props.selectedProduct.product_id).then( product => {
          this.setState({
            selectedProduct: product.data,
            txtAmount: ''+ (this.props.selectedProduct.plancount || '')
          });
        }).catch(error => {
          this.setState({
            selectedProduct: this.props.selectedProduct,
            txtAmount: ''+ (this.props.selectedProduct.plancount || '')
          });
        });
      } else {
        this.setState({
          selectedProduct: this.props.selectedProduct,
          txtAmount: ''+ (this.props.selectedProduct.plancount || '')
        });
      }
    }
  }

  /**
   * get product
   */
  getProduct() {
    return this.state.selectedProduct;
  }

  /**
   * set product
   */
  setProduct(idx, product) {
    if (this.props.parent && this.props.parent.checkProduct) {
      if (this.props.parent.checkProduct(this.props.idx, product)) {
        Tools.alert("提示信息", '该商品已经选择过了');
        return;
      }
    }
    product.plancount = this.state.txtAmount;
    this.setState({selectedProduct: product});
    this.props.parent.setProduct(this.props.idx, product);
  }

  /**
   * set amount
   */
  setAmount(newAmount) {
    if (newAmount && (!Tools.isNumber(newAmount) || newAmount < 0) ) {
      Tools.alert("提示信息", "请输入正确的箱数");
      this.setState({ txtAmount: "" + this.state.txtAmount });
      return;
    }

    // 小数点后面保留2位
    let amount = newAmount;
    let info = newAmount.toString().split('.');
    if (info[1] && info[1].length > 2) {
      info[1] = info[1].substring(0, 2);
      info = info.join('.');

      amount = parseFloat(info);
    }
    
    this.setState({ txtAmount: "" + amount});

    if (this.props.parent && this.props.parent.setAmount) {
      this.props.parent.setAmount(this.props.idx, amount);
    }

  }

  /**
   * remove product
   */
  removeProduct(idx) {

    if (this.props.parent && this.props.parent.removeProduct) {
      this.props.parent.removeProduct(this.props.idx);
    }
  }

  /**
   * textinput focus event
   */
  onFocus() {
    this.refs.textInput && this.refs.textInput.measure( (ox, oy, width, height, px, py) => {
      //console.log(ox, oy, width, height, px, py);
      setTimeout(() => {
        this.props.parent && this.props.parent.onTextFocus(py + height);
      }, 200);
    });
  }

  onBlur() {

  }

  /**
   * render product info
   */
  renderProductInfo() {
    let selectedProduct = this.state.selectedProduct;
    // 有商品id的数据
    if (selectedProduct && selectedProduct.product_id) {
      return (
        <View style={styles.productItem}>
          <Image source={{uri: selectedProduct.pic}} style={styles.productImage} resizeMode='contain'/>
          <View style={{justifyContent:'center', width: Screen.width-110}}>
            <View><Text style={styles.productName}>{selectedProduct.product_name}</Text></View>
            {/*
            <View style={{flexDirection:'row', marginTop:5}}>
              <View style={{width: 60}}>
                <Text style={styles.productVol}>{selectedProduct.vol}</Text>
              </View>
              <View style={{width: 100}}>
                <Text style={styles.productVol}>{selectedProduct.capacity}</Text>
              </View>
            </View>
            */}
          </View>
        </View>
      );
    } 
    // 没有商品id，有商品名称的数据（手工录入的商品）
    else if (selectedProduct && selectedProduct.product_name) {
      return (
        <View style={styles.markBox}>
          <Text style={{fontSize:16, color: Constants.color.black4}}>{selectedProduct.product_name}</Text>
        </View>
      );
    }
    // 没有选择商品 
    else {
      return null;
    }
  }

  /**
   * show product list
   */
  showList() {
    let keywords = this.state.selectedProduct ? this.state.selectedProduct.product_name:'';
    this.navigator.push('productList', {
      _parent:this, 
      searchKeywords: keywords,
      from: this.props.formType == 3 ? 'stack':this.props.from
    });
  }

  getView() {
    let selectedProduct = this.state.selectedProduct;
    if ( (!selectedProduct || !selectedProduct.product_name) && this.props.type == 'warehousing') {
      return (
        <View style={{alignItems:'center', justifyContent:'center', paddingTop:20, borderTopWidth:1, borderTopColor:'#ddd'}}>
          <TouchableOpacity onPress={() => this.showList()} style={{alignItems:'center', justifyContent:'center'}}>
            <Image source={{uri: Add.image}} style={{width: 60, height:60}}/>
            <Text style={{fontSize:18, color: Constants.color.blue, marginTop:10}}>新增商品</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <TouchableOpacity onPress={() => {}} activeOpacity={1}>
        <View style={styles.row}>
          <Text style={{fontSize: 16, color: '#555'}}>商品</Text>
          <TouchableOpacity onPress={() => this.showList()} style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:16, color: Constants.color.blue}} numberOfLines={1}>请选择商品</Text>
            <Icons.Ionicons name="ios-arrow-forward-outline" size={24} color="#ccc" style={{marginLeft:8}}/>
          </TouchableOpacity>
        </View>
        {this.renderProductInfo()}

        {
          selectedProduct && selectedProduct.product_name && this.props.type == 'warehousing' ?
          <View style={[styles.row, {paddingVertical:8}]}>
            <Text style={styles.rowText}>箱数</Text>
            <TextInput
              ref="textInput"
              style={[styles.textInput, {marginLeft:10, width: Screen.width-150}]}
              underlineColorAndroid='transparent'
              placeholder="请输入箱数"
              onChangeText={(text) => this.setAmount(text)}
              value={this.state.txtAmount}
              keyboardType='numeric'
              onFocus={() => this.onFocus()}
              onBlur={() => this.onBlur()}
            />
            <TouchableOpacity onPress={() => this.removeProduct()} style={{ alignItems: 'center', marginLeft: 20}}>
              <Text style={{ fontSize: 16, color: Constants.color.blue }}>删除</Text>
            </TouchableOpacity>
          </View>
          : null
        }
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    backgroundColor: '#fff',
    padding: 10,
    paddingVertical: 6 * Constants.scaleRate,
    borderTopWidth:1,
    borderTopColor: '#ddd'
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
  productVol: {
    fontSize: 16,
    color: '#333'
  },
  container: {
    width: Screen.width,
    height: Constants.contentHeight,
    backgroundColor:'#f5f5f5'
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
  },
  markBox: {
    alignItems:'flex-end', 
    backgroundColor:'#fff',
    padding:6*Constants.scaleRate,
    borderTopWidth:1,
    borderTopColor:'#ddd'
  }
});
