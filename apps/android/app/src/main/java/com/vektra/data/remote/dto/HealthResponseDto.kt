package com.vektra.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Health check DTO foundation.
 */
data class HealthResponseDto(
    @SerializedName("status") val status: String?,
    @SerializedName("timestamp") val timestamp: String?,
    @SerializedName("version") val version: String?
)
