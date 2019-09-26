import {
  StyleSheet
} from 'react-native';

import Screen from './screen';
import Constants from './constants';

const styles = StyleSheet.create({
  container: {
    width: Screen.width,
    height: Constants.contentHeight,
    backgroundColor:'#f5f5f5'
  },
  row: {
    flexDirection:'row',
    alignItems:'center',
    padding:10,
    paddingVertical:6*Constants.scaleRate,
    backgroundColor:'#fff',
    borderBottomColor:'#ddd',
    borderBottomWidth:1
  },
  rowText: {
    fontSize: 16,
    color: '#555'
  },
  rowText2: {
    fontSize: 16,
    color: Constants.color.blue
  },
  row2: {
    flexDirection:'column',
    justifyContent:'flex-start',
    backgroundColor:'#fff',
    borderBottomWidth:1,
    borderBottomColor:'#ddd'
  },
  rowRight: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  selectBox: {
    borderWidth:1,
    borderColor:'#ccc',
    flexDirection:'row',
    alignItems:'center',
    paddingRight:10
  },
  modalContainer: {
    width: Screen.width,
    height: Screen.height,
    backgroundColor:'rgba(0,0,0,.3)',
    alignItems:'center',
    justifyContent:'center'
  },
  productItem: {
    padding: 15,
    borderBottomWidth:1,
    borderBottomColor: '#ccc',
    backgroundColor:'#fff'
  },
  textInput: {
    borderWidth:0.5,
    borderColor: '#ccc',
    borderRadius:4,
    overflow:'hidden',
    height: Constants.scaleRate > 1.5 ? 35:26,
    width: 50,
    paddingTop:Constants.isAndroid ? (Constants.scaleRate > 1.5 ? 8:3):(Constants.scaleRate > 1.5 ? 10:8),
    paddingLeft:10,
    marginLeft: 30,
    backgroundColor:'#f4f4f4'
  },
  textInputFocus: {
    borderColor: Constants.color.yellow
  },
  modalBox: {
    width:Screen.width-60,
    height: 200,
    backgroundColor:'#fff',
    borderRadius:8,
    padding:20,
    alignItems:'center',
    justifyContent:'center'
  },
  segmentBox: {
    flexDirection: 'row',
    alignItems:'center',
    marginTop:13,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    backgroundColor:'#fff'
  },
  segmentItem: {
    width: Screen.width/2,
    padding: 8 * Constants.scaleRate,
    alignItems:'center',
    justifyContent:'center',
    borderBottomWidth:2,
    borderBottomColor: 'transparent'
  },
  segmentItem2: {
    width: Screen.width/3,
    padding: 10,
    alignItems:'center',
    justifyContent:'center',
    borderBottomWidth:2,
    borderBottomColor: 'transparent'
  },
  segmentItemActive: {
    borderBottomColor: Constants.color.yellow,
  },
  segmentText: {
    fontSize: 17,
    fontWeight: Constants.fonts.bold1,
    color: '#888'
  },
  segmentTextActive: {
    color: Constants.color.yellow
  },
  mask: {
    position:'absolute',
    left:0,
    top:0,
    right:0,
    bottom:0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:'center',
    justifyContent:'center',
    paddingHorizontal: 20,
  },
  maskContent: {
    backgroundColor:'#fff',
    padding: 20
  },
  maskText: {
    fontSize: 18,
    fontWeight: Constants.fonts.bold1,
    color: Constants.color.black4,
    marginBottom: 10
  },
  offlineItemBox: {
    marginTop: 6 * Constants.scaleRate,
    borderTopWidth:1,
    borderBottomWidth:1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 6*Constants.scaleRate,
  },
  offlineItemHeader: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent: 'space-between'
  },
  offlineItemHeaderText: {
    fontSize: 16,
    color: '#555',
    width: Screen.width - 160
  },
  offlineItemDateText: {
    fontSize: 14,
    color: Constants.color.black2
  },
  offlineItemBody: {
    marginTop: 4 * Constants.scaleRate,
  },
  offlineItemBodyText: {
    fontSize: 16,
    color: '#555'
  },
  associateItemsContainer: {
    borderTopWidth:1,
    borderTopColor: 'lightgrey',
    marginTop:10
  },
  associateItemsBox: {
    backgroundColor: '#fff',
    padding: 8 * Constants.scaleRate,
    paddingBottom: 4*Constants.scaleRate,
    borderBottomWidth:1,
    borderBottomColor: 'lightgrey'
  },
  associateItemSubject: {
    fontSize: 16,
    color: Constants.color.black4,
    marginBottom: 8
  },
  associateItemCodeBox: {
    flexDirection:'row',
    alignItems:'center',
    marginBottom:4
  },
  associateItemCodeText: {
    fontSize: 16,
    color: 'lightgrey',
    marginLeft:3
  },
  rowQueryText: {
    fontSize:16,
    color: 'red',
    marginLeft: 20
  },
  maskRow: {
    flexDirection:'row',
    alignItems:'center',
    borderBottomColor: 'lightgrey',
    borderBottomWidth:1,
    height: 60,
    paddingLeft:4
  },
  maskInfo: {
    alignItems:'center',
    justifyContent:'center',
    padding:8
  },
  maskInfoText: {
    fontSize:16,
    color: 'red'
  },
  buttonBox: {
    width:Screen.width, 
    paddingLeft:13,
    paddingRight:14, 
    marginTop:12, 
    alignItems:'center', 
    justifyContent:'space-between', 
    flexDirection:'row'
  },
  checkBox: {
    width: 18,
    height:18,
    borderRadius:9,
    borderWidth:1,
    borderColor: 'grey',
    marginRight:5,
    overflow:'hidden',
    alignItems:'center',
    justifyContent:'center',
    paddingTop:1
  }
});

export default styles;
