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

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config
} from 'components';

export default class ProductList extends Base {
  constructor(props) {
    super(props, {
      modalVisible: false,
      products: [],
      idx: 0
    });

    this.allProducts = [];
    this.products = [];
  }

  componentDidMount() {
    this.getOrganization();
  }

  /**
   * get products list
   */
  getOrganization() {
    Tools.post({
      url: Constants.api.getOrganization,
      success: (data) => {
        let keys = Object.keys(data.Organizations);
        let products = [];
        keys.map( (v, k) => {
          products.push({id: v, name: data.Organizations[v]});
        });

        //products = products.slice(0,30);
        this.allProducts = products;
        this.products = products.slice(0,30);
        this.setState({products: this.products});
      },
      error: (data) => {
        //console.log(data);
      }
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
    this.props.parent.setReceiver(item.item);
    this.setState({modalVisible:false});
  }

  /**
   * render product list item
   */
  renderItem(item, index) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => this.selectProduct(item)} style={styles.productItem}>
        <Text>{item.item.name}</Text>
      </TouchableOpacity>
    )
  }

  // product list end reached, load more products
  onEndReached() {
    let start = this.products.length;
    let end = start + 30;
    if (end >= this.allProducts.length)
      end = this.allProducts.length;

    this.products = this.allProducts.slice(0, end);
    this.setState({products: this.products});
  }

  // show modal
  showList(idx) {
    this.setState({modalVisible:true, idx: idx});
  }

  getView() {
    return (
      <View style={styles.modalContainer}>
        <View style={{width:Screen.width-40, height: Screen.height-100}}>
          <FlatList
            data={this.state.products}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem.bind(this)}
            removeClippedSubviews={true}
            onEndReached={this.onEndReached.bind(this)}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection:'row',
    alignItems:'center',
    marginVertical:10,
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
  }
});
