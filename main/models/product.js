import SQLite from './sqlite';

// constants
import {AsyncStorage, Constants, Tools} from 'components';

// user model
import User from './user';

const Squel = require('squel');

/**
 * product model
 */
export default class Product extends SQLite {
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
    return 'products_v3';
  }

  /**
   * model instance
   */
  static get model() {
    return Product;
  }

  /**
   * get products
   * { id: 15477,
       productname: '52° 水井坊臻酿八号 500ml',
       vol: null,
       capacity: null,
       smallpic: '/Storage/Shop/1/Products/81345' },
   */
  static getProducts(opts) {
    return new Promise( (resolve, reject) => {
      let query = Product.query();
      query.where("user_id = " + User.user_id);
      if ( opts && opts.from && (opts.from == 'stack' || opts.from == 'box') )
        query.where("source_type = 1");

      query.order("id", true);
      Product.exec(query).then( list => {
        resolve(list);
      }).catch( error => {
        resolve(error);
      });
    });
  }

  /**
   * get products from server & save into sqlite
   */
  static updateProducts() {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.getProducts,
        alertOnError: false,
        success: (data) => {
          let query = Product.query('delete');
          query.where('user_id = ' + User.user_id);
          Product.exec(query).then( () => {        
            let inserts = data.products.map( product => {
              let pic = data.picprefix + product.smallpic + data.picsuffix;
              
              return {
                user_id: User.user_id,
                product_id: product.id,
                product_name: product.productname,
                vol: product.vol,
                capacity: product.capacity,
                pic: pic,
                source_type: product.sourceType || 0,
                stackstandard: product.stackstandard || 5
              };
            });
  
            if (inserts && inserts.length > 0) {
              while (1) {
                let rows = inserts.slice(0, 500);
                let sql = Squel.insert().into( this.table );
                sql.setFieldsRows(rows);
                Product.exec(sql);
    
                inserts = inserts.slice(500);
                if (!inserts || inserts.length == 0)
                  break;              
              }
            }

            resolve("OK");
  
          }).catch( error => {
            reject( error );
          });
  
        },
        error: ( data ) => {
          reject( data );
        }
      });
    });
  }

  /**
   * search products by keywords
   */
  static searchProducts(keywords, from) {
    let query = Product.query();
    query.where("user_id = " + User.user_id);
    query.where("product_name like '%" + keywords + "%'");

    if (from == 'box' || from == 'stack')
      query.where("source_type = 1");

    query.order("id", true);

    return new Promise( (resolve, reject) => {
      Product.exec(query).then( list => {
        resolve(list);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * get product by productid
   */
  static getProductById(productId) {
    let query = Product.query();
    query.where("product_id = " + productId);

    return new Promise( (resolve, reject) => {
      Product.exec(query).then( list => {
        if (list.length >= 0)
          resolve(list[0]);
        else
          reject('Not Found');
      }).catch(error => {
        console.log(error);
        reject(error);
      });
    });
  }

  /**
   * search products by code
   */
  static searchProductsByCode(code) {
    return new Promise( (resolve, reject) => {
      Tools.post({
        url: Constants.api.getProductByCode,
        data: {code},
        success: (data) => {
          let products = [];
          if (!data || !data.products || data.products.length == 0) {
            resolve(products);
            return;
          }

          data.products.map( product => {
            Product.getProductById(product.id).then( pro => {
              products.push(pro);
            }).catch( error => {
              let newProduct = new Product();
              newProduct.setData({
                user_id: User.user_id,
                product_id: product.id,
                product_name: product.productname,
                vol: product.vol,
                capacity: product.capacity,
                pic: data.picprefix + product.smallpic + data.picsuffix
              });
              newProduct.save();
  
              products.push(newProduct);
            });
          });

          setTimeout( () => {
            resolve(products);
          }, 1000);
        },
        error: (data) => {
          reject(data);
        }
      });
    } );
  }
}