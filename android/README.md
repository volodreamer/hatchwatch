# Hatchwatch for Android

Native Jetpack Compose app — **not** a WebView. Lives on the `android` branch so the website on `main` stays untouched.

The P1 engine, LCD, care buttons, Match the device, file backups, and English/Ukrainian copy all live in Kotlin.

The shell still does **not** beep for poop or sickness. The phone does, with clock-grade exact alarms even when Hatchwatch is closed or the screen is off.

Backups are the same `hatchwatch-v1` JSON as the website. Save a file here, open it there — or paste the short copy. Google Drive sign-in is website-only for now.

Once the pet is an adult (evolved in the app **or** matched on the device), the Growth path card locks to that form. Mistake counts stay on the card; it no longer predicts a different adult.

Home uses the website **Carbon** palette by default (true black, grey tiles). Settings can switch to Garden, Classic yellow, or Ice. Care buttons use the same icons as the PWA. The LCD clock shows the date under the time.

## Download an APK from GitHub

You do not need Android Studio on the phone machine. Each push to `android` (and a manual button) builds `hatchwatch-debug.apk`.

1. Open [Actions → Android APK](https://github.com/volodreamer/hatchwatch/actions/workflows/android-apk.yml).
2. Pick the latest green run on the `android` branch. First run after this commit takes a few minutes.
3. **hatchwatch-debug-apk** → download the zip → unzip `hatchwatch-debug.apk`.
4. On the phone: allow install from the browser/Files app, then open the APK.

To build without a new commit: **Actions → Android APK → Run workflow → branch `android` → Run workflow**.

This is a debug APK (debug keystore). Fine for your own phone. Play Store / a signed release needs a keystore later.

## Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio) (Ladybug / 2024.2+ is fine).
2. **Open** this `android` folder (the one that contains `settings.gradle.kts`), not the Hatchwatch website root. Opening the repo root will not give you an Android run configuration.
3. Set **Gradle JDK to 17 or 21** (see below). JDK 22+ will fail sync.
4. Let Gradle sync. SDK 35 is requested; Studio can install it. The project downloads a JDK 17 toolchain for compiling if needed.
5. Use the **app** run configuration (green triangle). Plug in a phone (USB debugging) or start an emulator. minSdk is 26 (Android 8).

First launch asks for **notifications**, **exact alarms**, and **unrestricted battery**. Allow all three. Care alerts are booked with `AlarmManager.setAlarmClock` so they fire with the app swiped away. A 3-hour watchdog rebooks them if the phone slept through a window. Reboot / timezone / app-update also rebook.

On Xiaomi / HyperOS / some Samsungs: Settings → Apps → Hatchwatch → Battery → **Unrestricted**, and enable Autostart if that toggle exists. Force-stopping the app from system settings still cancels Android alarms until you open it once.

## Gradle JDK must be 17 or 21
