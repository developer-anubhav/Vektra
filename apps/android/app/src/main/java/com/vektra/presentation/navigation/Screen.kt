package com.vektra.presentation.navigation

/**
 * Sealed class representing application navigation destinations.
 */
sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Login : Screen("login")
    data object Home : Screen("home")
    data object EmployeePlaceholder : Screen("employee_placeholder")
}
