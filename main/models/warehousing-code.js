import SQLite from './sqlite';

/**
 * warhousing code model
 */
export default class WarehousingCode extends SQLite {
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
    return 'warehousings_code_v2';
  }

  /**
   * model instance
   */
  static get model() {
    return WarehousingCode;
  }
}