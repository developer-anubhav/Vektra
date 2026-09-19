package com.vektra.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Data Transfer Object for Vektra User profile metadata payload.
 */
data class AuthUserDto(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("companyId") val companyId: String? = null
)
