package com.runinga.com.core.upload

import com.runinga.com.core.network.CloudinaryUploader
import com.runinga.com.core.network.NetworkResult
import io.ktor.client.HttpClient

object CloudinaryFolders {
    const val PROFILE_IMAGES = "Runinga/Profile/Images"
    const val SHORTS_VIDEOS = "Runinga/Shorts/Videos"
    const val SHORTS_IMAGES = "Runinga/Shorts/Images"
    const val CONTESTS_IMAGES = "Runinga/Contests/Images"
    const val CONTESTS_VIDEOS = "Runinga/Contests/Videos"
    const val DRIPS_IMAGES = "Runinga/Drips/Images"
    const val SHOP_IMAGES = "Runinga/Shop/Images"
    const val CHAT_DIRECT_IMAGES = "Runinga/Chats/Direct/Images"
    const val CHAT_DIRECT_VIDEOS = "Runinga/Chats/Direct/Videos"
    const val CHAT_GROUP_IMAGES = "Runinga/Chats/Group/Images"
    const val CHAT_GROUP_VIDEOS = "Runinga/Chats/Group/Videos"
    const val CHAT_CHAMA_IMAGES = "Runinga/Chats/Chama/Images"
    const val CHAT_CHAMA_VIDEOS = "Runinga/Chats/Chama/Videos"
    const val CHAT_GROUP_AVATAR_IMAGES = "Runinga/Chats/GroupAvatar/Images"
    const val STORIES_IMAGES = "Runinga/Stories/Images"
    const val STORIES_VIDEOS = "Runinga/Stories/Videos"
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
