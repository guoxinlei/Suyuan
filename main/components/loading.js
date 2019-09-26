import React from 'react';
import {
  View,
  ActivityIndicator,
  ProgressBarAndroid,
  Platform,
  Dimensions,
  Image,
  Text
} from 'react-native';

import Constants from "./constants.js";
import {BubblesLoader, CirclesLoader, PulseLoader, TextLoader, DotsLoader, LineDotsLoader} from 'react-native-indicator';

class Loading extends React.Component {
  render() {
    let paddingLeft = (Platform.OS === 'android' ? 20 : 23);
    let loadingComponent = (
      <Text style={{ fontSize: 24, color: '#ccc' }}>{Constants.app_name}</Text>
    );
    if (!this.props.indicator)
      loadingComponent = (
        <CirclesLoader size={50} color="#e0e0e0" dotRadius={14}/>
      );

    return (
      <View style={{ position: 'absolute', top: 150, flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: "center", flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0)', width: Dimensions.get("window").width }}>
        {loadingComponent}
      </View>
    );
  }
}

export default Loading;
