package com.krieta.feature.chama.di

import com.krieta.feature.chama.data.remote.ChamaApi
import com.krieta.feature.chama.data.repository.ChamaRepositoryImpl
import com.krieta.feature.chama.domain.repository.ChamaRepository
import com.krieta.feature.chama.presentation.ChamaListViewModel
import com.krieta.feature.chama.presentation.dashboard.ChamaDashboardViewModel
import com.krieta.feature.chama.presentation.wizard.CreateChamaViewModel
import com.krieta.feature.chama.presentation.election.ChamaElectionViewModel
import org.koin.dsl.module

val chamaModule = module {
    single { ChamaApi(get()) }
    single<ChamaRepository> { ChamaRepositoryImpl(get()) }

    factory { ChamaListViewModel(get()) }
    factory { CreateChamaViewModel(get()) }
    factory { (chamaId: String) -> ChamaDashboardViewModel(chamaId, get()) }
    factory { (chamaId: String, electionId: String) -> ChamaElectionViewModel(chamaId, electionId, get()) }
}

