'use  strict';

import React from 'react';

import {
  StyleSheet,
  WebView,
  View,
  TouchableOpacity,
  Image,
  Text,
  Platform,
  Alert,

  Screen,
  Base,
  Tools,
  Constants,
  Icons
} from 'components';


export default class MyWebView extends Base {
  constructor(props) {
    super(props);

    this.navItems = {
      rightItem: {
        component: (
          <TouchableOpacity style={{ marginRight: 5, padding: 5, marginTop:-5 }} onPress={() => this.reload()}>
            <Icons.FontAwesome name="refresh" size={18} color='#fff' />
          </TouchableOpacity>
        ),
      }
    }
  }

  componentDidMount() {

  }

  reload() {
    if (this.refs.webview)
      this.refs.webview.reload();
  }

  onNavigationStateChange(navState) {
    // close: pop navigator
    if (navState.url == "webview://close") {
      this.refs.webview.stopLoading();
      this.navigator.pop();
      return false;
    }
  }

  error(e) {

  }

  getView() {
    let url = this.props.url;

    return (
      <View style={{ width: Screen.width, height: Constants.contentHeight}}>
        <WebView
          ref="webview"
          automaticallyAdjustContentInsets={false}
          style={{ width: Screen.width, height: Constants.contentHeight }}
          source={{ uri: url }}
          javaScriptEnabled={true}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
        />
      </View>
    );
  }
}
