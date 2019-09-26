import SQLite from './sqlite';

import User from './user';

/**
 * warhousing model
 */
export default class WarehousingCache extends SQLite {
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
    return 'warehousings_cache_v3';
  }

  /**
   * model instance
   */
  static get model() {
    return WarehousingCache;
  }

  /**
   * get items
   */
  static getItems(opts) {
    return new Promise( (resolve, reject) => {
      let query = WarehousingCache.query();
      if (opts && opts.formType)
        query.where("ware_type = " + opts.formType);

      if (global.defaultServer) {
        query.where("server_id = " + global.defaultServer.data.id);
      }
      let user = User.getUser();
      if (user) {
        query.where("user_id = " + user.userid);
      }

      query.order("create_at", false);

      WarehousingCache.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        reject(error);
      });
    });
  }

  /**
   * update item
   */
  static updateItem(item) {
    console.log(item);
    return new Promise( (resolve, reject) => {
      let query = WarehousingCache.query();
      query.where("ware_no = '" + item.formNo + "'");
      query.where("ware_type = " + item.formType);
  
      WarehousingCache.exec(query).then( list => {
        let cache = list && list[0];
        if (!cache)
          cache = new WarehousingCache();

        let data = {
          ware_no: item.formNo,
          ware_type: item.formType,
          create_at: new Date().getTime()
        };
        if (item.productionLine)
          data.production_line = JSON.stringify(item.productionLine);
        if (item.productionBatch)
          data.production_batch = item.productionBatch;
        if (item.products)
          data.products = JSON.stringify(item.products);
        if (item.boxesPerStack)
          data.boxes_per_stack = item.boxesPerStack;

        data.stacks = item.stacks || 0;

        if (global.defaultServer) {
          data.server_id = global.defaultServer.data.id;
        }
        let user = User.getUser();
        if (user) {
          data.user_id = user.userid;
        }

        cache.setData(data);
        cache.save();

      }).catch( error => {
  
      });
    });
  }

  static clear(opts) {
    return new Promise( (resolve, reject) => {
      let query = WarehousingCache.query('delete');
      query.where("ware_type = " + opts.formType);
      if (global.defaultServer) {
        query.where("server_id = " + global.defaultServer.data.id);
      }
      let user = User.getUser();
      if (user) {
        query.where("user_id = " + user.userid);
      }

      WarehousingCache.exec(query);
    });
  }

  static deleteItem( item ) {
    return new Promise( (resolve, reject) => {
      let query = WarehousingCache.query('delete');
      query.where("ware_no = '" + item.formNo + "'");
      query.where("ware_type = " + item.formType);
  
      WarehousingCache.exec(query);
    } );
  }

}