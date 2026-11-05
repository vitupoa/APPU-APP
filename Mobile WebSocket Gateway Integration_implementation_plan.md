# Mobile WebSocket Gateway Integration

This layout establishes the pipeline for ingesting concurrent WebSocket events seamlessly into Jetpack Compose UI streams natively within your Kotlin Multiplatform application (Runinga). We will bridge the Redis-backed Socket.io server logic onto the Ktor Android clients explicitly for push notifications and milestone live updates.

## 1. Ktor WebSockets Client Initialization
We will augment your existing network module `KtorClient.kt`.
- **Dependencies:** Inject `ktor-client-websockets` within `libs.versions.toml` and implement it inside `composeApp/build.gradle.kts` alongside `kotlinx-serialization`.
- **Client Augmentation:** Upgrade `KtorClientFactory` explicitly embedding the `WebSockets` plugin mapping authentic connection domains seamlessly while forwarding Bearer tokens correctly in initial Upgrade headers dynamically tied to `TokenManager`.

## 2. Real-Time Service Abstractions
We will not hardcode WebSockets into the ViewModels. We will build an organic abstraction connecting the `SharedFlow` boundaries natively.
- **WebSocketService.kt:** Establish a dedicated singleton service initializing Socket listeners encapsulating connection statuses (`Connecting, Connected, Disconnected`).
- Establish specific Event Flows: `val milestoneEvents = MutableSharedFlow<MilestoneEvent>()`.

## 3. UI State Binding (ViewModels)
Bind the `WebSocketService` flows concurrently to active ViewModels updating Android Composables organically.
- **[Feature] Milestones:** Configure `MilestonesViewModel.kt` to collect `milestoneEvents` actively updating its local `StateFlow<List<Milestones>>` instantaneously merging state patches when another user performs an action interacting with the user's progress.

## Socratic Gate: Open Questions (Action Required)

Before I build any Android architecture, we must resolve the following strict design constraints matching Mobile best practices:

1. **[Lifecycle Constraints]:** Should the socket connection physically initialize universally once you log in deeply inside the `MainScreen`/`AppNavigator` and run persistently in the background, or exist temporarily strictly when you actively load into notification/milestone screens preventing battery drain respectively?
2. **[Resilience Routing]:** Mobile experiences violent network switches (WiFi to 4G). When the Socket automatically disconnects, does the application silently retry indefinitely utilizing an exponential backoff, or prompt the user with a "Connection Lost" banner overhead explicitly matching iOS/Android conventions?
3. **[Hydration Overrides]:** When a WebSocket pushes an event (e.g. `"Milestone_unlocked"`), do you want that event payload to natively construct the UI state directly mitigating network stress, or just act as an invalidation trigger forcing the `ViewModel` to fire a safe, standard restorative HTTP `GET` request reloading its entirety dynamically?
