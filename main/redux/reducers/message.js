import {User} from 'models';

const initialState = {
  message: {}
};

export default function message(state = initialState, action = {}) {
  switch (action.type) {
    case 'setMessage':
      return {
        ...state,
        message: action.message
      };
    default:
      return state;
  }
}
