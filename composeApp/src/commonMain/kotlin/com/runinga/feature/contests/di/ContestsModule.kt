package com.runinga.feature.contests.di

import com.runinga.feature.contests.data.remote.ContestsApi
import com.runinga.feature.contests.data.repository.ContestsRepositoryImpl
import com.runinga.feature.contests.domain.repository.ContestsRepository
import com.runinga.feature.contests.presentation.viewmodel.ContestDetailViewModel
import com.runinga.feature.contests.presentation.viewmodel.ContestFeedViewModel
import com.runinga.feature.contests.presentation.viewmodel.SubmitContestViewModel
import org.koin.dsl.module

val contestsModule = module {
    single { ContestsApi(get()) }
    single<ContestsRepository> { ContestsRepositoryImpl(get()) }

    factory { ContestFeedViewModel(get(), get()) }
    factory { (contestId: String?) -> com.runinga.feature.contests.presentation.viewmodel.ContestSubmissionFeedViewModel(get(), contestId) }
    factory { (contestId: String) -> ContestDetailViewModel(contestId, get()) }
    factory { (contestId: String) -> SubmitContestViewModel(contestId, get()) }
    factory { com.runinga.feature.contests.presentation.viewmodel.CreateContestViewModel(get(), get(), get(), get(), get()) }
    factory { com.runinga.feature.contests.presentation.viewmodel.JudgeInvitationsViewModel(get()) }
}
