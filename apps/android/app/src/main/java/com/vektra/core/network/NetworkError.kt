package com.vektra.core.network

/**
 * Enterprise abstraction for network and API error states.
 */
sealed interface NetworkError {
    data object NoInternet : NetworkError
    data object Timeout : NetworkError
    data class ServerError(val code: Int, val message: String? = null) : NetworkError
    data object Unauthorized : NetworkError
    data object BadRequest : NetworkError
    data class Unknown(val message: String? = null) : NetworkError
}
