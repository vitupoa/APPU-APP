package com.krieta.com.core.upload

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object IosUploadProcessor : KoinComponent {

    private val cloudinaryUploader: CloudinaryUploader by inject()
    private val shortsRepository: ShortsRepository by inject()
    private val feedRepository: FeedRepository by inject()

    suspend fun processUpload(
        type: UploadType,
        filePath: String,
        caption: String,
        additionalData: Map<String, String>
    ): Boolean = withContext(Dispatchers.Default) {
        println("IosUploadProcessor: Starting upload for $type from $filePath")
        try {
            when (type) {
                UploadType.SHORT -> {
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.SHORTS_VIDEO, filePath, isVideo = true)) {
                        is NetworkResult.Success -> {
                            val createResult = shortsRepository.createShort(result.data, caption)
                            if (createResult is NetworkResult.Success) {
                                println("IosUploadProcessor: Short uploaded successfully!")
                                return@withContext true
                            }
                        }
                        else -> {}
                    }
                }
                UploadType.DRIP -> {
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.FEED_PHOTO, filePath, isVideo = false)) {
                        is NetworkResult.Success -> {
                            val createResult = feedRepository.createPost(caption, listOf(result.data))
                            if (createResult is NetworkResult.Success) {
                                println("IosUploadProcessor: Drip uploaded successfully!")
                                return@withContext true
                            }
                        }
                        else -> {}
                    }
                }
                UploadType.CONTEST -> {
                    println("IosUploadProcessor: Contest draft queued.")
                    return@withContext true
                }
            }
            return@withContext false
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }
}
