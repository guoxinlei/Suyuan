#import "Tools.h"
#import "AppDelegate.h"
#import <Photos/Photos.h>

@implementation ToolsModule

// methods for react-native
RCT_EXPORT_MODULE();

// start apns
RCT_EXPORT_METHOD(testBarCodeRead)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    AppDelegate *delegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
    
    NSDictionary *data = @{
      @"code": @"2010000000000"
    };
    
    [delegate sendRNEvent:@"onBarCodeRead" eventBody:data];
  });
}

// get albumsgetGeolocationWithWithResolver:(RCTPromiseResolveBlock)resolve
RCT_REMAP_METHOD(getAlbums,
                  getAlbumsWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // 相册数组
  NSMutableArray *albums = [NSMutableArray new];
  
  // 获得所有图片数量
  PHFetchResult *allAssetsResult = [PHAsset fetchAssetsWithOptions:nil];
  NSDictionary *dict = @{ @"name":@"所有图片", @"count": [NSNumber numberWithUnsignedInteger:allAssetsResult.count]};
  [albums addObject:dict];
  
  resolve(albums);

}

- (NSDictionary *)constantsToExport
{
  NSString *isDebug = @"false";
#ifdef DEBUG
  isDebug = @"true";
#else
  isDebug = @"false";
#endif
  
  return @{
           @"isDebug": isDebug
           
           };
}


@end
