package com.krieta.com.core.upload

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.ForegroundInfo
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.WorkManager
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.stories.domain.repository.StoryRepository
import com.krieta.feature.stories.domain.model.StoryPrivacy
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UploadWorker(
    private val appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params), KoinComponent {

    private val cloudinaryUploader: CloudinaryUploader by inject()
    private val shortsRepository: ShortsRepository by inject()
    private val feedRepository: FeedRepository by inject()
    private val storyRepository: StoryRepository by inject()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val typeStr = inputData.getString("UPLOAD_TYPE") ?: return@withContext Result.failure()
        val filePath = inputData.getString("FILE_PATH") ?: return@withContext Result.failure()
        val caption = inputData.getString("CAPTION") ?: ""
        
        val type = UploadType.valueOf(typeStr)

        setForeground(createForegroundInfo(type))

        try {
            when (type) {
                UploadType.SHORT -> {
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.SHORTS_VIDEO, filePath, isVideo = true)) {
                        is NetworkResult.Success -> {
                            val createResult = shortsRepository.createShort(result.data, caption)
                            if (createResult is NetworkResult.Success) {
                                showCompletionNotification("Short Uploaded Successfully!")
                                return@withContext Result.success()
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
                                showCompletionNotification("Drip Uploaded Successfully!")
                                return@withContext Result.success()
                            }
                        }
                        else -> {}
                    }
                }
                UploadType.CONTEST -> {
                    showCompletionNotification("Contest Draft Uploading...")
                    return@withContext Result.success()
                }
                UploadType.STORY -> {
                    val mediaType = inputData.getString("MEDIA_TYPE") ?: "image"
                    val privacy = inputData.getString("PRIVACY") ?: "PUBLIC"
                    val expiresInHours = inputData.getInt("EXPIRES_IN_HOURS", 24)
                    
                    val isVideo = mediaType == "video"
                    val folder = if (isVideo) ApiConstants.CloudinaryFolders.SHORTS_VIDEO else ApiConstants.CloudinaryFolders.SHORTS_PHOTO
                    
                    when (val result = cloudinaryUploader.uploadMedia(folder, filePath, isVideo = isVideo)) {
                        is NetworkResult.Success -> {
                            val storyPrivacy = try { StoryPrivacy.valueOf(privacy) } catch(e:Exception) { StoryPrivacy.PUBLIC }
                            val createResult = storyRepository.createStory(
                                mediaUrl = result.data,
                                mediaType = mediaType,
                                text = caption.takeIf { it.isNotBlank() },
                                privacy = storyPrivacy,
                                expiresInHours = expiresInHours
                            )
                            if (createResult is NetworkResult.Success) {
                                showCompletionNotification("Story Posted Successfully!")
                                return@withContext Result.success()
                            }
                        }
                        else -> {}
                    }
                }
            }
            showCompletionNotification("Upload failed. Please try again.")
            Result.retry()
        } catch(e: Exception) {
            e.printStackTrace()
            showCompletionNotification("Upload failed: ${e.message}")
            Result.failure()
        }
    }

    private fun createForegroundInfo(type: UploadType): ForegroundInfo {
        val id = "upload_channel_01"
        val title = "Uploading ${type.name.lowercase()}"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(id, "Uploads", NotificationManager.IMPORTANCE_LOW)
            val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(appContext, id)
            .setContentTitle(title)
            .setTicker(title)
            .setContentText("Your media is being uploaded in the background.")
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setOngoing(true)
            .build()

        return ForegroundInfo(1001, notification)
    }

    private fun showCompletionNotification(message: String) {
        val id = "upload_channel_01"
        val notification = NotificationCompat.Builder(appContext, id)
            .setContentTitle("Upload Status")
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .build()
            
        val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(1002, notification)
    }
}
