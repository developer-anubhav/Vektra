package com.vektra.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Data Transfer Object for Vektra backend login request.
 */
data class LoginRequestDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)
