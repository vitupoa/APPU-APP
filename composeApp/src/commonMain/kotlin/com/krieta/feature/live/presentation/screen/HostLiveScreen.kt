package com.krieta.feature.live.presentation.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.live.presentation.viewmodel.LiveType
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

class HostLiveScreen(
    private val liveType: LiveType = LiveType.NORMAL,
    private val productId: String? = null
) : Screen {
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        // State management
        var isLive by remember { mutableStateOf(false) }
        var isPaused by remember { mutableStateOf(false) }
        var showSetupDialog by remember { mutableStateOf(!isLive) }
        var title by remember { mutableStateOf("") }
        var description by remember { mutableStateOf("") }
        var viewerCount by remember { mutableStateOf(0) }
        var likesCount by remember { mutableStateOf(0) }
        var messages by remember { mutableStateOf(listOf<ChatMessage>()) }
        var messageText by remember { mutableStateOf("") }
        var showProductCard by remember { mutableStateOf(productId != null) }
        var hostScore by remember { mutableStateOf(0.0) }
        var opponentScore by remember { mutableStateOf(0.0) }
        var coHosts by remember { mutableStateOf(listOf<String>()) }
        var isFrontCamera by remember { mutableStateOf(true) }
        var showCameraOptions by remember { mutableStateOf(false) }

        // Mock product
        val mockProduct = remember {
            if (productId != null) {
                MockProduct(productId, "iPhone 15 Pro", 150000.0)
            } else null
        }

        // Setup Dialog
        if (showSetupDialog) {
            AlertDialog(
                onDismissRequest = { navigator.pop() },
                title = { Text("Setup Live Stream") },
                text = {
                    Column {
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Title") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Description (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (title.isNotBlank()) {
                                isLive = true
                                showSetupDialog = false
                                // Simulate viewer join
                                viewerCount = (10..50).random()
                            }
                        },
                        enabled = title.isNotBlank()
                    ) {
                        Text("GO LIVE")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { navigator.pop() }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Main Live Screen
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .windowInsetsPadding(WindowInsets(0))
        ) {
            // Camera Preview Placeholder
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                when (liveType) {
                    LiveType.BATTLE -> {
                        // Split screen for battle
                        Row(modifier = Modifier.fillMaxSize()) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .background(Color.DarkGray),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        if (isFrontCamera) "🤳 Front Camera" else "📷 Back Camera",
                                        color = Color.White.copy(alpha = 0.5f),
                                        fontSize = 14.sp
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("You", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("$hostScore Kr", color = Color(0xFFFFD700), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .background(Color(0xFF1A1A1A)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Opponent", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("$opponentScore Kr", color = Color(0xFFFFD700), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                    LiveType.MULTI_GUEST -> {
                        // Grid layout for multi-guest
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                                    .background(Color.DarkGray),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        if (isFrontCamera) "🤳 Front Camera" else "📷 Back Camera",
                                        color = Color.White.copy(alpha = 0.5f),
                                        fontSize = 14.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("You (Host)", color = Color.White.copy(alpha = 0.7f))
                                }
                            }
                            Row(modifier = Modifier.weight(1f).fillMaxWidth()) {
                                repeat(coHosts.size.coerceAtMost(4)) { index ->
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .fillMaxHeight()
                                            .background(Color(0xFF2A2A2A)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("Guest ${index + 1}", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                "📹 Live Camera Feed",
                                color = Color.White.copy(alpha = 0.5f),
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                if (isFrontCamera) "🤳 Front Camera" else "📷 Back Camera",
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                
                // Paused Overlay
                if (isPaused) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.7f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                painterResource(Res.drawable.ic_pause),
                                contentDescription = "Paused",
                                tint = Color.White,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Stream Paused",
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Viewers can still see the paused screen",
                                color = Color.White.copy(alpha = 0.7f),
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            // Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Live Badge & Viewers
                Row(
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isLive && !isPaused) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Color.Red, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("LIVE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                    } else if (isPaused) {
                        Icon(
                            painterResource(Res.drawable.ic_pause),
                            contentDescription = "Paused",
                            tint = Color.Yellow,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("PAUSED", color = Color.Yellow, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                    }
                    Icon(
                        painterResource(Res.drawable.ic_person),
                        contentDescription = "Viewers",
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(viewerCount.toString(), color = Color.White, fontSize = 12.sp)
                }

                // Top Right Controls
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Camera Switch Button
                    IconButton(
                        onClick = { isFrontCamera = !isFrontCamera }
                    ) {
                        Icon(
                            painter = painterResource(Res.drawable.ic_flip_camera),
                            contentDescription = "Switch Camera",
                            tint = Color.White,
                            modifier = Modifier
                                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                .padding(8.dp)
                        )
                    }
                    
                    // Pause/Resume Button
                    IconButton(
                        onClick = { isPaused = !isPaused }
                    ) {
                        Icon(
                            painter = painterResource(
                                if (isPaused) Res.drawable.ic_play_arrow else Res.drawable.ic_pause
                            ),
                            contentDescription = if (isPaused) "Resume" else "Pause",
                            tint = if (isPaused) Color.Yellow else Color.White,
                            modifier = Modifier
                                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                .padding(8.dp)
                        )
                    }
                    
                    // End Stream Button
                    IconButton(
                        onClick = {
                            isLive = false
                            navigator.pop()
                        }
                    ) {
                        Icon(
                            painter = painterResource(Res.drawable.ic_close),
                            contentDescription = "End Live",
                            tint = Color.White,
                            modifier = Modifier
                                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                .padding(8.dp)
                        )
                    }
                }
            }

            // Bottom Section
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Product Card (if selling)
                if (showProductCard && mockProduct != null && liveType == LiveType.COMMERCE) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(0.75f)
                            .padding(bottom = 12.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .background(Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("📦", fontSize = 24.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    mockProduct.name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "${mockProduct.price} Kr",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF43A047)
                                )
                            }
                            Button(
                                onClick = { /* Contact seller */ },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF43A047)
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Contact", fontSize = 12.sp, color = Color.White)
                            }
                        }
                    }
                }

                // Chat Messages
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth(0.75f)
                        .height(200.dp),
                    reverseLayout = true
                ) {
                    items(messages.reversed()) { msg ->
                        Text(
                            text = "${msg.username}: ${msg.text}",
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier
                                .padding(vertical = 4.dp)
                                .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Host Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Message Input
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        placeholder = { Text("Say something...", fontSize = 12.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.White.copy(alpha = 0.2f),
                            unfocusedContainerColor = Color.White.copy(alpha = 0.2f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        trailingIcon = {
                            if (messageText.isNotBlank()) {
                                IconButton(
                                    onClick = {
                                        messages = messages + ChatMessage(
                                            id = "${System.currentTimeMillis()}",
                                            username = "You",
                                            text = messageText
                                        )
                                        messageText = ""
                                    }
                                ) {
                                    Icon(
                                        painterResource(Res.drawable.ic_send),
                                        "Send",
                                        tint = KrietaColors.Primary
                                    )
                                }
                            }
                        }
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    // Quick Actions
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (liveType == LiveType.MULTI_GUEST) {
                            HostToolButton(painterResource(Res.drawable.ic_person_add), "Invite") {
                                coHosts = coHosts + "Guest ${coHosts.size + 1}"
                            }
                        }
                        
                        if (liveType == LiveType.COMMERCE) {
                            HostToolButton(painterResource(Res.drawable.ic_shopping_cart), "Shop") {
                                showProductCard = !showProductCard
                            }
                        }
                        
                        HostToolButton(painterResource(Res.drawable.ic_face), "Filter") { }
                        
                        // Like counter
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            IconButton(
                                onClick = { likesCount++ },
                                modifier = Modifier
                                    .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                    .size(40.dp)
                            ) {
                                Icon(
                                    painterResource(Res.drawable.ic_favorite),
                                    "Likes",
                                    tint = Color.Red,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Text(likesCount.toString(), color = Color.White, fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun HostToolButton(
        icon: androidx.compose.ui.graphics.painter.Painter,
        label: String,
        onClick: () -> Unit = {}
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            IconButton(
                onClick = onClick,
                modifier = Modifier
                    .background(Color.White.copy(alpha = 0.2f), CircleShape)
                    .size(40.dp)
            ) {
                Icon(
                    painter = icon,
                    contentDescription = label,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }

    private data class MockProduct(
        val id: String,
        val name: String,
        val price: Double
    )

    private data class ChatMessage(
        val id: String,
        val username: String,
        val text: String
    )
}
