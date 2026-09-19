package com.vektra.presentation.auth

import com.vektra.core.common.Result
import com.vektra.core.network.NetworkError
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthUser
import com.vektra.domain.repository.AuthRepository
import com.vektra.domain.usecase.LoginUseCase
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

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
    fun `login with empty fields sets validation errors`() = runTest {
        val mockRepo = object : AuthRepository {
            override suspend fun login(email: String, password: String) = Result.Error(NetworkError.BadRequest)
            override suspend fun logout() = Result.Success(Unit)
            override fun getAuthState() = flowOf(com.vektra.domain.model.AuthState.Unauthenticated)
            override suspend fun restoreSession(): AuthSession? = null
        }
        val viewModel = LoginViewModel(LoginUseCase(mockRepo))

        viewModel.login()

        val state = viewModel.uiState.value
        assertNotNull(state.emailError)
        assertNotNull(state.passwordError)
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
    }

    @Test
    fun `login with valid credentials invokes usecase successfully`() = runTest {
        val session = AuthSession(
            accessToken = "valid_token",
            user = AuthUser(name = "Employee Test", role = "EMPLOYEE", companyId = "c1", email = "emp@vektra.com")
        )
        val mockRepo = object : AuthRepository {
            override suspend fun login(email: String, password: String) = Result.Success(session)
            override suspend fun logout() = Result.Success(Unit)
            override fun getAuthState() = flowOf(com.vektra.domain.model.AuthState.Authenticated(session))
            override suspend fun restoreSession(): AuthSession? = session
        }
        val viewModel = LoginViewModel(LoginUseCase(mockRepo))

        viewModel.onEmailChanged("emp@vektra.com")
        viewModel.onPasswordChanged("securePassword123")
        viewModel.login()

        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isSuccess)
        assertNull(state.errorMessage)
        assertEquals("", state.password) // Password cleared
    }

    @Test
    fun `login with network connection error maps to user friendly message`() = runTest {
        val mockRepo = object : AuthRepository {
            override suspend fun login(email: String, password: String) =
                Result.Error(NetworkError.NoInternet, IOException("failed to connect to /10.0.2.2 (port 5000) after 30000ms"))
            override suspend fun logout() = Result.Success(Unit)
            override fun getAuthState() = flowOf(com.vektra.domain.model.AuthState.Unauthenticated)
            override suspend fun restoreSession(): AuthSession? = null
        }
        val viewModel = LoginViewModel(LoginUseCase(mockRepo))

        viewModel.onEmailChanged("emp@vektra.com")
        viewModel.onPasswordChanged("securePassword123")
        viewModel.login()

        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertEquals("Unable to connect to the server. Please try again later.", state.errorMessage)
    }
}
