package com.krieta.com

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.krieta.feature.auth.presentation.screen.LoginScreen
import com.krieta.com.core.navigation.MainScreen
import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.session.SessionManager
import com.krieta.com.core.theme.KrietaTheme
import com.krieta.com.core.theme.KrietaColors
import org.koin.compose.KoinContext
import org.koin.compose.koinInject
import kotlinx.coroutines.launch

@Composable
fun App() {
    KoinContext {
        KrietaTheme {
            Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                val tokenManager = koinInject<TokenManager>()
                val sessionManager = koinInject<SessionManager>()
                var startScreen by remember { mutableStateOf<Screen?>(null) }
                var currentNavigator by remember { mutableStateOf<Navigator?>(null) }
                val scope = rememberCoroutineScope()

                LaunchedEffect(Unit) {
                    val isLoggedIn = tokenManager.isLoggedIn()
                    startScreen = if (isLoggedIn) {
                        MainScreen()
                    } else {
                        LoginScreen()
                    }
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
                        CircularProgressIndicator(color = KrietaColors.Primary)
                    }
                }
            }
        }
    }
}