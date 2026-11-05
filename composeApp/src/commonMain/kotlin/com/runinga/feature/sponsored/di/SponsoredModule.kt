package com.runinga.feature.sponsored.di

import com.runinga.feature.sponsored.data.remote.SponsoredApi
import com.runinga.feature.sponsored.presentation.SponsoredContentManager
import com.runinga.feature.sponsored.presentation.viewmodel.BrandDashboardViewModel
import com.runinga.feature.sponsored.presentation.viewmodel.CampaignAnalyticsViewModel
import com.runinga.feature.sponsored.presentation.viewmodel.CreateCampaignViewModel
import org.koin.dsl.module

val sponsoredModule = module {
    single { SponsoredApi(get()) }
    single { SponsoredContentManager(get()) }
    factory { BrandDashboardViewModel(get()) }
    factory { (campaignId: String) -> CampaignAnalyticsViewModel(get(), campaignId) }
    factory { CreateCampaignViewModel(get(), get()) }
}
