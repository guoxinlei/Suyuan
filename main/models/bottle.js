import SQLite from './sqlite';

/**
 * bottle model
 */
export default class Bottle extends SQLite {
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
    return 'bottles';
  }

  /**
   * model instance
   */
  static get model() {
    return Bottle;
  }
}