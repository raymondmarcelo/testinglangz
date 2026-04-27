package com.implementsprint.mobile

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.hamcrest.CoreMatchers.containsString
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityInstrumentedTest {
    @get:Rule
    val activityScenarioRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun validateReadiness_showsReadyStateForUatHttpsEndpoint() {
        onView(withId(R.id.environmentInput)).perform(replaceText("uat"), closeSoftKeyboard())
        onView(withId(R.id.apiBaseUrlInput)).perform(replaceText("https://api.example.com"), closeSoftKeyboard())

        onView(withId(R.id.validateButton)).perform(click())

        onView(withId(R.id.readinessStatusText)).check(matches(withText("Ready for deployment")))
    }

    @Test
    fun validateReadiness_showsViolationStateForMainInsecureEndpoint() {
        onView(withId(R.id.environmentInput)).perform(replaceText("main"), closeSoftKeyboard())
        onView(withId(R.id.apiBaseUrlInput)).perform(replaceText("http://localhost/mock"), closeSoftKeyboard())

        onView(withId(R.id.validateButton)).perform(click())

        onView(withId(R.id.readinessStatusText)).check(matches(withText(containsString("Not ready"))))
    }
}
