import {User} from 'models';

const initialState = {
  user: {user: {userid:0, token:null}, isLogin: false},
};

export default function user(state = initialState, action = {}) {
  switch (action.type) {
    case 'setUser':
      return {
        ...state,
        user: action.user,
        isLogin: action.isLogin
      };
    case 'saveUser':
      User.saveToken(action.user);
      return {
        ...state,
        user: action.user,
        isLogin: action.isLogin
      }
    case 'logout':
      return {
        ...state,
        user: {userid:0, token:null},
        isLogin: false
      }
    case 'checkLogin':
      return {
        ...state,
        user: {userid:0, token:null},
        isLogin:false
      }
    default:
      return state;
  }
}
