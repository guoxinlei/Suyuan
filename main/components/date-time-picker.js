import React from 'react';

import {
  View,
  Text,
  DatePickerAndroid,
  DatePickerIOS,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';

// constants
import Constants from './constants';

// siblings
import Siblings from './siblings';

// screen
import Screen from './screen';

// colors
import Colors from './colors';

// touchable
import Touchable from './touchable';

// date time picker (for android)
import DatePicker from 'react-native-datepicker';

// moment
import Moment from 'moment';

/**
 * DatePickerIOS wrapper
 */
class DatePickerIOSWrapper extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      selectedDate: props.initialDate || new Date(),
      bounceValue: new Animated.Value(0)
    };
  }

  componentDidMount() {
    new Animated.timing(this.state.bounceValue, {
      toValue: 1,
      duration:200,
      easing: Easing.linear
    }).start();
  }

  /**
   * select date
   */
  onDateChange(newDate) {
    this.setState({selectedDate: newDate});
    this.props.onSelect && this.props.onSelect(newDate);
  }

  /**
   * dismiss modal
   */
  dismiss(type) {
    new Animated.timing(this.state.bounceValue, {
      toValue: 0,
      duration:200,
      easing: Easing.linear
    }).start();
    setTimeout( () => {
      this.props.onDismiss && this.props.onDismiss(type);
    }, 200);
  }

  render() {
    let translateY = this.state.bounceValue.interpolate({
      inputRange: [0, 1], outputRange: [-300, 0]
    });
    return (
      <TouchableWithoutFeedback 
          onPress={() => this.dismiss('cancel')}>
        <View style={styles.dateContainer}>
          <Animated.View style={[styles.dateWrapper, {bottom: translateY}]}>
            <View style={styles.dateHeader}>
              <Touchable onPress={() => this.dismiss('cancel')} style={styles.confirmButton}>
                <Text style={styles.cancelButtonText}>取 消</Text>
              </Touchable>
              <Touchable onPress={() => this.dismiss('confirm')} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>确 定</Text>
              </Touchable>
            </View>
            <DatePickerIOS 
              date={this.state.selectedDate} 
              maximumDate={this.props.maximumDate}
              mode={this.props.mode} onDateChange={this.onDateChange.bind(this)} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

/**
 * show date time picker
 */
export default  {
  /**
   * set date to parent
   */
  onSelect: null,

  /**
   * selected date
   */
  selectedDate: new Date(),

  /**
   * dismiss self
   * @param {string} type: confirm | cancel
   */
  dismiss(type, force) {
    if (type == 'confirm') {
      // set date
      this.onSelect && this.onSelect(this.selectedDate);
    }

    // destroy modal
    if (Constants.isIOS || force)
      Siblings.destroy();
  },

  /**
   * set selected date
   */
  setDate(date, type) {
    this.selectedDate = date;

    if (type == 'dismiss')
      this.dismiss('confirm', true);
  },

  /**
   * show date picker
   */
  async selectDate(onSelect, mode, maximumDate, currentDate) {
    this.onSelect = onSelect;

    // ios device
    if (Constants.isIOS) {
      Siblings.show(
        <DatePickerIOSWrapper 
          initialDate={this.selectedDate} 
          onSelect={(date) => this.setDate(date)}
          onDismiss={this.dismiss.bind(this)}
          maximumDate={maximumDate}
          mode={mode || 'date'}
        />
      );
    } 
    // android device
    else {
      // date time mode, using DatePicker component
      if (mode == 'datetime') {
        Siblings.show(
          <DatePicker
            style={{width: 200, marginTop:-200}}
            date={currentDate || this.selectedDate}
            mode="datetime"
            placeholder="select date"
            format="YYYY-MM-DD HH:mm:SS"
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            showIcon={false}
            onDateChange={(date) => {this.setDate(new Date(Moment(date).unix() * 1000), 'dismiss')} }
            onCloseModal={ () => this.dismiss('cancel', true)}
            ref={(ref) => this.datePicker = ref}
          />
        );

        setTimeout( () => {
          this.datePicker.onPressDate();
        }, 100);
        return;
      }

      // date mode
      try {
        const {action, year, month, day} = await DatePickerAndroid.open({
          // Use `new Date()` for current date.
          // May 25 2020. Month 0 is January.
          date: this.selectedDate,
          maxDate: maximumDate
        });
        if (action !== DatePickerAndroid.dismissedAction) {
          // Selected year, month (0-11), day
          this.setDate(new Date(year, month, day));
          this.dismiss('confirm');
        }
      } catch ({code, message}) {
        console.warn('Cannot open date picker', message);
      }
    }
  }
}

const styles = StyleSheet.create({
  dateContainer: {
    width:Screen.width, 
    height: Screen.height
  },
  dateWrapper: {
    position:'absolute',
    left:0,
    bottom:-300,
    width: Screen.width,
    height: 260,
    backgroundColor:'#fff',
  },
  dateHeader: {
    height: 50,
    alignItems:'center',
    justifyContent:'center',
    borderBottomWidth:1,
    borderBottomColor: Colors.border,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between'
  },
  dateHeaderText: {
    fontSize:14,
    color: '#959595'
  },
  confirmButton: {
    paddingHorizontal:16
  },
  confirmButtonText: {
    fontSize:18,
    color: Colors.blue
  },
  cancelButton: {
    
  },
  cancelButtonText: {
    fontSize:18,
    color: Colors.blue
  }
});