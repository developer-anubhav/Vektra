package com.vektra.domain.model

/**
 * Domain entity representing application runtime configuration.
 */
data class AppConfig(
    val appName: String,
    val environment: String,
    val isNetworkReady: Boolean,
    val architectureVersion: String
)
