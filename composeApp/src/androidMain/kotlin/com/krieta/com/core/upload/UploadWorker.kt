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
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.stories.domain.repository.StoryRepository
import com.krieta.feature.stories.domain.model.StoryPrivacy
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable

class UploadWorker(
    private val appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    private val cloudinaryUploader: CloudinaryUploader = org.koin.core.context.GlobalContext.get().get()
    private val shortsRepository: ShortsRepository = org.koin.core.context.GlobalContext.get().get()
    private val feedRepository: FeedRepository = org.koin.core.context.GlobalContext.get().get()
    private val storyRepository: StoryRepository = org.koin.core.context.GlobalContext.get().get()
    private val httpClient: HttpClient = org.koin.core.context.GlobalContext.get().get()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val typeStr = inputData.getString("UPLOAD_TYPE") ?: return@withContext Result.failure()
        val filePath = inputData.getString("FILE_PATH") ?: return@withContext Result.failure()
        val caption = inputData.getString("CAPTION") ?: ""
        
        val type = UploadType.valueOf(typeStr)

        setForeground(createForegroundInfo(type, 0))

        try {
            when (type) {
                UploadType.SHORT -> {
                    updateProgress(type, 10, "Preparing upload...")
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.SHORTS_VIDEO, filePath, isVideo = true)) {
                        is NetworkResult.Success -> {
                            updateProgress(type, 70, "Creating short...")
                            val createResult = shortsRepository.createShort(result.data, caption)
                            if (createResult is NetworkResult.Success) {
                                updateProgress(type, 100, "Upload complete!")
                                showCompletionNotification("Short Uploaded Successfully!")
                                return@withContext Result.success()
                            } else {
                                showCompletionNotification("Failed to create short. Please try again.")
                                return@withContext Result.failure()
                            }
                        }
                        is NetworkResult.Error -> {
                            showCompletionNotification("Upload failed: ${result.message}")
                            return@withContext Result.failure()
                        }
                        else -> {
                            showCompletionNotification("Upload failed. Please try again.")
                            return@withContext Result.failure()
                        }
                    }
                }
                UploadType.DRIP -> {
                    updateProgress(type, 10, "Preparing upload...")
                    when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.FEED_PHOTO, filePath, isVideo = false)) {
                        is NetworkResult.Success -> {
                            updateProgress(type, 70, "Creating post...")
                            val createResult = feedRepository.createPost(caption, listOf(result.data))
                            if (createResult is NetworkResult.Success) {
                                updateProgress(type, 100, "Upload complete!")
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
                    
                    updateProgress(type, 10, "Preparing upload...")
                    val isVideo = mediaType == "video"
                    val folder = if (isVideo) ApiConstants.CloudinaryFolders.STORIES_VIDEO else ApiConstants.CloudinaryFolders.STORIES_IMAGE
                    
                    when (val result = cloudinaryUploader.uploadMedia(folder, filePath, isVideo = isVideo)) {
                        is NetworkResult.Success -> {
                            updateProgress(type, 70, "Creating story...")
                            val storyPrivacy = try { StoryPrivacy.valueOf(privacy) } catch(e:Exception) { StoryPrivacy.PUBLIC }
                            val createResult = storyRepository.createStory(
                                mediaUrl = result.data,
                                mediaType = mediaType,
                                text = caption.takeIf { it.isNotBlank() },
                                privacy = storyPrivacy,
                                expiresInHours = expiresInHours
                            )
                            if (createResult is NetworkResult.Success) {
                                updateProgress(type, 100, "Upload complete!")
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

    private fun createForegroundInfo(type: UploadType, progress: Int = 0): ForegroundInfo {
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
            .setContentText(if (progress > 0) "$progress% complete" else "Starting upload...")
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setProgress(100, progress, progress == 0)
            .setOngoing(true)
            .build()

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ForegroundInfo(1001, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            ForegroundInfo(1001, notification)
        }
    }

    private suspend fun updateProgress(type: UploadType, progress: Int, message: String) {
        setForeground(createForegroundInfo(type, progress))
        
        val id = "upload_channel_01"
        val notification = NotificationCompat.Builder(appContext, id)
            .setContentTitle("Uploading ${type.name.lowercase()}")
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setProgress(100, progress, false)
            .setOngoing(true)
            .build()
            
        val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(1001, notification)
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
