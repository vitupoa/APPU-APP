package com.krieta.feature.contests.di

import com.krieta.feature.contests.data.remote.ContestsApi
import com.krieta.feature.contests.data.repository.ContestsRepositoryImpl
import com.krieta.feature.contests.domain.repository.ContestsRepository
import com.krieta.feature.contests.presentation.viewmodel.ContestDetailViewModel
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedViewModel
import com.krieta.feature.contests.presentation.viewmodel.SubmitContestViewModel
import org.koin.dsl.module

val contestsModule = module {
    single { ContestsApi(get()) }
    single<ContestsRepository> { ContestsRepositoryImpl(get()) }

    factory { ContestFeedViewModel(get(), get()) }
    factory { (contestId: String?) -> com.krieta.feature.contests.presentation.viewmodel.ContestSubmissionFeedViewModel(get(), contestId) }
    factory { (contestId: String) -> ContestDetailViewModel(contestId, get()) }
    factory { (contestId: String) -> SubmitContestViewModel(contestId, get()) }
    factory { com.krieta.feature.contests.presentation.viewmodel.CreateContestViewModel(get(), get(), get(), get(), get()) }
    factory { com.krieta.feature.contests.presentation.viewmodel.JudgeInvitationsViewModel(get()) }
}
