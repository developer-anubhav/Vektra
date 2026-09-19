package com.vektra.domain.model

/**
 * Domain model representing an active authentication session.
 */
data class AuthSession(
    val accessToken: String,
    val user: AuthUser
)
