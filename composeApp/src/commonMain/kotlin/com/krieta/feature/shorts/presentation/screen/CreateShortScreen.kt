package com.krieta.feature.shorts.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.koin.koinScreenModel
import com.krieta.feature.shorts.presentation.viewmodel.CreateShortViewModel
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerType
import kotlinx.coroutines.launch

class CreateShortScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreateShortViewModel>()
        val state by viewModel.state.collectAsState()
        val scope = rememberCoroutineScope()

        LaunchedEffect(state.success) {
            if (state.success) navigator.pop()
        }

        val launcher = rememberFilePickerLauncher(
            type = PickerType.Video
        ) { file ->
            file?.let {
                scope.launch {
                    val bytes = it.readBytes()
                    viewModel.setVideo(bytes)
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Upload Short", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    },
                    actions = {
                        TextButton(onClick = { viewModel.post() }, enabled = !state.isPosting) {
                            Text("Post", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                OutlinedTextField(
                    value = state.caption,
                    onValueChange = { viewModel.updateCaption(it) },
                    placeholder = { Text("Write a caption...") },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                )

                Spacer(modifier = Modifier.height(32.dp))

                Button(onClick = { launcher.launch() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Select Video from Gallery")
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (state.videoBytes != null) {
                    Text("Video selected (${state.videoBytes!!.size / 1024 / 1024} MB)", fontWeight = FontWeight.Bold)
                }

                if (state.isPosting) {
                    CircularProgressIndicator(modifier = Modifier.padding(top = 16.dp))
                }

                state.error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 16.dp))
                }
            }
        }
    }
}
