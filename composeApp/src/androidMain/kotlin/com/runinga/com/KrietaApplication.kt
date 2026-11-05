package com.runinga.com

import android.app.Application
import com.runinga.com.core.di.appModules
import com.runinga.com.core.security.SecureConfig
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

class RuningaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureConfig.initialize(this)
        startKoin {
            androidLogger(Level.ERROR)
            androidContext(this@RuningaApplication)
            modules(appModules)
        }
    }
}
