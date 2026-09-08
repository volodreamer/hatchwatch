# Hatchwatch debug keystore

Every debug APK — GitHub Actions and Android Studio — must use this key.
Android will refuse an update (`App not installed` / `INSTALL_FAILED_UPDATE_INCOMPATIBLE`) if the new APK is signed with a different certificate than the one already on the phone.

`hatchwatch-debug.b64` is the keystore. Gradle decodes it to `hatchwatch-debug.jks` at build time. Do not commit the `.jks`.

- store password / key password: `hatchwatch`
- alias: `androiddebugkey`

This is a debug key for sideloading on your own phone, not a Play Store upload key.
