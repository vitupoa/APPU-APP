package com.krieta.feature.sponsored.di

import com.krieta.feature.sponsored.data.remote.SponsoredApi
import com.krieta.feature.sponsored.presentation.SponsoredContentManager
import org.koin.dsl.module

val sponsoredModule = module {
    single { SponsoredApi(get()) }
    single { SponsoredContentManager(get()) }
}
