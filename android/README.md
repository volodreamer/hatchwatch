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

This is a debug APK signed with the project keystore in `android/keystore/`. Fine for your own phone. Play Store / a signed release needs a different key later.

### “App not installed” when updating

Android will not replace an installed app if the new APK is signed with a different key. Early GitHub builds each used a fresh CI debug key, and Android Studio used yet another key on your machine — that is why overlay installs failed even between two GitHub APKs.

From version **2.1.1** (versionCode 4) onward, Studio and Actions share one keystore. **One last time:** uninstall Hatchwatch, then install the new APK. After that, later GitHub APKs should install over the existing one.

Uninstall wipes local pet state. Before you remove the old build: Settings → backup / copy the short JSON, then restore it after the new install.

## Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio) (Ladybug / 2024.2+ is fine).
2. **Open** this `android` folder (the one that contains `settings.gradle.kts`), not the Hatchwatch website root. Opening the repo root will not give you an Android run configuration.
3. Set **Gradle JDK to 17 or 21** (see below). JDK 22+ will fail sync.
4. Let Gradle sync. SDK 35 is requested; Studio can install it. The project downloads a JDK 17 toolchain for compiling if needed.
5. Use the **app** run configuration (green triangle). Plug in a phone (USB debugging) or start an emulator. minSdk is 26 (Android 8).

First launch asks for **notifications**, **exact alarms**, and **unrestricted battery**. Allow all three. Care alerts are booked with `AlarmManager.setAlarmClock` so they fire with the app swiped away. A 3-hour watchdog rebooks them if the phone slept through a window. Reboot / timezone / app-update also rebook.

On Xiaomi / HyperOS / some Samsungs: Settings → Apps → Hatchwatch → Battery → **Unrestricted**, and enable Autostart if that toggle exists. Force-stopping the app from system settings still cancels Android alarms until you open it once.

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
- `AlarmManager.setAlarmClock` for the next care event (Doze cannot defer it) plus exact idle alarms for the rest
- 2-minute warning before a 15-minute care penalty
- Reschedule on reboot, time change, timezone change, and app update
- File save / open / paste so a run can move between the phone app and the website
- Grown form is definitive on the Growth path card (same as the website)

## Not in this first cut

- Google Drive backup (use the website, then Save / Open file)
- Play Store listing / signed release APK

## If Gradle asks for a wrapper

This folder already has `gradlew` and `gradle/wrapper`. If Studio still offers to generate one, accept it.
