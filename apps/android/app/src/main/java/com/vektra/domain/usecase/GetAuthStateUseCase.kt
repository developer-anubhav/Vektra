package com.vektra.domain.usecase

import com.vektra.domain.model.AuthState
import com.vektra.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * UseCase encapsulating reactive authentication state observation.
 */
class GetAuthStateUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): Flow<AuthState> {
        return authRepository.getAuthState()
    }
}
