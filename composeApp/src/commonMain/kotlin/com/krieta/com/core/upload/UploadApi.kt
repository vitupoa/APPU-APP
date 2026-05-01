package com.krieta.com.core.upload

import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.com.core.network.NetworkResult
import io.ktor.client.HttpClient

object CloudinaryFolders {
    const val PROFILE_IMAGES = "Krieta/Profile/Images"
    const val SHORTS_VIDEOS = "Krieta/Shorts/Videos"
    const val SHORTS_IMAGES = "Krieta/Shorts/Images"
    const val CONTESTS_IMAGES = "Krieta/Contests/Images"
    const val CONTESTS_VIDEOS = "Krieta/Contests/Videos"
    const val DRIPS_IMAGES = "Krieta/Drips/Images"
    const val SHOP_IMAGES = "Krieta/Shop/Images"
    const val CHAT_DIRECT_IMAGES = "Krieta/Chats/Direct/Images"
    const val CHAT_DIRECT_VIDEOS = "Krieta/Chats/Direct/Videos"
    const val CHAT_GROUP_IMAGES = "Krieta/Chats/Group/Images"
    const val CHAT_GROUP_VIDEOS = "Krieta/Chats/Group/Videos"
    const val CHAT_CHAMA_IMAGES = "Krieta/Chats/Chama/Images"
    const val CHAT_CHAMA_VIDEOS = "Krieta/Chats/Chama/Videos"
    const val CHAT_GROUP_AVATAR_IMAGES = "Krieta/Chats/GroupAvatar/Images"
    const val STORIES_IMAGES = "Krieta/Stories/Images"
    const val STORIES_VIDEOS = "Krieta/Stories/Videos"
}

interface UploadApi {
    suspend fun uploadImage(filePath: String, folder: String): NetworkResult<String>
}

class UploadApiImpl(private val client: HttpClient) : UploadApi {
    private val uploader = CloudinaryUploader(client)
    
    override suspend fun uploadImage(filePath: String, folder: String): NetworkResult<String> {
        return uploader.uploadMedia(folder, filePath, isVideo = false)
    }
}
