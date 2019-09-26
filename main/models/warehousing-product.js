import SQLite from './sqlite';

/**
 * warhousing product model
 */
export default class WarehousingProduct extends SQLite {
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
    return 'warehousings_product';
  }

  /**
   * model instance
   */
  static get model() {
    return WarehousingProduct;
  }
}