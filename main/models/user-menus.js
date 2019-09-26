import SQLite from './sqlite';

// constants
import {Constants, Tools} from 'components';

// user model
import User from './user';

/**
 * user menu model
 */
export default class UserMenu extends SQLite {
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
    return 'user_menus';
  }

  /**
   * model instance
   */
  static get model() {
    return UserMenu;
  }

  /**
   * get menus
   */
  static getMenus() {
    return new Promise( (resolve, reject) => {
      let query = UserMenu.query();
      query.where("user_id = " + User.user_id);
      query.order("id", true);
      UserMenu.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * get production lines from server & save into sqlite
   */
  static updateMenus() {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.userMenu,
        alertOnError: false,
        success: (data) => {
          let query = UserMenu.query('delete');
          query.where('user_id = ' + User.user_id);
          UserMenu.exec(query);
  
          let userMenu = data.usermenulist;
          userMenu.map( menu => {
            let newMenu = new UserMenu();
            newMenu.setData({
              user_id: User.user_id,
              menu_code: menu.MenuCode,
              menu_name: menu.MenuName,
              menu_icon: menu.IconUrl
            });
            newMenu.save();
          });
          
          UserMenu.getMenus().then( list => {
            resolve(list);
          }).catch( error => {
            reject(error);
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}