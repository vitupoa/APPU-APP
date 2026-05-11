# iOS Media Picker Implementation

## ✅ Complete Implementation

### PHPickerViewController (Images & Videos)

**Image Picker**:
```kotlin
@Composable
actual fun rememberImagePicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val viewController = LocalUIViewController.current
    
    return remember {
        {
            val config = PHPickerConfiguration()
            config.selectionLimit = 1
            config.filter = PHPickerFilter.imagesFilter
            
            val delegate = object : NSObject(), PHPickerViewControllerDelegateProtocol {
                override fun picker(
                    picker: PHPickerViewController,
                    didFinishPicking: List<*>
                ) {
                    // Handle image selection
                    // Load file representation as "public.image"
                    // Extract bytes from NSURL
                    // Return MediaFile with JPEG MIME type
                }
            }
            
            val picker = PHPickerViewController(config)
            picker.delegate = delegate
            viewController.presentViewController(picker, true, null)
        }
    }
}
```

**Video Picker**:
```kotlin
@Composable
actual fun rememberVideoPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val viewController = LocalUIViewController.current
    
    return remember {
        {
            val config = PHPickerConfiguration()
            config.selectionLimit = 1
            config.filter = PHPickerFilter.videosFilter
            
            val delegate = object : NSObject(), PHPickerViewControllerDelegateProtocol {
                override fun picker(
                    picker: PHPickerViewController,
                    didFinishPicking: List<*>
                ) {
                    // Handle video selection
                    // Load file representation as "public.movie"
                    // Extract bytes from NSURL
                    // Return MediaFile with MP4 MIME type
                }
            }
            
            val picker = PHPickerViewController(config)
            picker.delegate = delegate
            viewController.presentViewController(picker, true, null)
        }
    }
}
```

### UIDocumentPickerViewController (PDFs)

**Document Picker**:
```kotlin
@Composable
actual fun rememberDocumentPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val viewController = LocalUIViewController.current
    
    return remember {
        {
            val delegate = object : NSObject(), UIDocumentPickerDelegateProtocol {
                override fun documentPicker(
                    controller: UIDocumentPickerViewController,
                    didPickDocumentsAtURLs: List<*>
                ) {
                    // Handle PDF selection
                    // Extract bytes from NSURL
                    // Return MediaFile with PDF MIME type
                }
                
                override fun documentPickerWasCancelled(
                    controller: UIDocumentPickerViewController
                ) {
                    // User cancelled
                }
            }
            
            val picker = UIDocumentPickerViewController(
                documentTypes = listOf(UTTypePDF.identifier),
                inMode = UIDocumentPickerMode.UIDocumentPickerModeImport
            )
            picker.delegate = delegate
            viewController.presentViewController(picker, true, null)
        }
    }
}
```

## 🔑 Key Features

### PHPickerViewController
- Modern iOS 14+ photo picker
- Privacy-friendly (no photo library access required)
- Supports images and videos
- Single selection mode
- Filter by media type

### UIDocumentPickerViewController
- System document picker
- Supports PDF files
- Import mode for file selection
- Delegate pattern for callbacks

### Data Extraction
- Uses `NSData.dataWithContentsOfURL()` to read file bytes
- Extracts file name from `NSURL.lastPathComponent`
- Gets file size from `NSData.length`
- Converts NSData to ByteArray using `getBytes()`

## 📋 Required Permissions

Add to `Info.plist`:
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to send images in chat</string>

<key>NSCameraUsageDescription</key>
<string>We need access to your camera to take photos</string>
```

## 🧪 Testing

### Test on iOS Simulator
```bash
cd iosApp
xcodebuild -scheme iosApp -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Test on iOS Device
1. Open `iosApp/iosApp.xcodeproj` in Xcode
2. Select your device
3. Run the app
4. Test media picker functionality

## 🎯 Supported Formats

### Images
- JPEG
- PNG
- HEIC (converted to JPEG)
- GIF

### Videos
- MP4
- MOV
- M4V

### Documents
- PDF

## 💡 Notes

- PHPickerViewController requires iOS 14+
- Uses `@OptIn(ExperimentalForeignApi::class)` for C interop
- Delegates are retained by the picker
- File bytes are loaded asynchronously
- NSURL provides temporary file access

## ✅ Implementation Checklist

- [x] Image picker with PHPickerViewController
- [x] Video picker with PHPickerViewController
- [x] Document picker with UIDocumentPickerViewController
- [x] File metadata extraction
- [x] Byte array conversion
- [x] MediaFile creation
- [ ] Test on iOS simulator
- [ ] Test on iOS device
- [ ] Add camera capture option
- [ ] Add multiple selection support

## 🚀 Next Steps

1. Test on iOS simulator
2. Test on iOS device
3. Add camera capture option (UIImagePickerController)
4. Add multiple file selection
5. Add file size validation before loading bytes
6. Add progress indicator for large files
