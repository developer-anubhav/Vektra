package com.vektra.presentation.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vektra.domain.usecase.RestoreSessionUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Navigation ViewModel handling session restoration check at launch.
 */
@HiltViewModel
class NavViewModel @Inject constructor(
    private val restoreSessionUseCase: RestoreSessionUseCase
) : ViewModel() {

    fun checkSession(onResult: (isAuthenticated: Boolean) -> Unit) {
        viewModelScope.launch {
            val session = restoreSessionUseCase()
            onResult(session != null)
        }
    }
}
