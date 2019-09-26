'use strict';

import React from 'react';
import {
  View,
  ListView,
  ScrollView,
  TextInput,
  Platform,
  findNodeHandle,
  KeyboardAvoidingView,
} from 'react-native';

import dismissKeyboard from 'dismissKeyboard';
import TimerMixin from 'react-timer-mixin';

const FormContainer = React.createClass({
  mixins: [TimerMixin],
  scrollTo(params) {
    this.refs.scrollView.scrollTo(params);
  },
  render() {
    return (
      <ScrollView {...this.props}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps="always"
        ref="scrollView">
        <View onStartShouldSetResponderCapture={(e) => {
          let target = e.nativeEvent.target;
          this.setTimeout(() => {
            const focusField = TextInput.State.currentlyFocusedField();
            if (focusField != null && target != focusField) {
              dismissKeyboard();
            }
          }, 200);

        }}>
          {this.props.children}
        </View>
      </ScrollView>
    );
  }
});

export default FormContainer;
