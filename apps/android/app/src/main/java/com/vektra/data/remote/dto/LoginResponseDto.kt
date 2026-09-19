package com.vektra.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Data Transfer Object for Vektra backend login response.
 */
data class LoginResponseDto(
    @SerializedName("token") val token: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("companyId") val companyId: String? = null,
    @SerializedName("message") val message: String? = null
)
