import SQLite from './sqlite';

/**
 * box model
 */
export default class Server extends SQLite {
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
    return 'servers';
  }

  /**
   * model instance
   */
  static get model() {
    return Server;
  }

  /**
   * get servers
   */
  static getServers() {
    return new Promise( (resolve, reject) => {
      let query = Server.query();
      query.order("id", true);
      Server.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * add new server
   */
  static add(options) {
    return new Promise( (resolve, reject) => {
      let newServer = new Server();
      newServer.setData({
        name: options.name,
        url: options.url,
        is_default: 0
      });

      newServer.save();
      resolve(newServer);
    });
  }

  /**
   * get default server
   */
  static getDefault() {
    return new Promise( (resolve, reject) => {
      let query = Server.query();
      query.where("is_default", 1);
      Server.exec(query).then( list => {
        if (list.length == 0) {
          Server.find(1).then( server => {
            resolve(server);
          });
        } else {
          resolve(list[0]);
        }
      }).catch( error => {
        reject(error);
      });
    });
  }

  /**
   * set as default
   */
  setDefault() {
    return new Promise( (resolve, reject) => {
      let query = Server.query("update");
      query.set("is_default", 0);
      Server.exec(query).then( () => {

      }).finally( () => {
        this.setData({
          is_default: 1
        });
  
        this.save();
        resolve("OK");
      });
    });
  }

  /**
   * edit
   */
  edit(options) {
    return new Promise( (resolve, reject) => {
      this.setData({
        name: options.name,
        url: options.url
      });

      this.save();
      resolve("OK");
    });
  }

  /**
   * get url
   */
  getURL() {
    let url = this.data.url;

    // 如果结尾不是/，添加/
    if (url.substring(url.length-1) != '/')
      url += "/";

    // 如果开头不是http
    if (url.indexOf("http://") != 0)
      url = "http://" + url;

    return url;
  }

}