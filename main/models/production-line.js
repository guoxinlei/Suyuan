import SQLite from './sqlite';

// constants
import {Constants, Tools} from 'components';

// user model
import User from './user';

/**
 * production line model
 */
export default class ProductionLine extends SQLite {
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
    return 'production_lines';
  }

  /**
   * model instance
   */
  static get model() {
    return ProductionLine;
  }

  /**
   * get production lines
   */
  static getProductionLines() {
    return new Promise( (resolve, reject) => {
      let query = ProductionLine.query();
      query.where("user_id = " + User.user_id);
      query.order("id", true);
      ProductionLine.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * get production lines from server & save into sqlite
   */
  static updateProductionLines() {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.getProductionLines,
        alertOnError: false,
        success: (data) => {
          let query = ProductionLine.query('delete');
          query.where('user_id = ' + User.user_id);
          ProductionLine.exec(query);
  
          let keys = Object.keys(data.ProductionLines);
          keys.map( lineId => {
            let name = data.ProductionLines[lineId];
            let newLine = new ProductionLine();
            newLine.setData({
              user_id: User.user_id,
              line_id: lineId,
              name: name
            });
            newLine.save();
          });
          resolve( "OK" );
        },
        error: (data) => {
          reject( data );
        }
      });
    });
  }

  /**
   * search production lines by keywords
   */
  static searchProductionLines(keywords) {
    let query = ProductionLine.query();
    query.where("name like '%" + keywords + "%'");
    query.order("id", true);

    return new Promise( (resolve, reject) => {
      ProductionLine.exec(query).then( list => {
        resolve(list);
      }).catch(error => {
        reject(error);
      });
    });
  }
}