package com.runinga.com

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.runinga.feature.auth.presentation.screen.LoginScreen
import com.runinga.com.core.navigation.MainScreen
import com.runinga.com.core.security.TokenManager
import com.runinga.com.core.session.SessionManager
import com.runinga.com.core.theme.RuningaTheme
import com.runinga.com.core.theme.RuningaColors
import org.koin.compose.KoinContext
import org.koin.compose.koinInject

@Composable
fun App() {
    KoinContext {
        RuningaTheme {
            // Plain Box with no inset consumption so video screens fill
            // the entire display including behind the status and nav bars
            Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
                val tokenManager = koinInject<TokenManager>()
                val sessionManager = koinInject<SessionManager>()
                var startScreen by remember { mutableStateOf<Screen?>(null) }
                var currentNavigator by remember { mutableStateOf<Navigator?>(null) }

                LaunchedEffect(Unit) {
                    val isLoggedIn = tokenManager.isLoggedIn()
                    startScreen = if (isLoggedIn) MainScreen() else LoginScreen()
                }

                LaunchedEffect(Unit) {
                    sessionManager.sessionExpired.collect {
                        currentNavigator?.replaceAll(LoginScreen())
                    }
                }

                if (startScreen != null) {
                    Navigator(startScreen!!) { navigator ->
                        currentNavigator = navigator
                        SlideTransition(navigator)
                    }
                } else {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = RuningaColors.Primary)
                    }
                }
            }
        }
    }
}
