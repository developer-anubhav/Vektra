package com.vektra.presentation.home

import com.vektra.core.common.Result
import com.vektra.domain.model.AppConfig
import com.vektra.domain.repository.ConfigRepository
import com.vektra.domain.usecase.GetAppConfigUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadAppConfig updates uiState to success when usecase returns success`() = runTest {
        // Given
        val mockConfig = AppConfig(
            appName = "Vektra E-HRMS",
            environment = "Development",
            isNetworkReady = true,
            architectureVersion = "Phase 2 — Clean Architecture + MVVM + Hilt"
        )
        val mockRepository = object : ConfigRepository {
            override fun getAppConfig() = flowOf(Result.Success(mockConfig))
        }
        val useCase = GetAppConfigUseCase(mockRepository)
        val viewModel = HomeViewModel(useCase)

        // When
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.appConfig)
        assertEquals("Vektra E-HRMS", state.appConfig?.appName)
        assertEquals("Development", state.appConfig?.environment)
    }
}
