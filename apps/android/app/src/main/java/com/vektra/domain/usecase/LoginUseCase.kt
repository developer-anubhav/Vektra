package com.vektra.domain.usecase

import com.vektra.core.common.Result
import com.vektra.domain.model.AuthSession
import com.vektra.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * UseCase encapsulating the login business operation.
 */
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<AuthSession> {
        return authRepository.login(email.trim(), password)
    }
}
