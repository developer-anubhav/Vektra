package com.vektra.data.mapper

import com.vektra.data.remote.dto.LoginResponseDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class AuthMapperTest {

    @Test
    fun `mapToDomainSession maps DTO to Domain AuthSession correctly`() {
        val dto = LoginResponseDto(
            token = "jwt.test.token",
            role = "EMPLOYEE",
            name = "Jane Doe",
            companyId = "comp123"
        )
        val email = "jane@example.com"

        val session = AuthMapper.mapToDomainSession(dto, email)

        assertNotNull(session)
        assertEquals("jwt.test.token", session?.accessToken)
        assertEquals("Jane Doe", session?.user?.name)
        assertEquals("EMPLOYEE", session?.user?.role)
        assertEquals("comp123", session?.user?.companyId)
        assertEquals("jane@example.com", session?.user?.email)
    }

    @Test
    fun `mapToDomainSession returns null when token is missing`() {
        val dto = LoginResponseDto(
            token = null,
            role = "EMPLOYEE",
            name = "Jane Doe",
            companyId = "comp123"
        )
        val session = AuthMapper.mapToDomainSession(dto, "jane@example.com")
        assertNull(session)
    }
}
