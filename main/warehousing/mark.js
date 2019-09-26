import {
  React,
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  ScrollView,
  Image,
  Keyboard,

  Base,
  Tools,
  Constants,
  Screen,
  Icons,
  ReduxConnect,
  Touchable
} from 'components';

// text input maximum words
const textMaxWords = 300;

import {KeyboardAvoidingView} from 'react-native';


export default class ProductMark extends Base {
  constructor(props) {
    super(props, {
      txtFocus: false,
      keyboardHeight: 0,
      txtContent: props.formno || '',
      finished: false
    });

    this.navItems = {
      leftItem: {
        text: '取消'
      },
      title: {text: '重置单号'},
      rightItem: {text: '提交'}
    }
  }

  /**
   * component mounted event
   */
  componentDidMount() {
    super.componentDidMount();

    // set initial content
    if (this.props.mark) {
      let keys = Object.keys(this.props.mark);
      if (keys.length > 0) {
        let date = keys[0];
        this.setState({txtContent: this.props.mark[date]});
      }
    }

    // focus input
    setTimeout( () => {
      this.refs.textInput && this.refs.textInput.focus();
    }, 500);
  }


  /**
   * content input focus
   */
  onInputFocus() {
    this.setState({txtFocus:true});
  }

  /**
   * input blur event
   */
  onInputBlur() {
    this.setState({txtFocus:false});
  }

  /**
   * text input change event
   */
  onChange(event) {
    let oldContent = this.state.txtContent;
    let newContent = event.nativeEvent.text;

    if (newContent.length > textMaxWords)
      return;

    this.setState({
      txtContent: event.nativeEvent.text
    });
  }

  /**
   * submit mark
   */
  onRight() {
    // 完成状态：返回
    if (this.state.finished) {
      this.navigator.pop();
      return;
    }

    let content = this.state.txtContent.trim();
    if (!content) {
      Tools.alert("请输入单号", "单号不能为空");
      return;
    }
    
    this.props._parent && this.props._parent.setWareNO(content);
    this.navigator.pop();
  }

  /**
   * render text input field
   */
  renderTextInput() {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="请输入单号"
          placeholderTextColor="#555"
          underlineColorAndroid="transparent"
          multiline={true}
          onFocus={() => this.onInputFocus()}
          onBlur={() => this.onInputBlur()}
          onChange={(event) => this.onChange(event)}
          value={this.state.txtContent} ref="textInput"
        />
      </View>
    );
  }

  /**
   * render main view
   */
  getView() {

    return (
      <View style={styles.container}>
        {this.renderTextInput()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: Screen.width,
    height: Constants.contentHeight,
    backgroundColor: '#fff',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    fontSize: 14,
    color: Constants.color.black,
    marginHorizontal:8
  },
  headerTextCount: {
    fontSize:14,
    color: '#555'
  },
  headerTextAllow: {
    fontSize:14,
    color: Constants.color.lightGrey
  },
  textInput: {
    marginTop: 15,
    height: 60,
    width: Screen.width-33,
    lineHeight: 20,
    fontSize: 14,
    color: Constants.color.black,
    textAlignVertical:'top'
  }
});