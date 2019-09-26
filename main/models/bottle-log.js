import SQLite from './sqlite';

// bottle model
import Bottle from './bottle';

/**
 * bottle log model
 */
export default class BottleLog extends SQLite {
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
    return 'bottles_log';
  }

  /**
   * model instance
   */
  static get model() {
    return BottleLog;
  }

  /**
   * delete
   */
  delete() {
    // delete from bottles
    let query = Bottle.query();
    query.where("log_id = " + this.data.id);
    Bottle.exec(query).then( list => {
      list.map( bottle => {
        bottle.delete();
      });
    });

    return super.delete();
  }
}