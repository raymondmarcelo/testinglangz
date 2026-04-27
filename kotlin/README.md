# Native Kotlin Android Boilerplate

This repository is a reusable Native Kotlin Android boilerplate for the single-system mobile pipeline. It replaces the previous React Native/Expo implementation.

## Stack

- Kotlin
- Android SDK
- Gradle (Kotlin DSL)
- JUnit & Espresso

## Structure

```text
app/
  src/
    main/
      java/com/implementsprint/mobile/
      res/
        values/
    androidTest/
    test/
  build.gradle.kts
build.gradle.kts
settings.gradle.kts
gradle.properties
```

## Commands

- `./gradlew assembleDebug`: Build debug APK
- `./gradlew assembleRelease`: Build release APK
- `./gradlew test`: Run unit tests
- `./gradlew connectedAndroidTest`: Run instrumented tests
- `./gradlew lint`: Run Android Lint

## CI/CD Pipeline

The template uses a workflow caller at `.github/workflows/mobile-pipeline-caller.yml` that delegates execution to the central orchestrator workflow (`master-pipeline-mobile.yml` in `central-workflow`).

### Action Required: Update Repository Variables

Since this repository is now a native Kotlin Android project, you **must** update the `MOBILE_SINGLE_SYSTEMS_JSON` repository variable in your GitHub settings.

**Recommended value for Kotlin Android:**

```json
{
  "name": "mobile-kotlin",
  "dir": ".",
  "mobile_stack": "kotlin",
  "enable_android_build": true,
  "enable_ios_build": false,
  "version_stream": "mobile-kotlin"
}
```

This configuration ensures the central workflow detects the project type as Kotlin/Android and executes the appropriate Gradle build jobs instead of React Native/Expo jobs.
