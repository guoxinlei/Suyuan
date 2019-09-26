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

  Base,
  Button,
  Tools,
  Constants,
  Screen,
  Icons,
  Config,
  QRCodeText,
  Touchable
} from 'components';

import {User, WarehousingProduct} from 'models';
// product list
import Product from '../products';

export default class BoxOfflineLog extends Base {
  constructor(props) {
    super(props, {
      warehousingProducts: []
    });
    
  }

  componentDidMount() {
    super.componentDidMount();

    this.getProducts();
  }

  // remove listener
  componentWillUnmount() {
    super.componentWillUnmount();

    this.unmount = true;
  }

  /**
   * get warehousing products
   */
  getProducts() {
    this.props.warehousing.getProducts().then( list => {
      this.setState({warehousingProducts: list});
    }).catch(error => {

    });
  }

  /**
   * 获得单号类别
   */
  getFormTypeName(formtype) {
    let formName = '';
    switch (formtype) {
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
   * render view
   */
  getView() {
    if (!this.state.warehousingProducts)
      return (<View></View>);

    let type = this.getFormTypeName(this.props.warehousing.data.ware_type);
    return this.state.warehousingProducts.map((product) => {
      return (
        <View style={styles.container} key={"item" + product.data.id}>
          <Text style={styles.productName} numberOfLines={1}>{product.data.product}</Text>
          <Text style={styles.planText}>计划{type}    <Text style={styles.planNumber}>{product.data.box_nums}</Text></Text>
        </View>
      );
    });
  }
}

/**
 * styles
 */
const styles = StyleSheet.create({
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
  },
  planNumber: {
    color: Constants.color.black4
  }
});