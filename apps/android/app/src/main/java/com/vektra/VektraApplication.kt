package com.vektra

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Main Application class for Project Vektra.
 * Configured with Hilt Dependency Injection.
 */
@HiltAndroidApp
class VektraApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Phase 2: Application-level initialization (Hilt, Timber/Logging, etc.)
    }
}
