package com.krieta.feature.shop.di

import com.krieta.com.core.security.AppConfig
import com.krieta.feature.shop.data.local.ProductLocalDataSource
import com.krieta.feature.shop.data.remote.ShopApi
import com.krieta.feature.shop.data.remote.ShopWebSocketManager
import com.krieta.feature.shop.data.repository.ShopRepositoryImpl
import com.krieta.feature.shop.domain.repository.ShopRepository
import com.krieta.feature.shop.presentation.viewmodel.CreateListingViewModel
import com.krieta.feature.shop.presentation.viewmodel.ProductDetailViewModel
import com.krieta.feature.shop.presentation.viewmodel.ShopListViewModel
import org.koin.dsl.module

val shopModule = module {
    single { ShopApi(get()) }
    single { ProductLocalDataSource(get()) }
    single { ShopWebSocketManager(get(), "http://${AppConfig.RAILWAY_URL}") }
    single<ShopRepository> { ShopRepositoryImpl(get(), get(), get()) }

    factory { ShopListViewModel(get(), get()) }
    factory { (productId: String) -> ProductDetailViewModel(productId, get()) }
    factory { CreateListingViewModel(get(), get()) }
}
