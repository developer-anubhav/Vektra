package com.vektra.domain.model

/**
 * Sealed representation of central application authentication state.
 */
sealed interface AuthState {
    data object Unknown : AuthState
    data object Unauthenticated : AuthState
    data class Authenticated(val session: AuthSession) : AuthState
}
