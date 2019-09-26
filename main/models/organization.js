import SQLite from './sqlite';

// constants
import {Constants, Tools} from 'components';

// user model
import User from './user';

const Squel = require('squel');

/**
 * organization model
 */
export default class Organization extends SQLite {
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
    return 'organizations_v2';
  }

  /**
   * model instance
   */
  static get model() {
    return Organization;
  }

  /**
   * get organization
   */
  static getOrganizations( options ) {
    return new Promise( (resolve, reject) => {
      let query = Organization.query();
      query.where("user_id = " + User.user_id);
      if (options && options.ware_type)
        query.where("ware_type = " + options.ware_type);
      else
        query.where("ware_type = 2");

      if (options.keywords) {
        query.where('name like "%' + options.keywords + '%"');
      }
      query.order("id", true);

      if (options.page) {
        query.offset( 50 * (options.page - 1) );
      }
      query.limit(50);

      Organization.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * get organizations from server & save into sqlite
   */
  static updateOrganizations() {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.getOrganization,
        alertOnError: false,
        success: (data) => {
          let query = Organization.query('delete');
          query.where('user_id = ' + User.user_id);
          query.where("ware_type = 2");
          Organization.exec(query).then( () => {
            let keys = Object.keys(data.Organizations);
            
            let inserts = keys.map( orgId => {
              let name = data.Organizations[orgId];
              //let newOrg = new Organization();
    
              return {
                user_id: User.user_id,
                org_id: orgId,
                name: name,
                ware_type: 2
              };
            });
  
            if (inserts && inserts.length > 0) {
              while (1) {
                let rows = inserts.slice(0, 500);
                let sql = Squel.insert().into( this.table );
                sql.setFieldsRows(rows);
                Organization.exec(sql);
  
                inserts = inserts.slice(500);
                if (!inserts || inserts.length == 0)
                  break;              
              }
            }
    
            /*keys.map( orgId => {
              let name = data.Organizations[orgId];
              let newOrg = new Organization();
              newOrg.setData({
                user_id: User.user_id,
                org_id: orgId,
                name: name,
                ware_type: 2
              });
              newOrg.save();
            });*/
    
            return this.updateOrganizationsStorage();
          }).then( result => {
            resolve("OK");
          }).catch( error => {
            reject( error );
          });
        },
        error: (data) => {
          reject( data ); 
        }
      });
    });
  }

  /**
   * 更新入库的机构
   */
  static updateOrganizationsStorage() {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.getOrganizationStorage,
        alertOnError: false,
        success: (data) => {
          let query = Organization.query('delete');
          query.where('user_id = ' + User.user_id);
          query.where("ware_type = 1");
          Organization.exec(query).then( () => {
            let keys = Object.keys(data.Organizations);
          
            let inserts = keys.map( orgId => {
              let name = data.Organizations[orgId];
              //let newOrg = new Organization();
    
              return {
                user_id: User.user_id,
                org_id: orgId,
                name: name,
                ware_type: 1
              };
            });
    
            if (inserts && inserts.length > 0) {
              while (1) {
                let rows = inserts.slice(0, 500);
                let sql = Squel.insert().into( this.table );
                sql.setFieldsRows(rows);
                Organization.exec(sql);
    
                inserts = inserts.slice(500);
                if (!inserts || inserts.length == 0)
                  break;              
              }
            }

            resolve( "OK" );
          }).catch( error => {
            reject( error );
          });
  
        },
        error: (data) => {
          reject( data );
        }
      });
    });
  }

  /**
   * search products by keywords
   */
  static searchOrganizations(keywords, wareType) {
    let query = Organization.query();
    query.where("name like '%" + keywords + "%'");
    if (wareType)
      query.where("ware_type = " + wareType);
    else
      query.where("ware_type = 2");
      
    query.order("id", true);

    return new Promise( (resolve, reject) => {
      Organization.exec(query).then( list => {
        resolve(list);
      }).catch(error => {
        reject(error);
      });
    });
  }
}