package com.vektra.data.mapper

import com.vektra.data.remote.dto.LoginResponseDto
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthUser

/**
 * Mapper converting DTO network payloads to pure Domain models.
 */
object AuthMapper {

    fun mapToDomainSession(dto: LoginResponseDto, email: String): AuthSession? {
        val token = dto.token ?: return null
        val role = dto.role ?: "EMPLOYEE"
        val name = dto.name ?: "Employee"
        val companyId = dto.companyId

        return AuthSession(
            accessToken = token,
            user = AuthUser(
                name = name,
                role = role,
                companyId = companyId,
                email = email
            )
        )
    }
}
