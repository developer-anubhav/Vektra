package com.vektra.domain.usecase

import com.vektra.domain.model.AuthSession
import com.vektra.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * UseCase for initializing and restoring session on app launch.
 */
class RestoreSessionUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): AuthSession? {
        return authRepository.restoreSession()
    }
}
