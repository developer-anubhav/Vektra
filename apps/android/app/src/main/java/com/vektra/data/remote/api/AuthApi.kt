package com.vektra.data.remote.api

import com.vektra.data.remote.dto.LoginRequestDto
import com.vektra.data.remote.dto.LoginResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Retrofit interface for Vektra Authentication endpoints.
 */
interface AuthApi {
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequestDto
    ): Response<LoginResponseDto>
}
