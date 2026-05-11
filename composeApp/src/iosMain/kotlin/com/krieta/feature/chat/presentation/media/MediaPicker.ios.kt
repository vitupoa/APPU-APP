package com.krieta.feature.chat.presentation.media

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.interop.LocalUIViewController
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.refTo
import platform.Foundation.NSData
import platform.Foundation.NSURL
import platform.Foundation.dataWithContentsOfURL
import platform.PhotosUI.PHPickerConfiguration
import platform.PhotosUI.PHPickerFilter
import platform.PhotosUI.PHPickerResult
import platform.PhotosUI.PHPickerViewController
import platform.PhotosUI.PHPickerViewControllerDelegateProtocol
import platform.UIKit.UIDocumentPickerDelegateProtocol
import platform.UIKit.UIDocumentPickerViewController
import platform.UIKit.UIDocumentPickerMode
import platform.darwin.NSObject
import platform.UniformTypeIdentifiers.UTTypePDF

@OptIn(ExperimentalForeignApi::class)
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
                    picker.dismissViewControllerAnimated(true, null)
                    
                    val results = didFinishPicking as? List<PHPickerResult> ?: return
                    if (results.isEmpty()) return
                    
                    val result = results.first()
                    val itemProvider = result.itemProvider
                    
                    if (itemProvider.canLoadObjectOfClass(platform.UIKit.UIImage)) {
                        itemProvider.loadFileRepresentationForTypeIdentifier(
                            "public.image"
                        ) { url, error ->
                            if (error != null || url == null) return@loadFileRepresentationForTypeIdentifier
                            
                            val data = NSData.dataWithContentsOfURL(url)
                            if (data != null) {
                                val bytes = ByteArray(data.length.toInt())
                                data.getBytes(bytes.refTo(0), data.length)
                                
                                val fileName = url.lastPathComponent ?: "image.jpg"
                                val fileSize = data.length.toLong()
                                
                                onMediaSelected(
                                    MediaFile(
                                        uri = url.absoluteString ?: "",
                                        fileName = fileName,
                                        fileSize = fileSize,
                                        mimeType = "image/jpeg",
                                        bytes = bytes
                                    )
                                )
                            }
                        }
                    }
                }
            }
            
            val picker = PHPickerViewController(config)
            picker.delegate = delegate
            viewController.presentViewController(picker, true, null)
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
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
                    picker.dismissViewControllerAnimated(true, null)
                    
                    val results = didFinishPicking as? List<PHPickerResult> ?: return
                    if (results.isEmpty()) return
                    
                    val result = results.first()
                    val itemProvider = result.itemProvider
                    
                    itemProvider.loadFileRepresentationForTypeIdentifier(
                        "public.movie"
                    ) { url, error ->
                        if (error != null || url == null) return@loadFileRepresentationForTypeIdentifier
                        
                        val data = NSData.dataWithContentsOfURL(url)
                        if (data != null) {
                            val bytes = ByteArray(data.length.toInt())
                            data.getBytes(bytes.refTo(0), data.length)
                            
                            val fileName = url.lastPathComponent ?: "video.mp4"
                            val fileSize = data.length.toLong()
                            
                            onMediaSelected(
                                MediaFile(
                                    uri = url.absoluteString ?: "",
                                    fileName = fileName,
                                    fileSize = fileSize,
                                    mimeType = "video/mp4",
                                    bytes = bytes
                                )
                            )
                        }
                    }
                }
            }
            
            val picker = PHPickerViewController(config)
            picker.delegate = delegate
            viewController.presentViewController(picker, true, null)
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
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
                    val urls = didPickDocumentsAtURLs as? List<NSURL> ?: return
                    if (urls.isEmpty()) return
                    
                    val url = urls.first()
                    val data = NSData.dataWithContentsOfURL(url)
                    
                    if (data != null) {
                        val bytes = ByteArray(data.length.toInt())
                        data.getBytes(bytes.refTo(0), data.length)
                        
                        val fileName = url.lastPathComponent ?: "document.pdf"
                        val fileSize = data.length.toLong()
                        
                        onMediaSelected(
                            MediaFile(
                                uri = url.absoluteString ?: "",
                                fileName = fileName,
                                fileSize = fileSize,
                                mimeType = "application/pdf",
                                bytes = bytes
                            )
                        )
                    }
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
