package com.vektra.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = VektraBluePrimary,
    onPrimary = VektraBlueOnPrimary,
    primaryContainer = VektraBlueContainer,
    onPrimaryContainer = VektraBlueOnContainer,
    secondary = VektraNavySecondary,
    onSecondary = VektraNavyOnSecondary,
    secondaryContainer = VektraNavyContainer,
    onSecondaryContainer = VektraNavyOnContainer,
    tertiary = VektraAccent,
    background = VektraBackground,
    onBackground = VektraOnBackground,
    surface = VektraSurface,
    onSurface = VektraOnSurface,
    surfaceVariant = VektraSurfaceVariant,
    onSurfaceVariant = VektraOnSurfaceVariant,
    outline = VektraOutline
)

@Composable
fun VektraTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
