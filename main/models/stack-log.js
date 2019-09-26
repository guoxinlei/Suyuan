import SQLite from './sqlite';

// stack model
import Stack from './stack';

/**
 * bottle log model
 */
export default class StackLog extends SQLite {
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
    return 'stacks_log';
  }

  /**
   * model instance
   */
  static get model() {
    return StackLog;
  }

  /**
   * delete
   */
  delete() {
    // delete from stacks
    let query = Stack.query();
    query.where("log_id = " + this.data.id);
    Stack.exec(query).then( list => {
      list.map( stack => {
        stack.delete();
      });
    });

    return super.delete();
  }
}