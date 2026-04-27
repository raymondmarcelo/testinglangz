package com.implementsprint.mobile

import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldContainAll
import io.kotest.matchers.shouldBe

class SampleKotestSpec :
    FunSpec({
        val evaluator = ReleaseReadinessEvaluator()

        test("marks valid uat endpoint as ready") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "https://api.example.com",
                    environment = "uat",
                )

            result.isReady shouldBe true
            result.summary shouldBe "Ready for deployment"
            result.violations shouldBe emptyList()
        }

        test("rejects blank api base url") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "   ",
                    environment = "uat",
                )

            result.isReady shouldBe false
            result.summary.contains("Not ready") shouldBe true
            result.violations shouldContain "API base URL is required"
            result.violations shouldContain "API base URL must be a valid absolute URI"
        }

        test("rejects insecure endpoint for production-like environments") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "http://api.example.com",
                    environment = "main",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Production-like environments require HTTPS"
        }

        test("rejects localhost endpoints for production-like environments") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "https://localhost:8080",
                    environment = "production",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Production-like environments cannot use localhost endpoints"
        }

        test("rejects mock path endpoints for production-like environments") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "https://api.example.com/mock/users",
                    environment = "uat",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Production-like environments cannot use mock endpoints"
        }

        test("rejects uppercase mock path endpoints for production-like environments") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "https://api.example.com/MOCK/users",
                    environment = "main",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Production-like environments cannot use mock endpoints"
        }

        test("allows localhost endpoint for development") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "http://localhost:8080",
                    environment = "development",
                )

            result.isReady shouldBe true
            result.summary shouldBe "Ready for deployment"
        }

        test("requires valid environment value") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "https://api.example.com",
                    environment = "preview",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Environment must be one of development, test, uat, main, production"
        }

        test("rejects non-https non-localhost endpoint for test environment") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "http://staging.example.com",
                    environment = "test",
                )

            result.isReady shouldBe false
            result.violations shouldContain "Test environment must use HTTPS unless running against localhost"
        }

        test("returns multiple violations for invalid production-like configuration") {
            val result =
                evaluator.evaluate(
                    apiBaseUrl = "http://localhost/mock",
                    environment = "main",
                )

            result.isReady shouldBe false
            result.violations.shouldContainAll(
                "Production-like environments require HTTPS",
                "Production-like environments cannot use localhost endpoints",
                "Production-like environments cannot use mock endpoints",
            )
        }
    })
