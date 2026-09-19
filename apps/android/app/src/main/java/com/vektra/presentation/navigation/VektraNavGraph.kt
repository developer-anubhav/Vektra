package com.vektra.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vektra.presentation.auth.LoginScreen
import com.vektra.presentation.home.EmployeePlaceholderScreen
import com.vektra.presentation.home.HomeScreen
import com.vektra.presentation.home.SplashScreen

/**
 * Centralized Navigation Graph handling Authentication and Navigation flows.
 */
@Composable
fun VektraNavGraph(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Splash.route,
    navViewModel: NavViewModel = hiltViewModel()
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable(route = Screen.Splash.route) {
            SplashScreen(
                onSplashFinished = {
                    navViewModel.checkSession { isAuthenticated ->
                        val targetRoute = if (isAuthenticated) {
                            Screen.EmployeePlaceholder.route
                        } else {
                            Screen.Login.route
                        }
                        navController.navigate(targetRoute) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                }
            )
        }
        composable(route = Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.EmployeePlaceholder.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(route = Screen.EmployeePlaceholder.route) {
            EmployeePlaceholderScreen(
                onLogoutFinished = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.EmployeePlaceholder.route) { inclusive = true }
                    }
                }
            )
        }
        composable(route = Screen.Home.route) {
            HomeScreen()
        }
    }
}
