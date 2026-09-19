package com.vektra.core.security

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthUser
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.tokenDataStore: DataStore<Preferences> by preferencesDataStore(name = "vektra_secure_tokens")

/**
 * Encapsulated token and authentication session manager using Jetpack DataStore.
 * Prevents raw token leakage to UI and exposes session state securely.
 */
@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_COMPANY_ID_KEY = stringPreferencesKey("user_company_id")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val accessToken: Flow<String?> = context.tokenDataStore.data.map { preferences ->
        preferences[ACCESS_TOKEN_KEY]
    }

    val authSession: Flow<AuthSession?> = context.tokenDataStore.data.map { preferences ->
        val token = preferences[ACCESS_TOKEN_KEY] ?: return@map null
        val role = preferences[USER_ROLE_KEY] ?: "EMPLOYEE"
        val name = preferences[USER_NAME_KEY] ?: "Employee"
        val companyId = preferences[USER_COMPANY_ID_KEY]
        val email = preferences[USER_EMAIL_KEY] ?: ""

        AuthSession(
            accessToken = token,
            user = AuthUser(
                name = name,
                role = role,
                companyId = companyId,
                email = email
            )
        )
    }

    suspend fun saveSession(token: String, role: String, name: String, companyId: String?, email: String) {
        context.tokenDataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = token
            preferences[USER_ROLE_KEY] = role
            preferences[USER_NAME_KEY] = name
            if (companyId != null) {
                preferences[USER_COMPANY_ID_KEY] = companyId
            } else {
                preferences.remove(USER_COMPANY_ID_KEY)
            }
            preferences[USER_EMAIL_KEY] = email
        }
    }

    suspend fun getAccessTokenDirect(): String? {
        return context.tokenDataStore.data.map { it[ACCESS_TOKEN_KEY] }.firstOrNull()
    }

    suspend fun getAuthSessionDirect(): AuthSession? {
        return authSession.firstOrNull()
    }

    suspend fun clearSession() {
        context.tokenDataStore.edit { preferences ->
            preferences.clear()
        }
    }

    suspend fun hasValidSession(): Boolean {
        val token = getAccessTokenDirect()
        return !token.isNullOrBlank()
    }
}
