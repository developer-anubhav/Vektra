package com.vektra.core.common

import com.vektra.core.network.NetworkError

/**
 * Generic result wrapper for Domain/Data layer state handling.
 */
sealed interface Result<out T> {
    data class Success<out T>(val data: T) : Result<T>
    data class Error(val error: NetworkError, val exception: Throwable? = null) : Result<Nothing>
    data object Loading : Result<Nothing>
}
