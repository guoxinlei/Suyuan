import SQLite from './sqlite';

/**
 * login history model
 */
export default class LoginHistory extends SQLite {
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
    return 'login_history';
  }

  /**
   * model instance
   */
  static get model() {
    return LoginHistory;
  }

  /**
   * get login history
   */
  static getHistory() {
    return new Promise( (resolve, reject) => {
      let query = LoginHistory.query();

      query.order("id", false);

      LoginHistory.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * save login history
   */    
  static saveHistory(opts) {
    return new Promise( (resolve, reject) => {
      let query = LoginHistory.query('delete');
      query.where("username = '" + opts.username + "'");
      LoginHistory.exec(query);

      let history = new LoginHistory();
      history.setData({
        login_name: opts.login_name,
        user_id: opts.user_id,
        username: opts.username,
        password: opts.password
      });

      history.save();

      resolve("OK");
    });
  }
}