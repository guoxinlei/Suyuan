#! /bin/sh

case "$1" in
  ios)
    # generate js bundle
    wget -O ./ios/main.jsbundle http://localhost:8081/index.ios.bundle?platform=ios\&dev=false\&minify=true
  ;;
  android)
    assetsDir=./android/app/build/intermediates/assets
    debugDir=./android/app/build/intermediates/assets/debug
    releaseDir=./android/app/build/intermediates/assets/release

    # create android debug assets directory
    mkdir $debugDir
    # generate debug js bundle
    wget -O $debugDir/index.android.bundle http://localhost:8081/index.android.bundle?platform=android\&dev=true\&minify=false

    # create android release assets directory
    mkdir $releaseDir
    # genreate release js bundle
    wget -O $releaseDir/index.android.bundle http://localhost:8081/index.android.bundle?platform=android\&dev=false\&minify=true

    # copy fonts folder
    rm -rf $debugDir/fonts
    rm -rf $releaseDir/fonts
    cp -a ./ios/Fonts $debugDir/fonts
    cp -a ./ios/Fonts $releaseDir/fonts

    # copy fonts folder & js bundle to flavors directory
    #flavors=(zhongjiu yingyongbao baidu zhushou91 anzhuo shouzhu360 xiaomi huawei anzhi wandoujia jifeng meizu lianxiang yingyonghui nduowang mumayi OPPO)
    #for flavor in ${flavors[@]}
    #do
    #  echo $flavor
    #  rm -rf $assetsDir/$flavor
    #  mkdir $assetsDir/$flavor
    #  cp -a $releaseDir $assetsDir/$flavor/
    #done
  ;;
esac
