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
  Keyboard,

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config,
  Touchable,
  QRCodeText,
  Siblings
} from 'components';

import _ from 'lodash';
import {Scan2} from 'images';

// product model
import {User, Product} from 'models';

export default class ProductList extends Base {
  constructor(props) {
    super(props, {
      isLoading: true,
      modalVisible: false,
      products: [],
      txtKeywords: props.searchKeywords || '',
      txtScanText: '',
      idx: 0
    });

    this.navItems = {
      title: {
        text: "选择商品"
      }
    }
    this.allProducts = [];
    this.products = [];
    this.picPrefix = '';
    this.picSuffix = '';

    this.scanMode = false;

    this.onBarCodeRead = this.onBarCodeRead.bind(this);

  }

  componentDidMount() {
    super.componentDidMount();

    global.currentFocusPage = 'product-list';

    setTimeout(() => {
      this.getProducts();
    }, 200);

    /*setTimeout( () => {
      this.onBarCodeRead({code:'http://sy.qkj.com.cn/a.aspx?code=32917262719876130168'})
    }, 2000);*/
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
    if (this.unmount)
      return;

    let code = data.code.trim();
    code = Tools.getCode(code);
    if (!code) {
      Tools.alert("扫码错误", "没有读取到扫码信息，请重新扫描");
      Vibration.vibrate();
      return;
    }

    this.setScanResult(code);

  }

  /**
   * get products list
   */
  getProducts() {
    Product.getProducts({from: this.props.from}).then( list => {
      let products = [];
      list.map( product => {
        products.push(product.data);
      });

      this.allProducts = products;
      this.products = products.slice(0, 20);

      // 如果指定了搜索关键词
      if (this.props.searchKeywords) {
        Product.searchProducts(this.props.searchKeywords, this.props.from).then( list => {
          let searchProducts = [];
          list.map( product => {
            searchProducts.push(product.data);
          });
          searchProducts = searchProducts.concat(this.allProducts);
          console.log(searchProducts);
          searchProducts = _.uniqBy(searchProducts, "product_id");
          this.allProducts = searchProducts;
          this.products = searchProducts.slice(0, 20);
          this.setState({products: this.products, isLoading:false});
        }).catch( error => {
          this.setState({products: this.products, isLoading:false});
        });
      } else {
        this.setState({products: this.products, isLoading:false});
      }
    }).catch( error => {
      this.setState({isLoading:false});
      Tools.alert('获取商品列表出错了', '请稍候重试');
    });
  }

  /**
   * key extractor for FlatList
   */
  keyExtractor(item, index) {
    return 'item'+item.id;
  }

  // select product
  selectProduct(item) {
    //this.setState({selectedProduct: item.item, modalVisible:false});
    item.item.pic = item.item.pic;
    this.props._parent.setProduct(this.state.idx, item.item);
    this.navigator.pop();
  }

  /**
   * set product mark
   */
  setProductMark(mark) {
    let item = {product_name: mark, product_id: 0};
    this.props._parent.setProduct(this.state.idx, item);

    setTimeout( () => {
      this.navigator.pop();
    }, 200);
  }

  /**
   * render product list item
   */
  renderItem(item, index) {
    let product = item.item;
    let pic = product.pic;
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => this.selectProduct(item)} style={styles.productItem}>
        <Image source={{uri: pic}} style={styles.productImage} resizeMode='contain'/>
        <View style={{justifyContent:'center', width: Screen.width-110}}>
          <View><Text style={styles.productName}>{product.product_name}</Text></View>
          {/*
          <View style={{flexDirection:'row', marginTop:5}}>
            <View style={{width: 60}}>
              <Text style={styles.productVol}>{product.vol}</Text>
            </View>
            <View style={{width: 100}}>
              <Text style={styles.productVol}>{product.capacity}</Text>
            </View>
          </View>
          */}
        </View>
      </TouchableOpacity>
    );
  }

  // product list end reached, load more products
  onEndReached() {
    if (this.scanMode)
      return;

    let start = this.products.length;
    let end = start + 20;
    if (end >= this.allProducts.length)
      end = this.allProducts.length;

    let tempList = [];
    if (this.state.txtKeywords && this.searchMode) {
      for (let i = 0; i < this.allProducts.length; i++) {
        let product = this.allProducts[i];
        if (product.product_name.indexOf(this.state.txtKeywords) >= 0)
          tempList.push(product);
      }
    } else {
      tempList = this.allProducts;
    }
    this.products = tempList.slice(0, end);
    this.setState({products: this.products});
  }

  focusInput() {
    this.inputRef.focus();
  }

  handleKeyDown() {

  }

  // clear keywords
  clearKeywords() {
    this.setState({ txtKeywords: '' });
    this.inputRef.focus();
    this.scanMode = false;
    setTimeout(() => {
      this.startSearch(true);
    }, 100);
  }

  /**
   * search product
   */
  startSearch(noDismissKeyboard) {
    if (!noDismissKeyboard)
      Keyboard.dismiss();

    // scan mode: clear scan mode then search products
    if (this.scanMode) {
      this.scanMode = false;
    }

    this.searchMode = true;
    let tempList = [];
    if (this.state.txtKeywords) {
      for (let i = 0; i < this.allProducts.length; i++) {
        let product = this.allProducts[i];
        if (product.product_name.indexOf(this.state.txtKeywords) >= 0)
          tempList.push(product);
      }
    } else {
      tempList = this.allProducts;
    }
    console.log(tempList);
    this.products = tempList.slice(0, 20);
    this.refs.list.scrollToOffset({x:0, y:0, animated:false});
    this.setState({products: this.products});
  }

  /**
   * show scan page
   */
  showScan() {
    if (this.isScaning)
      return;

    this.isScaning = true;

    Keyboard.dismiss();
    this.navigator.push('qrScan', {_parent:this});

    // avoid double or more click
    setTimeout( () => {
      this.isScaning = false;
    }, 3000);
  }

  /**
   * set qr scan result
   */
  setScanResult(code) {
    this.setState({txtKeywords:code, txtScanText: code, isLoading:true});
    this.scanMode = true;

    Product.searchProductsByCode(code).then( list => {
      let products = [];
      list.map( product => {
        products.push(product.data);
      });
      
      this.setState({products: products, isLoading:false});
    }).catch( error => {
      this.setState({isLoading:false});
    });

    return;

    Tools.post({
      url: Constants.api.getProductByCode,
      data: {code},
      success: (data) => {
        console.log(data);
        let products = data.products;
        this.products = data.products.slice(0, 20);

        this.picPrefix = data.picprefix;
        this.picSuffix = data.picsuffix;
        this.setState({products: this.products, isLoading:false});
      },
      error: (data) => {
        console.log(data);
        this.setState({isLoading:false});
      }
    });
  }

  /**
   * show mark page
   */
  showMark() { 
    this.navigator.push('productMark', {_parent: this});
  }

  getView() {
    return (
      <View style={{width:Screen.width, height: Constants.contentHeight}}>
        <View style={styles.box}>
          <View style={styles.searchBox}>
            <Icons.Ionicons name="ios-search-outline" size={20} color="#666" style={{ paddingTop: 3, paddingLeft: 12, paddingRight:5 }} />
            <View style={styles.searchInput}>
              <TextInput
                ref={input => this.inputRef = input}
                style={styles.textInput}
                underlineColorAndroid="transparent"
                placeholder="搜索商品"
                placeholderTextColor="#666"
                returnKeyType="search"
                onSubmitEditing={() => this.startSearch()}
                value={Tools.parseCode(this.state.txtKeywords)}
                onChangeText={(txt) => this.setState({ txtKeywords: txt })}
                onKeyPress={this.handleKeyDown}
                onFocus={this.focusInput.bind(this)}
              />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.9} onPress={() => this.showScan()} style={{marginLeft:10}}>
            <Image source={{uri: Scan2.image}} style={{width:22, height:22, tintColor:'#538ede'}} />
          </TouchableOpacity>

          {this.state.txtKeywords ?
            <TouchableOpacity onPress={() => this.clearKeywords()} style={styles.close}>
              <Icons.Ionicons name="ios-close-circle" size={20} color={Constants.color.black3} />
            </TouchableOpacity>
            : null
          }
        </View>
        <FlatList
          ref="list"
          data={this.state.products}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem.bind(this)}
          removeClippedSubviews={true}
          onEndReached={this.onEndReached.bind(this)}
        />
        { User.offline ?
          <View style={styles.footer}>
            <Touchable onPress={() => this.showMark()} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>新增商品</Text>
            </Touchable>
          </View>
          : null
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  productItem: {
    padding: 10,
    borderTopWidth:1,
    borderTopColor: '#ddd',
    backgroundColor:'#fff',
    flexDirection:'row'
  },
  productImage: {
    width: 75,
    height:75,
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
  box: {
    flexDirection: 'row',
    paddingLeft: 10,
    paddingTop:15,
    backgroundColor: '#fff',
    alignItems:'center',
    paddingBottom: 10,
    height: 60,
    backgroundColor:'#f5f5f5',
    overflow:'hidden'
  },
  searchBox: {
    flexDirection: 'row',
    width: Screen.width - 60,
    height: 38,
    backgroundColor: '#fff',
    paddingRight: 20,
    alignItems:'center',
    borderRadius: 6,
    borderColor:'#f0f0f0',
    borderWidth:1,
    overflow: 'hidden',
  },
  searchInput: {
    height: 38,
    paddingTop: Platform.OS === 'android' ? 7:3,
    overflow: 'hidden'
  },
  textInput: {
    width: Screen.width - 100,
    height: Platform.OS === 'android' ? 34:28,
    paddingLeft: 7,
    marginTop: Platform.OS === 'android'? 0:2,
    paddingTop: Platform.OS === 'android' ? 0:2,
    fontSize: 16,
    color: Constants.color.black5,
    backgroundColor:'transparent'
  },
  searchText: {
    fontSize: 16,
    paddingLeft: 20,
    color: Constants.color.black5
  },
  close: {
    position: 'absolute',
    backgroundColor:'transparent',
    top: 23,
    right: 60,
    bottom: 0
  },
  footer: {
    position:'absolute',
    bottom:30,
    left: 0,
    marginHorizontal: 30,
    alignItems:'center',
    justifyContent:'center'
  },
  footerButton: {
    height: 40,
    backgroundColor: Constants.color.blue,
    alignItems:'center',
    justifyContent:'center',
    borderRadius:3,
    width: Screen.width - 60
  },
  footerButtonText: {
    fontSize: 16,
    color: '#fff'
  },
  maskContent: {
    backgroundColor:'#fff',
    padding: 20
  },
  maskText: {
    fontSize: 18,
    fontWeight: Constants.fonts.bold1,
    color: Constants.color.black4,
    marginBottom: 10
  },
  textInput2: {
    borderWidth:1,
    borderColor: '#ccc',
    borderRadius:8,
    overflow:'hidden',
    height: Constants.scaleRate > 1.5 ? 35:26,
    width: 50,
    paddingTop:Constants.isAndroid ? (Constants.scaleRate > 1.5 ? 8:3):(Constants.scaleRate > 1.5 ? 10:8),
    paddingLeft:10,
    marginLeft: 30,
    backgroundColor:'#f4f4f4'
  },
  textInputFocus2: {
    borderColor: Constants.color.yellow
  },
});
