package com.krieta.feature.feed.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

import cafe.adriel.voyager.koin.koinScreenModel
import com.krieta.feature.feed.presentation.viewmodel.CreatePostViewModel
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerType
import io.github.vinceglb.filekit.core.PickerMode
import kotlinx.coroutines.launch

class CreatePostScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreatePostViewModel>()
        val state by viewModel.state.collectAsState()

        LaunchedEffect(state.success) {
            if (state.success) navigator.pop()
        }

        val scope = rememberCoroutineScope()
        
        val launcher = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Multiple()
        ) { files ->
            files?.forEach { file ->
                // Coroutine to read bytes
                scope.launch {
                    val bytes = file.readBytes()
                    viewModel.addImage(bytes)
                }
            }
        }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("New Post", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
                    placeholder = { Text("What's on your mind?") },
                    modifier = Modifier.fillMaxWidth().height(150.dp),
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(onClick = { launcher.launch() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Add Images")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Display selected images preview count or error
                if (state.imageBytes.isNotEmpty()) {
                    Text("${state.imageBytes.size} images selected", fontWeight = FontWeight.Bold)
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
