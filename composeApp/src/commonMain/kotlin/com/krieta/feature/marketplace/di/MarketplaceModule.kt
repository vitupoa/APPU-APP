package com.krieta.feature.marketplace.di

import com.krieta.feature.marketplace.data.remote.MarketplaceApiService
import com.krieta.feature.marketplace.data.repository.MarketplaceRepositoryImpl
import com.krieta.feature.marketplace.domain.repository.MarketplaceRepository
import com.krieta.feature.marketplace.presentation.viewmodel.*
import org.koin.dsl.module

val marketplaceModule = module {
    single { MarketplaceApiService(get()) }
    single<MarketplaceRepository> { MarketplaceRepositoryImpl(get()) }
    factory { InfluencerSearchViewModel(get()) }
    factory { CampaignListViewModel(get()) }
    factory { CreateCampaignViewModel(get()) }
    factory { CampaignApplicationsViewModel(get()) }
    factory { SponsorContestViewModel(get()) }
    factory { GamificationViewModel(get()) }
    factory { (influencerId: String) -> SocialMediaManagementViewModel(influencerId, get()) }
}
