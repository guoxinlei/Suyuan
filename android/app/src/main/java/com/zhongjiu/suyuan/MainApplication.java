package com.zhongjiu.suyuan;

import android.app.Activity;
import android.app.Application;
import android.content.pm.ApplicationInfo;

import com.RNFetchBlob.RNFetchBlobPackage;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactApplication;
import com.reactnativecomponent.amaplocation.RCTAMapLocationPackage;
import com.github.reactnativecommunity.location.RNLocationPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import org.reactnative.camera.RNCameraPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rnfs.RNFSPackage;
import com.zhongjiu.suyuan.BuildConfig;
import com.reactnativecomponent.splashscreen.RCTSplashScreenPackage;


import org.pgsqlite.SQLitePluginPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    final ReactNativeHost _this = this;

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RCTAMapLocationPackage(),
            new RNLocationPackage(),
              new RNFSPackage(),
              new RNDeviceInfo(),
              new VectorIconsPackage(),
              new RNCameraPackage(),
              new ToolsPackage(),
              new SQLitePluginPackage(),
              new RNFetchBlobPackage(),
              new RCTSplashScreenPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
