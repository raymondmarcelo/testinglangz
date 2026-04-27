package com.implementsprint.mobile

import java.net.URI

private val productionLikeEnvironments = setOf("uat", "main", "production")
private val supportedEnvironments = productionLikeEnvironments + setOf("development", "test")

data class ReleaseReadinessResult(
    val isReady: Boolean,
    val summary: String,
    val violations: List<String>,
)

class ReleaseReadinessEvaluator {
    fun evaluate(
        apiBaseUrl: String,
        environment: String,
    ): ReleaseReadinessResult {
        val violations = mutableListOf<String>()
        val normalizedEnvironment = environment.trim().lowercase()

        if (normalizedEnvironment !in supportedEnvironments) {
            violations.add("Environment must be one of development, test, uat, main, production")
        }

        val trimmedUrl = apiBaseUrl.trim()
        if (trimmedUrl.isBlank()) {
            violations.add("API base URL is required")
        }

        val parsedUri = parseUri(trimmedUrl)
        if (parsedUri == null) {
            violations.add("API base URL must be a valid absolute URI")
        }

        if (parsedUri != null) {
            val hasHttps = parsedUri.scheme.equals("https", ignoreCase = true)
            val host = parsedUri.host.orEmpty().lowercase()
            val normalizedPath = parsedUri.path.orEmpty().lowercase()
            val isLocalHost = host == "localhost" || host == "127.0.0.1"

            if (normalizedEnvironment in productionLikeEnvironments && !hasHttps) {
                violations.add("Production-like environments require HTTPS")
            }

            if (normalizedEnvironment in productionLikeEnvironments && isLocalHost) {
                violations.add("Production-like environments cannot use localhost endpoints")
            }

            if (normalizedEnvironment in productionLikeEnvironments && normalizedPath.contains("/mock")) {
                violations.add("Production-like environments cannot use mock endpoints")
            }

            if (normalizedEnvironment == "test" && !hasHttps && !isLocalHost) {
                violations.add("Test environment must use HTTPS unless running against localhost")
            }
        }

        return if (violations.isEmpty()) {
            ReleaseReadinessResult(
                isReady = true,
                summary = "Ready for deployment",
                violations = emptyList(),
            )
        } else {
            ReleaseReadinessResult(
                isReady = false,
                summary = "Not ready (${violations.size}): ${violations.joinToString("; ")}",
                violations = violations,
            )
        }
    }

    private fun parseUri(value: String): URI? =
        try {
            val uri = URI(value)
            if (uri.scheme.isNullOrBlank() || uri.host.isNullOrBlank()) {
                null
            } else {
                uri
            }
        } catch (_: IllegalArgumentException) {
            null
        } catch (_: Exception) {
            null
        }
}
