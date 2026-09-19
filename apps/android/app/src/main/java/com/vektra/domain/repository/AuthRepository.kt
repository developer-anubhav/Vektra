package com.vektra.domain.repository

import com.vektra.core.common.Result
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthState
import kotlinx.coroutines.flow.Flow

/**
 * Domain Repository contract for authentication and session management.
 */
interface AuthRepository {
    suspend fun login(email: String, password: String): Result<AuthSession>
    suspend fun logout(): Result<Unit>
    fun getAuthState(): Flow<AuthState>
    suspend fun restoreSession(): AuthSession?
}
