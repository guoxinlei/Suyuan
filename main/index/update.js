'use strict';

// load common components
import {
  // react-native components
  React,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  ListView,
  Animated,
  Platform,
  ScrollView,
  Alert,
  Linking,
  InteractionManager,

  // self and third-party components
  Constants,
  Loading,
  Reload,
  Styles,
  Tools,
  Icons,
  Screen,
  Base
} from "components";

//import rnfs from 'react-native-fs';
import RNFB from 'react-native-fetch-blob';

class Update extends Base {
  constructor(props) {
    super(props, {
      isDownloading: true,
      progress: null,
      downloadJobId: 0,
      isCancel: false,
    });

    this.downloadTask = null;
  }

  componentWillUnmount() {
    this.unmount = true;
    this.stopDownload();
    //Tools.setBarStyle("light-content");
  }

  componentDidMount() {
    let _this = this;
    this.setTimeout(function () {
      _this.download();
    }, 200);
  }
  
  async download() {
    this.setState({ isDownloading: true });
    let url = this.props.url;
    let path = Constants.cachePath;

    RNFB.fs.mkdir(path).then( () => {
      this.doDownload();
    }).catch( error => {
      this.doDownload();
    });
 
  }

  doDownload() {
    let url = this.props.url;
    let path = Constants.cachePath;

    let tempFile = path + "/zhongjiuyunma2.apk";

    this.downloadTask = RNFB
      .config({
        path : tempFile
      })
      .fetch('GET', url)
      // listen to download progress event, every 10%
      .progress((received, total) => {
        if (!this.unmount)
          this.setState({ progress: parseInt((received/total)*100) });
      });

    this.downloadTask.then((resp) => {
      if (!this.unmount && !this.state.isCancel) {
        Tools.installApk(tempFile);
      }
    })
    .catch((err) => {
      Alert.alert("出错了", "请稍后重试");
    });

  }
  
  // download process
  progress(data) {
    if (!this.unmount)
      this.setState({ progress: data });
  }

  // stop download
  stopDownload() {
    this.setState({ isCancel: true });
    this.downloadTask && this.downloadTask.cancel();
    //rnfs.stopDownload(this.state.downloadJobId);
    this.navigator.pop();
  }
  getView() {
    let progress = 0;
    if (this.state.progress)
      progress = this.state.progress;
    let progressText = progress + "%";
    let barLeft = 0, align = "center";

    return (
      <View style={{ height: Constants.contentHeight, backgroundColor: '#fff' }}>
        <View style={{ marginTop: 40, width: Screen.width, alignItems: 'flex-start', justifyContent: 'flex-start', height: 30, backgroundColor: '#ccc' }}>
          <View style={{ height: 30, width: Screen.width * progress * 0.01, backgroundColor: 'rgb(245,155,38)' }}>
          </View>
          <View style={[styles.progressTextBar, { left: barLeft, alignItems: align }]}>
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => this.stopDownload()}>
          <View style={styles.buttonBox}>
            <Text style={styles.buttonText}>取消</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  progressTextBar: {
    position: 'absolute',
    top: 6,
    width: Screen.width,
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: 'transparent'
  },
  progressText: {
    fontSize: 12,
    paddingTop: 3,
    color: 'white'
  },
  buttonBox: {
    marginTop: 40,
    marginLeft: 20,
    marginRight: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: 'steelblue',
    padding: 8,
    width: 120,
  },
  buttonText: {
    color: '#fff'
  }
});

export default Update;
