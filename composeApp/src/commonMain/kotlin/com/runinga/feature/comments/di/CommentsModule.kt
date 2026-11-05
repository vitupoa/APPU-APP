package com.runinga.feature.comments.di

import com.runinga.feature.comments.data.remote.CommentsApi
import com.runinga.feature.comments.data.repository.CommentsRepositoryImpl
import com.runinga.feature.comments.domain.model.ContentType
import com.runinga.feature.comments.domain.repository.CommentsRepository
import com.runinga.feature.comments.presentation.viewmodel.CommentsViewModel
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
