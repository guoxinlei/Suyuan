import SQLite from 'react-native-sqlite-storage';

require('es5-ext/array/#/@@iterator/implement');

// sql string builder
const Squel = require('squel');

// tables
import CreateTables from './create-tables';
import CreateTables2 from './create-tables2';
import CreateTables3 from './create-tables3';

// tools
import Tools from '../components/tools';

const sqliteDB = SQLite.openDatabase(
  {
    name: 'suyuan'
  },
  (result) => {
    // create tables
    CreateTables.map( sql => {
      sqliteDB.executeSql(sql, [], (results) => {
        console.log(results);
      });
    });
  },
  (error) => {
    
  }
);

const sqliteDB2 = SQLite.openDatabase(
  {
    name: 'suyuan2'
  },
  (result) => {
    // create tables
    CreateTables2.map( sql => {
      sqliteDB2.executeSql(sql, [], (results) => {
        console.log(results);
      });
    });
  }
);

const sqliteDB3 = SQLite.openDatabase(
  {
    name: 'suyuan3'
  },
  (result) => {
    // create tables
    CreateTables3.map( sql => {
      sqliteDB3.executeSql(sql, [], (results) => {
        console.log(results);
      });
    });
  }
);

/**
 * get sqlite instance based on table name
 * @param {string} table 
 */
const getSQLiteDB = (table) => {
  if (table == 'products_v3')
    return sqliteDB2;
  else if (table == 'organizations_v2')
    return sqliteDB3;
  else
    return sqliteDB;
}

/**
 * sqlite base model
 */
class SQLiteModel {
  constructor(props) {
    // table name
    this.table = this.constructor.table;
    // primary key
    this.primaryKey = this.constructor.primaryKey;
    // model instance
    this.model = this.constructor.model;

    // data from props
    this.data = props || {};
  }

  /**
   * find by id
   * @return Promise
   */
  static find(id) {
    return new Promise( (resolve, reject) => {
      // sql string builder
      let sql = Squel.select().from(this.table).where(`${this.primaryKey} = ${id}`);
      // execute sql
      sql = sql.toString();
      getSQLiteDB(this.table).executeSql(sql, [], (results) => {
        if (results.rows.length == 0) {
          reject('Not Found');
        } else {
          results.rows.raw().map( row => {
            let model = this.model;
            let obj = new model(row);
            resolve(obj);
          });
        }
      });
    });
  }

  /**
   * query
   */
  static query(type ='select') {
    if (type == 'select')
      return Squel.select().from(this.table);
    else if (type == 'delete')
      return Squel.delete().from(this.table);
    else if (type == 'update')
      return Squel.update().table(this.table);
  }

  /**
   * execute sql
   * @param {Squel} sql
   */
  static exec(sql) {
    return new Promise( (resolve, reject) => {
      getSQLiteDB(this.table).executeSql(sql.toString(), [], (results) => {
        let list = [];
        results.rows.raw().map( row => {
          let model = this.model;
          let obj = new model(row);
          list.push(obj);
        });

        resolve(list);
      });
    });
  }

  /**
   * set data
   * @param {object} data
   */
  setData(data) {
    this.data = Object.assign(this.data, data);
  }

  /**
   * save (insert or update)
   */
  save() {
    let columns = Object.keys(this.data);
    let sql;
    // build sql string
    if (this.data[this.primaryKey]) {
      sql = Squel.update().table(this.table);
    } else {
      sql = Squel.insert().into(this.table);
    }

    columns.map( (column) => {
      // ignore primary key column
      if (column != this.primaryKey) {
        let value = this.data[column];
        sql.set(column, value);
      }
    });

    // update mode: set where condition
    if (this.data[this.primaryKey])
      sql.where(`${this.primaryKey} = ${this.data[this.primaryKey]}`);

    // execute sql
    sql = sql.toString();

    return new Promise( (resolve, reject) => {
      getSQLiteDB(this.table).executeSql(sql, [], (results) => {
        // update model's primaryKey on insertId
        if (results.insertId && !this.data[this.primaryKey])
          this.data[this.primaryKey] = results.insertId;

        resolve(true);
      });
    });
  }

  /**
   * delete
   */
  delete() {
    return new Promise( (resolve, reject) => {
      if (!this.data[this.primaryKey])
        resolve(false);

      // sql string builder
      let sql = Squel.delete().from(this.table);
      sql.where(`${this.primaryKey} = ${this.data[this.primaryKey]}`);

      // execute sql
      sql = sql.toString();
      getSQLiteDB(this.table).executeSql(sql, [], (results) => {
        resolve(true);
      });
    });
  }

  /**
   * get creation date
   */
  getCreationDate() {
    let date = new Date(this.data.create_at);

    return Tools.formatDate(date, true);
  }

}

export default SQLiteModel;