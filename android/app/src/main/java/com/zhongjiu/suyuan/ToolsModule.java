package com.zhongjiu.suyuan;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.support.annotation.Nullable;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;

//import com.alibaba.sdk.android.push.CloudPushService;
//import com.alibaba.sdk.android.push.CommonCallback;
//import com.alibaba.sdk.android.push.noonesdk.PushServiceFactory;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.zhongjiu.suyuan.BuildConfig;
//import com.umeng.analytics.MobclickAgent;

import java.io.File;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ToolsModule extends ReactContextBaseJavaModule {

    private static final String DURATION_SHORT_KEY = "SHORT";
    private static final String DURATION_LONG_KEY = "LONG";

    private Activity mActivity;
    private ReactContext _context;

    public ToolsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mActivity = reactContext.getCurrentActivity();
        _context = reactContext;
    }

    @Override
    public String getName() {
        return "ToolsModule";
    }

    @ReactMethod
    public void exitApp() {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);//***Change Here***
        mActivity.startActivity(intent);
        System.exit(0);
    }

    @ReactMethod
    public void changeStatusBarColor(String color) {
        Window window = getCurrentActivity().getWindow();

        // clear FLAG_TRANSLUCENT_STATUS flag:
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

        // add FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS flag to the window
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        // finally change the color
        window.setStatusBarColor(Color.parseColor(color));
    }

    /**
     * set status bar text color
     * @param color
     */
    @ReactMethod
    public void changeStatusBarStyle(String color) {
        MainActivity ma = (MainActivity)mActivity;
        //ma.changeStatusBarStyle(color);
    }

    /**
     * open app by packagename & url
     *
     * @param packageName
     * @param activityName
     * @param url
     */
    @ReactMethod
    public void openApp(String packageName, String activityName, String url) {
        Intent intent = new Intent();
        intent.setAction("android.intent.action.VIEW");
        Uri content_url = Uri.parse(url); // 淘宝商品的地址
        intent.setData(content_url);
        intent.setClassName(packageName, activityName);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mActivity.startActivity(intent);
    }

    /**
     * check if a package(app) is installed
     *
     * @param packageName
     * @param callback
     */
    @ReactMethod
    public void isInstalled(String packageName, @Nullable Callback callback) {
        final PackageManager packageManager = mActivity.getPackageManager();
        List<PackageInfo> pinfo = packageManager.getInstalledPackages(0);
        if (pinfo != null) {
            for (int i = 0; i < pinfo.size(); i++) {
                String pn = pinfo.get(i).packageName;
                if (pn.equals(packageName)) {
                    callback.invoke(true);
                    return;
                }
            }
        }

        callback.invoke(false);
    }

    /**
     * install apk
     *
     * @param apkFilePath
     */
    @ReactMethod
    public void installApk(String apkFilePath){

        File apkfile = new File(apkFilePath);
        if (!apkfile.exists()) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
//            Uri contentUri = FileProvider.getUriForFile(_context, "com.zhongjiu.suyuan.fileProvider", apkfile);
//
//            Intent i = new Intent(Intent.ACTION_INSTALL_PACKAGE);
//            i.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
//            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//            i.setDataAndType(contentUri, "application/vnd.android.package-archive");
//            _context.startActivity(i);

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            Uri contentUri = FileProvider.getUriForFile(_context, "com.zhongjiu.suyuan.fileProvider", apkfile);
            intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            _context.startActivity(intent);

        } else {

            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.setDataAndType(Uri.fromFile(apkfile), "application/vnd.android.package-archive");
            _context.startActivity(i);

        }

    }


    @ReactMethod
    public void getVideoThumbnail(String videoPath, int width, int height, String out) {
        File outFile = new File(out);
        if (outFile.exists())
            return;

        try {
            outFile.createNewFile();

            Bitmap bitmap = null;
            // 获取视频的缩略图
            bitmap = ThumbnailUtils.createVideoThumbnail(videoPath, MediaStore.Images.Thumbnails.MINI_KIND);
            bitmap = ThumbnailUtils.extractThumbnail(bitmap, width, height,
                    ThumbnailUtils.OPTIONS_RECYCLE_INPUT);
            FileOutputStream os = new FileOutputStream(outFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, os);

            os.flush();
            os.close();

        } catch (Exception e) {

        }

        return;
    }

    @ReactMethod
    public void showDevMenu() {
        Instrumentation inst = new Instrumentation();
        inst.sendKeyDownUpSync(KeyEvent.KEYCODE_MENU);
    }

    @Override
    public @Nullable Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap<String, Object>();
        constants.put("debug", BuildConfig.DEBUG);
        return constants;
    }

    /**
     * set window background
     */
    @ReactMethod
    public void setBackground() {
        MainActivity ma = (MainActivity) mActivity;
        //ma.setBackground();
    }

}
