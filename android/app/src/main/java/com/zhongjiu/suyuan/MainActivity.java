package com.zhongjiu.suyuan;

import com.facebook.react.ReactActivity;
import com.reactnativecomponent.splashscreen.RCTSplashScreenPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.device.ScanDevice;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;
import android.view.Window;

public class MainActivity extends ReactActivity {
    ScanDevice sm;
    private final static String SCAN_ACTION = "scan.rcv.message";

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "Suyuan";
    }

    private BroadcastReceiver mScanReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            // TODO Auto-generated method stub

            byte[] barocode = intent.getByteArrayExtra("barocode");
            int barocodelen = intent.getIntExtra("length", 0);
            String barcodeStr = new String(barocode, 0, barocodelen);

            WritableMap data = Arguments.createMap();
            data.putString("code", barcodeStr);

            sendEvent("onBarCodeRead", data);
        }

    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.MODEL.equals("PL-40L") || Build.MODEL.equals("PDA")) {
            sm = new ScanDevice();
            sm.setOutScanMode(0);
            sm.setScanUnVibrate();
        }

        /*new Thread() {
            @Override
            public void run() {
                try {
                    this.sleep(20000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }


                WritableMap data = Arguments.createMap();
                data.putString("code", "5555555");

                sendEvent("onBarCodeRead", data);

            }
        }.start();*/

    }

    @Override
    protected void onPause() {
        // TODO Auto-generated method stub
        super.onPause();
        if (Build.MODEL.equals("PL-40L") || Build.MODEL.equals("PDA")) {
            if (sm != null) {
                sm.stopScan();
            }
            unregisterReceiver(mScanReceiver);
        }
    }
    @Override
    protected void onResume() {
        // TODO Auto-generated method stub
        super.onResume();

        if (Build.MODEL.equals("PL-40L") || Build.MODEL.equals("PDA")) {

            IntentFilter filter = new IntentFilter();
            filter.addAction(SCAN_ACTION);
            registerReceiver(mScanReceiver, filter);
        }
    }

    public void sendEvent(String eventName,
                          @Nullable WritableMap params) {
        ReactContext reactContext = getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
        if (reactContext == null)
            return;

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private Handler handler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            try {
                String color = (String) msg.obj;
                Window window = getWindow();
                if (color.equals("default")) {  // compatible with ios bar style name
                    window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
                } else if (color.equals("background")) {
                    window.setBackgroundDrawable(null);
                    //getWindow().setBackgroundDrawableResource(R.drawable.login_background);
                } else {
                    window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
                }
            } catch (Exception e) {

            }
        }
    };

    public void setBackground() {
        //getWindow().setBackgroundDrawable(null);
        Message msg = new Message();
        msg.obj = "background";
        handler.sendMessage(msg);
    }
}
