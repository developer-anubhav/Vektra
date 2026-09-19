package com.vektra.domain.usecase

import com.vektra.core.common.Result
import com.vektra.domain.model.AppConfig
import com.vektra.domain.repository.ConfigRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Domain UseCase for retrieving application configuration state.
 */
class GetAppConfigUseCase @Inject constructor(
    private val configRepository: ConfigRepository
) {
    operator fun invoke(): Flow<Result<AppConfig>> {
        return configRepository.getAppConfig()
    }
}
