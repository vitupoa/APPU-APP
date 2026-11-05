package com.runinga.feature.profile.di

import com.runinga.feature.profile.data.local.ProfileLocalDataSource
import com.runinga.feature.profile.data.local.SecureProfileLocalDataSource
import com.runinga.feature.profile.data.remote.ProfileApi
import com.runinga.feature.profile.data.repository.ProfileRepositoryImpl
import com.runinga.feature.profile.domain.repository.ProfileRepository
import com.runinga.feature.profile.presentation.viewmodel.*
import org.koin.dsl.module

val profileModule = module {
    single { ProfileApi(get()) }
    single { ProfileLocalDataSource(get()) }
    single { SecureProfileLocalDataSource(get(), get(), get()) }
    single<ProfileRepository> { ProfileRepositoryImpl(get(), get()) }

    factory { (userId: String?) -> ProfileViewModel(userId, get(), get()) }
    factory { EditProfileViewModel(get(), get()) }
    factory { (userId: String, listType: SocialListType) -> SocialListViewModel(userId, listType, get()) }
    factory { MilestonesViewModel(get(), get()) }
    factory { SubscriptionTierSetupViewModel(get()) }
    factory { BioLinksViewModel(get()) }
    factory { SearchViewModel(get(), get(), get(), get(), get()) }
}
