import React from 'react';

import {
  View,
  Text,
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  PanResponder,
  ActivityIndicator
} from 'react-native';

import {CirclesLoader} from 'react-native-indicator';

export default class RefreshableView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.contentHeight = 0;
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  scrollTo(params) {
    if (this.refs.listView && this.refs.listView.scrollTo)
      this.refs.listView.scrollTo(params);
  }

  scrollToEnd(params) {
    if (this.refs.listView && this.refs.listView.scrollToEnd)
      this.refs.listView.scrollToEnd(params);
  }

  setNoMoreData() {

  }

  keyExtractor = (item, index) => {
    let k = item.key || "item"+ (item.id || index);
    /*if (this.props.numColumns)
      k = 'col'+this.props.numColumns+k;*/

    return k;
  }

  renderFooter() {
    if (!this.props.allowInfinite)
      return (<View></View>);

    if (this.props.isInfiniting) {
      return (
        <View style={styles.footerBox}>
          <ActivityIndicator size='small'/>
        </View>
      )
    }

    return (
      <View style={styles.footerBox}>
        <Text></Text>
      </View>
    )
  }

  /**
   * on end reached
   */
  onEndReached() {
    if (this.props.isInfiniting)
      return;

    if (this.props.allowInfinite && this.props.onInfinite)
      this.props.onInfinite();
  }

  // get content height
  getHeight() {
    return this.contentHeight;
  }

  // on content size change
  onContentSizeChange(width, height) {
    //console.log(`${width} ${height}`);
    this.contentHeight = height;
  }

  render() {
    return (
      <FlatList
        ref="listView"
        style={this.props.style}
        data={this.props.data}
        scrollEnabled={this.props.scrollEnabled}
        onRefresh={this.props.onRefresh}
        refreshing={this.props.isRefreshing}
        ListHeaderComponent={this.props.ListHeaderComponent}
        ListFooterComponent={this.renderFooter.bind(this)}
        onScroll={this.props.onScroll}
        numColumns={this.props.numColumns}
        keyExtractor={this.keyExtractor}
        onEndReached={this.onEndReached.bind(this)}
        onContentSizeChange={(width, height) => this.onContentSizeChange(width, height)}
        renderItem={(rowData) => this.props.renderItem(rowData)}>
      </FlatList>
    )
  }
}

const styles = StyleSheet.create({
  footerBox: {
    padding:8,
    alignItems:'center',
    justifyContent:'center'
  }
})
