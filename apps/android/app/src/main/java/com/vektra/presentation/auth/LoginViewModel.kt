package com.vektra.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vektra.core.common.Result
import com.vektra.core.network.NetworkError
import com.vektra.domain.usecase.LoginUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

private val EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()

/**
 * ViewModel for LoginScreen handling input validation and login execution.
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.update {
            it.copy(
                email = email,
                emailError = null,
                errorMessage = null
            )
        }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update {
            it.copy(
                password = password,
                passwordError = null,
                errorMessage = null
            )
        }
    }

    fun login() {
        val currentState = _uiState.value
        val email = currentState.email.trim()
        val password = currentState.password

        val emailError = when {
            email.isEmpty() -> "Email address is required"
            !isValidEmail(email) -> "Invalid email address format"
            else -> null
        }

        val passwordError = when {
            password.isEmpty() -> "Password is required"
            else -> null
        }

        if (emailError != null || passwordError != null) {
            _uiState.update {
                it.copy(
                    emailError = emailError,
                    passwordError = passwordError
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = loginUseCase(email = email, password = password)) {
                is Result.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isSuccess = true,
                            errorMessage = null,
                            password = "" // Immediately clear password in state
                        )
                    }
                }
                is Result.Error -> {
                    val userFriendlyMessage = mapErrorToUserFriendlyMessage(result.error, result.exception)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isSuccess = false,
                            errorMessage = userFriendlyMessage,
                            password = "" // Immediately clear password on error
                        )
                    }
                }
                is Result.Loading -> {
                    _uiState.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    fun resetSuccessState() {
        _uiState.update { it.copy(isSuccess = false) }
    }

    private fun isValidEmail(email: String): Boolean {
        return EMAIL_REGEX.matches(email)
    }

    private fun mapErrorToUserFriendlyMessage(error: NetworkError, exception: Throwable?): String {
        return when (error) {
            is NetworkError.NoInternet -> "Unable to connect to the server. Please try again later."
            is NetworkError.Timeout -> "Connection timed out. Please check your network and try again."
            is NetworkError.Unauthorized -> "Invalid email or password."
            is NetworkError.BadRequest -> exception?.message ?: "Invalid email or password."
            is NetworkError.ServerError -> "Server is currently unavailable. Please try again later."
            is NetworkError.Unknown -> {
                val rawMsg = exception?.message
                if (rawMsg != null && (rawMsg.contains("failed to connect", ignoreCase = true) || rawMsg.contains("Connection refused", ignoreCase = true))) {
                    "Unable to connect to the server. Please try again later."
                } else {
                    rawMsg ?: "Something went wrong. Please try again."
                }
            }
        }
    }
}
