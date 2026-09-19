package com.vektra

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.vektra.presentation.navigation.VektraNavGraph
import com.vektra.presentation.theme.VektraTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Single Activity entry point for Project Vektra.
 * Delegates layout and flow to Navigation Compose (VektraNavGraph).
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VektraTheme {
                VektraNavGraph(modifier = Modifier.fillMaxSize())
            }
        }
    }
}
