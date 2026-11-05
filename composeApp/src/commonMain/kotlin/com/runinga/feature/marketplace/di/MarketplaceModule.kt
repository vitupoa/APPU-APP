package com.runinga.feature.marketplace.di

import com.runinga.feature.marketplace.data.remote.MarketplaceApiService
import com.runinga.feature.marketplace.data.repository.MarketplaceRepositoryImpl
import com.runinga.feature.marketplace.domain.repository.MarketplaceRepository
import com.runinga.feature.marketplace.presentation.viewmodel.*
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
