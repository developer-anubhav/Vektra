package com.vektra.data.repository

import com.vektra.core.common.Result
import com.vektra.core.storage.DataStoreManager
import com.vektra.domain.model.AppConfig
import com.vektra.domain.repository.ConfigRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Data layer implementation of ConfigRepository.
 */
@Singleton
class ConfigRepositoryImpl @Inject constructor(
    private val dataStoreManager: DataStoreManager
) : ConfigRepository {

    override fun getAppConfig(): Flow<Result<AppConfig>> {
        return dataStoreManager.appEnvironment.map { environment ->
            Result.Success(
                AppConfig(
                    appName = "Vektra E-HRMS",
                    environment = environment,
                    isNetworkReady = true,
                    architectureVersion = "Phase 2 — Clean Architecture + MVVM + Hilt"
                )
            )
        }
    }
}
