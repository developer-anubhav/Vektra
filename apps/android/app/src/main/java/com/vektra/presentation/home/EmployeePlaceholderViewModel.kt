package com.vektra.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vektra.domain.model.AuthSession
import com.vektra.domain.usecase.GetAuthStateUseCase
import com.vektra.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for EmployeePlaceholderScreen.
 */
@HiltViewModel
class EmployeePlaceholderViewModel @Inject constructor(
    getAuthStateUseCase: GetAuthStateUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    val authSession: StateFlow<AuthSession?> = getAuthStateUseCase()
        .map { (it as? com.vektra.domain.model.AuthState.Authenticated)?.session }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            logoutUseCase()
            onLoggedOut()
        }
    }
}
