import {
  React,
  AsyncStorage,
  Platform,
  Constants,
  Tools
} from 'components';

const User = {
  // login status
  isLogin: false,
  // login token
  token: null,
  // offline mode
  offline: false,

  /**
   * check user login status
   */
  async checkLogin() {
    //return new Promise(async(resolve, reject) => {
    var value = await AsyncStorage.getItem(Constants.storage_login);
    if (value) {
      this.token = value;
      this.isLogin = true;
      let user = this.getUser();
      this.user_id = user.user_id;
      this.username = user.username;
      this.avatar = user.avatar;
      this.coderules = user.coderules;
      this.orgId = user.orgId;
      this.orgName = user.orgName;
      return value;
      //resolve(Object.assign({}, value));
    }

  },

  /**
   * save user login token
   */
  saveToken(info) {
    var str = JSON.stringify(info);
    AsyncStorage.setItem(Constants.storage_login, str);
    this.isLogin = true;
    this.token = str;

    User.isLogin = true;
    User.token = str;
    User.user_id = info.user_id;
    User.avatar = info.avatar;
    User.username = info.username;
    User.coderules = info.coderules;
    User.orgId = info.orgId;
    User.orgName = info.orgName;

  },

  /**
   * get user
   */
  getUser() {
    if (this.token != null) {
      let user = JSON.parse(this.token);
      if (user)
        user.user_id = user.userid;
      return user;
    }

    return { userid: 0, token: "" };
  },

  /**
   * user logout
   */
  logout() {
    AsyncStorage.removeItem(Constants.storage_login);
    this.isLogin = false;
    this.token = null;

    User.isLogin = false;
    User.token = null;
  },

  /**
   * check rules
   */
  checkRule(type, code) {
    if (code.indexOf('sy.qkj.com.cn') > 0)
      return true;
      
    let rule = User.coderules[type];
    if (!rule)
      return true;

    // 瓶码规则：检查长度，多个长度之间用逗号隔开
    if (type == 'innercode') {
      let info = rule.split(",");
      for (let i = 0; i < info.length; i++) {
        let checkLen = info[i].trim();
        if (!checkLen)
          continue;

        if (code.length == parseInt(checkLen)) {
          return true;
        }
      }

      return false;
    }

    // 其他规则：检查开头，多个规则之间用逗号隔开
    let info = rule.split(",");
    for (let i = 0; i < info.length; i++) {
      let checkRule = info[i].trim();
      if (!checkRule)
        continue;

      if (code.startsWith(checkRule))
        return true;
    }

    return false;
  }

}

export default User;
