package com.vektra.domain.repository

import com.vektra.core.common.Result
import com.vektra.domain.model.AppConfig
import kotlinx.coroutines.flow.Flow

/**
 * Domain Repository contract for application configuration and initialization.
 */
interface ConfigRepository {
    fun getAppConfig(): Flow<Result<AppConfig>>
}
