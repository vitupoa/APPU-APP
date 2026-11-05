package com.runinga.feature.shop.di

import com.runinga.com.core.security.AppConfig
import com.runinga.feature.shop.data.local.ProductLocalDataSource
import com.runinga.feature.shop.data.remote.ShopApi
import com.runinga.feature.shop.data.remote.ShopWebSocketManager
import com.runinga.feature.shop.data.repository.ShopRepositoryImpl
import com.runinga.feature.shop.domain.repository.ShopRepository
import com.runinga.feature.shop.presentation.viewmodel.CreateListingViewModel
import com.runinga.feature.shop.presentation.viewmodel.ProductDetailViewModel
import com.runinga.feature.shop.presentation.viewmodel.ShopListViewModel
import org.koin.dsl.module

val shopModule = module {
    single { ShopApi(get()) }
    single { ProductLocalDataSource(get()) }
    single { ShopWebSocketManager(get(), "http://${AppConfig.RAILWAY_URL}") }
    single<ShopRepository> { ShopRepositoryImpl(get(), get(), get()) }

    factory { ShopListViewModel(get(), get()) }
    factory { (productId: String) -> ProductDetailViewModel(productId, get()) }
    factory { CreateListingViewModel(get(), get(), get()) }
}
