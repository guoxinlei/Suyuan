/**
 * set user into state
 */
export function setUser(params) {
  let obj = Object.assign({type:'setUser'}, params);
  return obj;
}

/**
 * save user into AsyncStorage & update state
 */
export function saveUser(params) {
  let obj = Object.assign({type:'saveUser'}, params);
  return obj;
}

/**
 * logout user & update state
 */
export function logout() {
  return {
    type:'logout'
  }
}

/**
 * check user login status
 */
export function checkLogin() {
  return {
    type: 'checkLogin'
  }
}
