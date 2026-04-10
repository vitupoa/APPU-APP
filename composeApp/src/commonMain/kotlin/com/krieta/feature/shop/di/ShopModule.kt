package com.krieta.feature.shop.di

import com.krieta.feature.shop.data.remote.ShopApi
import com.krieta.feature.shop.data.repository.ShopRepositoryImpl
import com.krieta.feature.shop.domain.repository.ShopRepository
import com.krieta.feature.shop.presentation.viewmodel.CreateListingViewModel
import com.krieta.feature.shop.presentation.viewmodel.ProductDetailViewModel
import com.krieta.feature.shop.presentation.viewmodel.ShopListViewModel
import org.koin.dsl.module

val shopModule = module {
    single { ShopApi(get()) }
    single<ShopRepository> { ShopRepositoryImpl(get()) }

    factory { ShopListViewModel(get()) }
    factory { (productId: String) -> ProductDetailViewModel(productId, get()) }
    factory { CreateListingViewModel(get()) }
}
