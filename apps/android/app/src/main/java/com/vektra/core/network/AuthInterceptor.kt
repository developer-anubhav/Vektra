package com.vektra.core.network

import com.vektra.core.security.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * OkHttp Interceptor that attaches Authorization header to authenticated requests
 * and intercepts 401 Unauthorized responses to invalidate local session state safely.
 */
@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip adding Bearer token for login endpoints
        val url = originalRequest.url.toString()
        if (url.contains("auth/login") || url.contains("auth/organization-signup")) {
            return chain.proceed(originalRequest)
        }

        val token = runBlocking { tokenManager.getAccessTokenDirect() }

        val requestBuilder = originalRequest.newBuilder()
        if (!token.isNullOrBlank()) {
            requestBuilder.header(ApiConstants.Headers.AUTHORIZATION, "Bearer $token")
        }

        val response = chain.proceed(requestBuilder.build())

        // Handle 401 Unauthorized globally
        if (response.code == 401) {
            runBlocking {
                tokenManager.clearSession()
            }
        }

        return response
    }
}
