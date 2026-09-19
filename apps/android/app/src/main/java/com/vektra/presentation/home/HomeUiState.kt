package com.vektra.presentation.home

import com.vektra.domain.model.AppConfig

/**
 * Immutable UI State for HomeScreen.
 */
data class HomeUiState(
    val isLoading: Boolean = false,
    val appConfig: AppConfig? = null,
    val errorMessage: String? = null
)
