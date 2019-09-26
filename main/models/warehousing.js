import SQLite from './sqlite';

// warehousing product model
import WarehousingProduct from './warehousing-product';
// warehousing code model
import WarehousingCode from './warehousing-code';

/**
 * warhousing model
 */
export default class Warehousing extends SQLite {
  constructor(props) {
    super(props);
  }

  /**
   * primary key
   */
  static get primaryKey() {
    return 'id';
  }

  /**
   * table name
   */
  static get table() {
    return 'warehousings';
  }

  /**
   * model instance
   */
  static get model() {
    return Warehousing;
  }

  /**
   * delete
   */
  delete() {
    // delete products
    let query = WarehousingProduct.query('delete');
    query.where("ware_id = " + this.data.id);
    WarehousingProduct.exec(query);

    // delete codes
    query = WarehousingCode.query('delete');
    query.where("ware_id = " + this.data.id);
    WarehousingCode.exec(query);

    // delete self
    super.delete();
  }

  /**
   * get products
   */
  getProducts() {
    return new Promise( (resolve, reject) => {
      let query = WarehousingProduct.query();
      query.where("ware_id = " + this.data.id);
      query.order("id", true);
      WarehousingProduct.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        reject(error);
      });
    });

  }

  /**
   * get codes
   */
  getCodes() {
    return new Promise( (resolve, reject) => {
      let query = WarehousingCode.query();
      query.where("ware_id = " + this.data.id);
      query.order("id", true);
      WarehousingCode.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        reject(error);
      });
    });
  }
}