package com.krieta.com

import androidx.compose.runtime.Composable
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.krieta.com.core.navigation.MainScreen
import com.krieta.feature.auth.presentation.screen.LoginScreen
import com.krieta.com.core.theme.KrietaTheme
import org.koin.compose.KoinContext

@Composable
fun App() {
    KoinContext {
        KrietaTheme {
            Navigator(LoginScreen()) { navigator ->
                SlideTransition(navigator)
            }
        }
    }
}