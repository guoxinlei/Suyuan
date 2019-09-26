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
  Config
} from 'components';

// model
import {ProductionLine as ProductionLineModel} from 'models';

export default class ProductionLine extends Base {
  constructor(props) {
    super(props, {
      isLoading: true,
      modalVisible: false,
      products: [],
      idx: 0
    });

    this.navItems = {
      title: {
        text: "选择生产线"
      }
    }
    this.allProducts = [];
    this.products = [];
    this.picPrefix = '';
    this.picSuffix = '';
  }

  componentDidMount() {
    setTimeout(() => {
      this.getProductionLines();

    }, 200);
  }

  /**
   * get production lines list
   */
  getProductionLines() {
    ProductionLineModel.getProductionLines().then( list => {
      let products = [];
      list.map( org => {
        products.push({id: org.data.line_id, name: org.data.name});
      });
      //products = products.slice(0,30);
      this.allProducts = products;
      this.products = products.slice(0,30);
      this.setState({products: this.products, isLoading: false});
    }).catch( error => {
      Tools.alert('获取生产线出错了');
      this.setState({isLoading:false});
    });
  }

  /**
   * key extractor for FlatList
   */
  keyExtractor(item, index) {
    return 'item'+item.id;
  }

  // select product line
  selectLine(item) {
    this.props._parent.setProductionLine(item.item);
    this.navigator.pop();
  }

  /**
   * render product list item
   */
  renderItem(item, index) {
    let product = item.item;
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => this.selectLine(item)} style={styles.productItem}>
        <View style={{justifyContent:'center', width: Screen.width-30, padding:10}}>
          <View><Text style={styles.productName}>{product.name}</Text></View>
        </View>
      </TouchableOpacity>
    );
  }

  // product list end reached, load more products
  onEndReached() {
    let start = this.products.length;
    let end = start + 20;
    if (end >= this.allProducts.length)
      end = this.allProducts.length;

    let tempList = [];
    if (this.state.txtKeywords) {
      for (let i = 0; i < this.allProducts.length; i++) {
        let product = this.allProducts[i];
        if (product.name.indexOf(this.state.txtKeywords) >= 0)
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
  }

  startSearch() {
    Keyboard.dismiss();

    let tempList = [];
    if (this.state.txtKeywords) {
      for (let i = 0; i < this.allProducts.length; i++) {
        let product = this.allProducts[i];
        if (product.name.indexOf(this.state.txtKeywords) >= 0)
          tempList.push(product);
      }
    } else {
      tempList = this.allProducts;
    }
    this.products = tempList.slice(0, 20);
    this.refs.list.scrollToOffset({x:0, y:0, animated:false});
    this.setState({products: this.products});
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
                placeholder="搜索生产线"
                placeholderTextColor="#666"
                returnKeyType="search"
                onSubmitEditing={() => this.startSearch()}
                value={this.state.txtKeywords}
                onChangeText={(txt) => this.setState({ txtKeywords: txt })}
                onKeyPress={this.handleKeyDown}
                onFocus={this.focusInput.bind(this)}
              />
            </View>
          </View>
          {this.state.txtKeywords ?
            <TouchableOpacity onPress={() => this.clearKeywords()} style={styles.close}>
              <Icons.Ionicons name="ios-close-circle" size={20} color={Constants.color.black3} />
            </TouchableOpacity>
            : null
          }
        </View>
        <FlatList
          ref="list"
          style={{borderTopWidth:1, borderTopColor:'#ddd'}}
          data={this.state.products}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem.bind(this)}
          removeClippedSubviews={true}
          onEndReached={this.onEndReached.bind(this)}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  productItem: {
    padding: 10,
    borderBottomWidth:1,
    borderBottomColor: '#ddd',
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
    backgroundColor:'#f5f5f5'
  },
  searchBox: {
    flexDirection: 'row',
    width: Screen.width - 30,
    height: 34,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingRight: 20,
    alignItems:'center',
    borderRadius: 6,
    borderColor:'#f0f0f0',
    borderWidth:1
  },
  searchInput: {
    height: 34,
  },
  textInput: {
    width: Screen.width - 30,
    height: Platform.OS === "android" ? 40 : 28,
    paddingLeft: 7,
    marginTop: 2,
    paddingTop: 2,
    fontSize: 16,
    color: Constants.color.black5,
    backgroundColor:'#fff'
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
    right: 30,
    bottom: 0
  }
});
