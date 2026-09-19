package com.vektra.core.storage

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "vektra_preferences")

/**
 * Thread-safe Jetpack DataStore manager for app preferences and settings foundation.
 */
@Singleton
class DataStoreManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private val APP_ENVIRONMENT_KEY = stringPreferencesKey("app_environment")
        private val LAST_SYNC_KEY = stringPreferencesKey("last_sync")
    }

    val appEnvironment: Flow<String> = context.dataStore.data
        .map { preferences ->
            preferences[APP_ENVIRONMENT_KEY] ?: "Development"
        }

    suspend fun saveAppEnvironment(environment: String) {
        context.dataStore.edit { preferences ->
            preferences[APP_ENVIRONMENT_KEY] = environment
        }
    }

    val lastSyncTime: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[LAST_SYNC_KEY]
        }

    suspend fun saveLastSyncTime(timestamp: String) {
        context.dataStore.edit { preferences ->
            preferences[LAST_SYNC_KEY] = timestamp
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
