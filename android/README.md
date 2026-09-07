# Hatchwatch for Android

Native Jetpack Compose app — **not** a WebView. Lives on the `android` branch so the website on `main` stays untouched.

The P1 engine, LCD, care buttons, Match the device, file backups, and English/Ukrainian copy all live in Kotlin.

The shell still does **not** beep for poop or sickness. The phone does, with exact alarms on the alarm stream even when Hatchwatch is closed.

Backups are the same `hatchwatch-v1` JSON as the website. Save a file here, open it there — or paste the short copy. Google Drive sign-in is website-only for now.

Once the pet is an adult (evolved in the app **or** matched on the device), the Growth path card locks to that form. Mistake counts stay on the card; it no longer predicts a different adult.

## Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio) (Ladybug / 2024.2+ is fine).
2. **Open** this `android` folder (the one that contains `settings.gradle.kts`), not the Hatchwatch website root. Opening the repo root will not give you an Android run configuration.
3. Set **Gradle JDK to 17 or 21** (see below). JDK 22+ will fail sync.
4. Let Gradle sync. SDK 35 is requested; Studio can install it. The project downloads a JDK 17 toolchain for compiling if needed.
5. Use the **app** run configuration (green triangle). Plug in a phone (USB debugging) or start an emulator. minSdk is 26 (Android 8).

First launch asks for **notifications** and **exact alarms**. Allow both, or poop / skull / attention chirps will be silent when the screen is off. If Doze still delays them, exempt Hatchwatch from battery optimization.

## Gradle JDK must be 17 or 21

This project cannot use JDK 22, 23, or 24 as the Gradle JVM. In Android Studio:

1. **File → Settings** (macOS: **Android Studio → Settings**).
2. **Build, Execution, Deployment → Build Tools → Gradle**.
3. **Gradle JDK** → pick **jbr-17** or **jbr-21** (JetBrains Runtime). Not `JAVA_HOME` if that is 22+.
4. If 17 is missing: that same JDK dropdown → **Download JDK** → version **17** → Eclipse Temurin or JetBrains Runtime → apply.
5. **File → Sync Project with Gradle Files**.

The app still compiles as Java 17. That is separate from the JDK Studio uses to run Gradle.

## Run / debug configuration

The **app** configuration lives in `.idea/runConfigurations/app.xml`. After opening this folder it should appear in the run dropdown next to the green triangle. It launches `com.hatchwatch.app` on the selected device.

If the dropdown is empty: **Run → Edit Configurations → + → Android App** → Module **Hatchwatch.app** → Launch default activity.

## What this app does

- Same P1 timers as the website: hunger, happy, poop, scheduled skull, misbehave after heart drops
- Companion checks: **On the shell** / **Not on the shell** — the phone never invents poop or a skull
- Replica vs original 1996–97 firmware
- `AlarmManager.setExactAndAllowWhileIdle` + `STREAM_ALARM` chirps
- 2-minute warning before a 15-minute care penalty
- Reschedule on reboot
- File save / open / paste so a run can move between the phone app and the website
- Grown form is definitive on the Growth path card (same as the website)

## Not in this first cut

- Google Drive backup (use the website, then Save / Open file)
- Play Store listing / signed release APK

## If Gradle asks for a wrapper

This folder already has `gradlew` and `gradle/wrapper`. If Studio still offers to generate one, accept it.
