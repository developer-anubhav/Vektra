package com.vektra.core.network

import com.vektra.BuildConfig

/**
 * Centralized API constants configuration.
 */
object ApiConstants {
    val BASE_URL: String = BuildConfig.API_BASE_URL
    const val CONNECT_TIMEOUT_SECONDS = 30L
    const val READ_TIMEOUT_SECONDS = 30L
    const val WRITE_TIMEOUT_SECONDS = 30L

    object Headers {
        const val AUTHORIZATION = "Authorization"
        const val CONTENT_TYPE = "Content-Type"
        const val APPLICATION_JSON = "application/json"
    }
}
