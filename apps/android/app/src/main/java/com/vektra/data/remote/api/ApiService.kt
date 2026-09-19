package com.vektra.data.remote.api

import com.vektra.data.remote.dto.HealthResponseDto
import retrofit2.Response
import retrofit2.http.GET

/**
 * Core Retrofit ApiService interface foundation.
 * Business endpoints will be added in future feature modules (Phase 3+).
 */
interface ApiService {
    @GET("health")
    suspend fun checkHealth(): Response<HealthResponseDto>
}
