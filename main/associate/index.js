import {
  React,
  View,
  Text,
  Button,
  StyleSheet,

  Base,
  Tools,
  Constants,
  Screen
} from 'components';

export default class Associate extends Base {
  constructor(props) {
    super(props);

    this.navItems = {
      rightItem: {},
      leftItem: {},
      title: {
        text: '关联'
      }
    }
  }

  getView() {
    return (
      <View style={styles.container}>
        <Button title="单瓶关联" onPress={() => this.navigator.push('associateBottle')}/>
        <Button title="瓶箱关联" onPress={() => this.navigator.push('associateBox')}/>
        <Button title="组垛" onPress={() => this.navigator.push('associateStack')}/>
        <Button title="返回" onPress={() => this.navigator.pop()} style={{marginTop:20, backgroundColor:'#fff'}}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: Screen.width,
    height: Constants.contentHeight,
    alignItems:'center',
    justifyContent:'center'
  }
});
