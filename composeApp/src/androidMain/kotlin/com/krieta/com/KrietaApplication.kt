package com.krieta.com

import android.app.Application
import com.krieta.com.core.di.appModules
import com.krieta.com.core.security.SecureConfig
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

class KrietaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureConfig.initialize(this)
        startKoin {
            androidLogger(Level.ERROR)
            androidContext(this@KrietaApplication)
            modules(appModules)
        }
    }
}
