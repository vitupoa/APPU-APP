# Krieta: Mobile UI/UX Aesthetics Overhaul

In alignment with your strict Tier 2 `mobile-design` guidelines (premium quality, Purple-Ban, vibrant interactions, and avoiding default "Material" blocky generics), this implementation plan targets fundamentally evolving the Jetpack Compose layer organically.

## The Design Paradigm

1.  **Glassmorphism Engine (`Glassmorphism.kt`)**
    *   **Goal:** Replace flat, boring `Card` and `Surface` components with rich, translucent layers stacked elegantly on top of blurred Dark Mode backgrounds.
    *   **Implementation:** We will build a native Jetpack Compose `Modifier.glassmorphic()` logic. This renders an unyielding alpha-tinted background, heavily blurred borders, and organic soft drop-shadows across Android and iOS entirely without extra dependencies natively.

2.  **Fluid Micro-Animations (`Animations.kt`)**
    *   **Goal:** Make the app feel distinctly ALIVE organically securely. 
    *   **Implementation:** We will construct a `Modifier.bounceClick()` layout that shrinks the component by 3% purely smoothly upon pressing, rendering interactions immensely satisfying. We will apply this to Voting Buttons, Wallet Topups, and Swiping logic implicitly.

3.  **Modern Typography Integration (`Type.kt`)**
    *   **Goal:** The standard Android Roboto font looks generic. We will enforce **Inter**, **Sora**, or **Outfit** exclusively across the typography engine explicitly aligning all headers cleanly mapping modern premium standards.

4.  **Gradient Architectures (`Colors.kt` & Component refactors)**
    *   **Goal:** Plain solid colors feel MVP. We will map complex multi-stop `Brush.linearGradient` patterns mapping your Emerald/Teal brand natively scaling across `Button` layers and Progress bars organically!

## The Execution Flow

*   **Phase 1:** Core Utility Generation (Glassmorphic modifiers, `bounceClick` extensions, gradient mapping logic).
*   **Phase 2:** Typography Overhaul (Loading the custom font-family implicitly adjusting letter spacing securely).
*   **Phase 3:** Component Wrapping. I will iterate through `WalletScreen.kt`, `ProfileScreen.kt`, and `ContestFeedSwipeScreen.kt` replacing solid objects with heavily layered animated Glassmorphic structures seamlessly.

> [!IMPORTANT]
> **User Review Required:** A massive UI styling sweep fundamentally shifts the visual ecosystem natively. Please confirm the direction below securely before I rewrite the Jetpack Compose foundations!

## Open Questions

1.  **Typography Selection:** I highly recommend **Outfit** for a futuristic geometric premium feel, or **Inter** for an ultra-clean "Apple-like" look. Does one of these stand out to you organically?
2.  **Corner Rounding (Radius):** Do you prefer highly pill-shaped layouts (very rounded, e.g., 24dp, similar to iOS) or slightly sharper edges (e.g., 12dp) for your Contests/Wallet cards?
