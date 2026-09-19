package com.vektra.domain.model

/**
 * Domain model representing an authenticated Vektra user context.
 */
data class AuthUser(
    val name: String,
    val role: String,
    val companyId: String?,
    val email: String
) {
    val isEmployee: Boolean
        get() = role.equals("EMPLOYEE", ignoreCase = true)
}
