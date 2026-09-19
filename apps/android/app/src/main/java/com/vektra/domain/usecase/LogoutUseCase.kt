package com.vektra.domain.usecase

import com.vektra.core.common.Result
import com.vektra.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * UseCase encapsulating the logout session termination operation.
 */
class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Result<Unit> {
        return authRepository.logout()
    }
}
