import SQLite from './sqlite';

/**
 * box model
 */
export default class Box extends SQLite {
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
    return 'boxes';
  }

  /**
   * model instance
   */
  static get model() {
    return Box;
  }
}