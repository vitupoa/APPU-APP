package com.runinga.com.core.upload

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import com.runinga.com.core.network.CloudinaryUploader
import com.runinga.feature.shorts.domain.repository.ShortsRepository
import com.runinga.feature.feed.domain.repository.FeedRepository
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.ApiConstants
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
        additionalData: Map<String, String>,
        isLocked: Boolean = false,
        unlockAmountKr: Double? = null
    ): Boolean = withContext(Dispatchers.Default) {
        println("IosUploadProcessor: Starting upload for $type from $filePath")
        try {
            when (type) {
                UploadType.SHORT -> {
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.SHORTS_VIDEO, filePath, isVideo = true)) {
                        is NetworkResult.Success -> {
                            val createResult = shortsRepository.createShort(
                                videoUrl = result.data,
                                caption = caption,
                                isLocked = isLocked,
                                unlockAmountRc = unlockAmountKr
                            )
                            if (createResult is NetworkResult.Success) {
                                println("IosUploadProcessor: Short uploaded successfully!")
                                // Notify that upload is complete so the shorts feed can refresh
                                UploadCompletionNotifier.notifyUploadComplete(
                                    type = UploadType.SHORT,
                                    contentId = createResult.data.id,
                                    success = true
                                )
                                return@withContext true
                            } else {
                                UploadCompletionNotifier.notifyUploadComplete(
                                    type = UploadType.SHORT,
                                    contentId = "",
                                    success = false
                                )
                            }
                        }
                        is NetworkResult.Error -> {
                            UploadCompletionNotifier.notifyUploadComplete(
                                type = UploadType.SHORT,
                                contentId = "",
                                success = false
                            )
                        }
                        else -> {
                            UploadCompletionNotifier.notifyUploadComplete(
                                type = UploadType.SHORT,
                                contentId = "",
                                success = false
                            )
                        }
                    }
                }
                UploadType.DRIP -> {
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.FEED_PHOTO, filePath, isVideo = false)) {
                        is NetworkResult.Success -> {
                            val createResult = feedRepository.createPost(
                                caption = caption,
                                imageUrls = listOf(result.data),
                                isLocked = isLocked,
                                unlockAmountRc = unlockAmountKr
                            )
                            if (createResult is NetworkResult.Success) {
                                println("IosUploadProcessor: Drip uploaded successfully!")
                                // Notify that upload is complete so the feed can refresh
                                UploadCompletionNotifier.notifyUploadComplete(
                                    type = UploadType.DRIP,
                                    contentId = createResult.data.id,
                                    success = true
                                )
                                return@withContext true
                            } else {
                                UploadCompletionNotifier.notifyUploadComplete(
                                    type = UploadType.DRIP,
                                    contentId = "",
                                    success = false
                                )
                            }
                        }
                        is NetworkResult.Error -> {
                            UploadCompletionNotifier.notifyUploadComplete(
                                type = UploadType.DRIP,
                                contentId = "",
                                success = false
                            )
                        }
                        else -> {
                            UploadCompletionNotifier.notifyUploadComplete(
                                type = UploadType.DRIP,
                                contentId = "",
                                success = false
                            )
                        }
                    }
                }
                UploadType.CONTEST -> {
                    println("IosUploadProcessor: Contest draft queued.")
                    return@withContext true
                }
                UploadType.STORY -> {
                    println("IosUploadProcessor: Story upload not yet implemented.")
                    return@withContext false
                }
            }
            return@withContext false
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }
}
