package com.runinga.feature.shorts.presentation.viewmodel

enum class ShortsFeedType {
    ADMIRING,  // Own shorts + people you admire who DON'T admire you back (one-way). Excludes: Lovers
    LOVERS,    // Only mutual admirers (both admire each other, is_lovers: true on both records)
    DISCOVER   // Everyone else. Excludes: own shorts + anyone you admire. Includes: strangers + people who admire you but you don't admire back
}
