import SQLite from './sqlite';

// box model
import Box from './box';

/**
 * box log model
 */
export default class BoxLog extends SQLite {
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
    return 'boxes_log';
  }

  /**
   * model instance
   */
  static get model() {
    return BoxLog;
  }

  /**
   * delete
   */
  delete() {
    // delete from bottles
    let query = Box.query();
    query.where("log_id = " + this.data.id);
    Box.exec(query).then( list => {
      list.map( box => {
        box.delete();
      });
    });

    return super.delete();
  }
}