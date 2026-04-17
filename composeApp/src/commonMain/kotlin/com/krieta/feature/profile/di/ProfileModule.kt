package com.krieta.feature.profile.di

import com.krieta.feature.profile.data.remote.ProfileApi
import com.krieta.feature.profile.data.repository.ProfileRepositoryImpl
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.feature.profile.presentation.viewmodel.*
import org.koin.dsl.module

val profileModule = module {
    single { ProfileApi(get()) }
    single<ProfileRepository> { ProfileRepositoryImpl(get()) }

    factory { (userId: String?) -> ProfileViewModel(userId, get()) }
    factory { EditProfileViewModel(get(), get()) }
    factory { (userId: String, listType: SocialListType) -> SocialListViewModel(userId, listType, get()) }
    factory { MilestonesViewModel(get(), get()) }
    factory { SubscriptionTierSetupViewModel(get()) }
    factory { BioLinksViewModel(get()) }
    factory { SearchViewModel(get()) }
}
