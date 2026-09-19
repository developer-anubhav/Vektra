package com.vektra.data.repository

import android.util.Log
import com.google.gson.Gson
import com.vektra.core.common.Result
import com.vektra.core.network.ApiConstants
import com.vektra.core.network.NetworkError
import com.vektra.core.security.TokenManager
import com.vektra.data.mapper.AuthMapper
import com.vektra.data.remote.api.AuthApi
import com.vektra.data.remote.dto.LoginRequestDto
import com.vektra.data.remote.dto.LoginResponseDto
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthState
import com.vektra.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.io.IOException
import java.net.SocketTimeoutException
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "VektraNetwork"

/**
 * Data implementation of AuthRepository.
 * Manages API login calls, network error parsing, and secure DataStore session persistence.
 */
@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager,
    private val gson: Gson
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<AuthSession> {
        Log.d(TAG, "Initiating authentication request to ${ApiConstants.BASE_URL}auth/login for user email: $email")
        return try {
            val response = authApi.login(LoginRequestDto(email = email, password = password))
            Log.d(TAG, "Received login HTTP response status: ${response.code()}")

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && !body.token.isNullOrBlank()) {
                    val session = AuthMapper.mapToDomainSession(body, email)
                    if (session != null) {
                        tokenManager.saveSession(
                            token = session.accessToken,
                            role = session.user.role,
                            name = session.user.name,
                            companyId = session.user.companyId,
                            email = session.user.email
                        )
                        Log.d(TAG, "Authentication successful for user: ${session.user.name}, role: ${session.user.role}")
                        Result.Success(session)
                    } else {
                        Log.e(TAG, "Failed to parse domain session from successful response payload")
                        Result.Error(NetworkError.Unknown("Invalid login payload from server"))
                    }
                } else {
                    val errorMessage = body?.message ?: "Login failed"
                    Log.w(TAG, "Login payload contained error message: $errorMessage")
                    Result.Error(NetworkError.BadRequest, Exception(errorMessage))
                }
            } else {
                val errorMsg = parseErrorMessage(response.errorBody()?.string())
                Log.w(TAG, "HTTP ${response.code()} response during login: $errorMsg")
                when (response.code()) {
                    400 -> Result.Error(NetworkError.BadRequest, Exception(errorMsg ?: "Invalid email or password"))
                    401 -> Result.Error(NetworkError.Unauthorized, Exception(errorMsg ?: "Invalid email or password"))
                    else -> Result.Error(NetworkError.ServerError(response.code(), errorMsg), Exception(errorMsg ?: "Server error"))
                }
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Connection timeout accessing ${ApiConstants.BASE_URL}auth/login: ${e.message}", e)
            Result.Error(NetworkError.Timeout, e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error connecting to ${ApiConstants.BASE_URL}auth/login: ${e.message}", e)
            Result.Error(NetworkError.NoInternet, e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error during login: ${e.message}", e)
            Result.Error(NetworkError.Unknown(e.message), e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            tokenManager.clearSession()
            Log.d(TAG, "Session cleared successfully")
            Result.Success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing session on logout: ${e.message}", e)
            Result.Error(NetworkError.Unknown(e.message), e)
        }
    }

    override fun getAuthState(): Flow<AuthState> {
        return tokenManager.authSession.map { session ->
            if (session != null) {
                AuthState.Authenticated(session)
            } else {
                AuthState.Unauthenticated
            }
        }
    }

    override suspend fun restoreSession(): AuthSession? {
        return tokenManager.getAuthSessionDirect()
    }

    private fun parseErrorMessage(jsonString: String?): String? {
        if (jsonString.isNullOrBlank()) return null
        return try {
            val errorDto = gson.fromJson(jsonString, LoginResponseDto::class.java)
            errorDto.message
        } catch (e: Exception) {
            null
        }
    }
}
