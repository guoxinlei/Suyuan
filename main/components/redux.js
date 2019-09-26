/**
 * redux connect function for component
 */
import {Actions} from 'react-native-router-flux';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as ReduxActions from '../redux/actions';

/**
 * map state to props
 * all state map to this.props.redux.xxxx
 */
function mapStateToProps(state, items) {
  let obj = {redux:{}};
  if (typeof items == 'string') {
    obj.redux[items] = state[items];
  }
  else if (typeof items == 'array') {
    items.map( v => {
      obj.redux[v] = state[v];
    });
  }
  return obj;
}

/**
 * map actions to props
 * all actions map to this.props.actions.xxxx
 */
function mapDispatchToProps(dispatch, items) {
  let obj = { actions:{} };
  if (typeof items == 'string') {
    obj.actions[items] = bindActionCreators(ReduxActions[items], dispatch);
  }
  else if (typeof items == 'array') {
    items.map( v => {
      obj.actions[v] = bindActionCreators(ReduxActions[v], dispatch);
    });
  }
  return obj;
}

/**
 * @param component: connect component
 * @param stateItem: connect state item (key), can be string or array
 * @param actionItem: bind action item, can be string or array
*/
export default function(component, stateItem, actionItem) {
  return connect(
    state => mapStateToProps(state, stateItem),
    dispatch => mapDispatchToProps(dispatch, actionItem)
  )(component);
}
