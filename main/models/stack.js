import SQLite from './sqlite';

/**
 * stack model
 */
export default class Stack extends SQLite {
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
    return 'stacks';
  }

  /**
   * model instance
   */
  static get model() {
    return Stack;
  }
}