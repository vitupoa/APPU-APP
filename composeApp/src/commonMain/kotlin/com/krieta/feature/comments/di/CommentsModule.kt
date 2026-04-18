package com.krieta.feature.comments.di

import com.krieta.feature.comments.data.remote.CommentsApi
import com.krieta.feature.comments.data.repository.CommentsRepositoryImpl
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.domain.repository.CommentsRepository
import com.krieta.feature.comments.presentation.viewmodel.CommentsViewModel
import org.koin.dsl.module

val commentsModule = module {
    // API
    single { CommentsApi(get()) }

    // Repository
    single<CommentsRepository> { CommentsRepositoryImpl(get()) }

    // ViewModel with parameters
    factory { (contentType: ContentType, contentId: String, currentUserId: String) ->
        CommentsViewModel(
            repository = get(),
            contentType = contentType,
            contentId = contentId,
            currentUserId = currentUserId
        )
    }
}
