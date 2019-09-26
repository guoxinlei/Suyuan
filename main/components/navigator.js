import React from 'react';
import NavBar from "./navbar";

import NavigationStack from '../models/navigation-stack';

/**
 * navigator component: implement router-flux Actions
 *
 */
export default class Navigator {
  constructor(props) {
    this.componentUnmount = false;

    this.navigator = NavigationStack.navigator;
  }

  /**
   * set navigator object
   */
  setNavigator(navigator) {
    this.navigator = navigator;
    NavigationStack.navigator = navigator;
  }

  setComponentUnmount() {
    this.componentUnmount = true;
  }

  // push view
  push(name, params, force) {
    console.log('push:' + name);
    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    if (NavigationStack.isPopPushing)
      return;

    NavigationStack.isPopPushing = true;
    setTimeout( () => {
      NavigationStack.isPopPushing = false;
    }, 300);

    if (!params) {
      params = {};
    }

    let pushFunc = params.newView ? navigator.push:navigator.navigate;

    // force push
    if (params && params.force) {
      NavigationStack.push(name);
      pushFunc(name, params);
      return;
    }

    // don't push on unmounted component
    if (this.componentUnmount && !force)
      return;

    NavigationStack.push(name);

    // check login status on specific scenes
    if (name == 'IndexUserHome' || name == 'userIndex' || name == 'IndexMessages') {
      if (!global.User.isLogin) {
        pushFunc('preLogin', {from: 'userHome'});
        NavigationStack.push('preLogin');
        return;
      } else {
        pushFunc(name, params);
      }
    }
    // check vip status
    else if (name == 'logoList' || name == 'qrList' || name == 'qrUploader' || name == 'logoUploader') {
      if (!global.User.isLogin) {
        //Actions.preLogin({direction:'vertical', from: 'userHome'});
        pushFunc('preLogin');
        NavigationStack.push('preLogin');
        return;
      } else {
        pushFunc(name, params);
      }
    } else {
      pushFunc(name, params);
    }
  }

  // pop view
  pop(params, force) {
    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    if (NavigationStack.isPopPushing)
      return;

    NavigationStack.isPopPushing = true;
    // don't push on unmounted component
    if (!force && this.componentUnmount)
      return;

    NavigationStack.pop();

    navigator.pop();
    /*
    if (params) {
      setTimeout(() => {
        Actions.refresh(params);
      },100);
    }*/

    setTimeout( () => {
      NavigationStack.isPopPushing = false;
    }, 300);
  }

  // replace view
  replace(name, params) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    if (!params)
      params = {};

    NavigationStack.pop();
    NavigationStack.push(name);
    navigator.replace(name, params);
  }

  // pop to top view
  popTop(tab) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    NavigationStack.popTop();

    navigator.popToTop();
  }

  // pop to named scene
  popTo(name) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    //Actions.popTo(name, {type:ActionConst.RESET});
    let stacks = NavigationStack.stacks;
    for (let i = stacks.length-1; i >= 0; i--) {
      let route = stacks[i];
      if (route == name) {
        this.popN(stacks.length-i-1);
        return;
      }
    }
  }

  /**
   *  pop to N route
   *  N = 2, 3
   */
  popN(num) {
    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    navigator.pop(num);
  }

  // pop to the scene befor login
  popBeforeLogin() {
    let stacks = NavigationStack.stacks;
    for (let i = stacks.length-1; i >= 0; i--) {
      let name = stacks[i];
      if (name == 'preLogin') {
        this.popN(stacks.length-i);
        return;
      }
    }
  }

  // refresh
  refresh(params) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    //Actions.refresh(params);
    navigator.setParams(params);
  }

  // get previous scene key
  getPrevious() {
    let stacks = NavigationStack.stacks;
    let name = stacks[stacks.length-2];
    return name;
  }

  // hide or show navigation bar
  hideNavBar(status) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    //Actions.refresh({hideNavBar: status});
  }

  // render navigation bar
  renderNavigationBar(props) {
    // don't push on unmounted component
    if (this.componentUnmount)
      return;

    return (<NavBar {...props}/>)
  }

  // go back from a specific route
  goBack(routeName) {
    let navigator = this.navigator || NavigationStack.navigator;
    if (!navigator)
      return;

    navigator.goBack(routeName);
  }
}
