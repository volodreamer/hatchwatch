import java.util.Base64

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

kotlin {
    jvmToolchain(17)
}

fun hatchwatchKeystore(): File {
    val dir = rootProject.file("keystore")
    val jks = File(dir, "hatchwatch-debug.jks")
    val b64 = File(dir, "hatchwatch-debug.b64")
    if (!jks.exists()) {
        require(b64.exists()) { "Missing $b64 — pull android/keystore/hatchwatch-debug.b64" }
        dir.mkdirs()
        jks.writeBytes(Base64.getDecoder().decode(b64.readText().filter { !it.isWhitespace() }))
    }
    return jks
}

fun hatchwatchIflashFont(): File {
    val ttf = file("src/main/res/font/iflash_502.ttf")
    val dir = rootProject.file("fonts")
    val aa = File(dir, "iflash_502.ttf.b64.aa")
    val ab = File(dir, "iflash_502.ttf.b64.ab")
    val single = File(dir, "iflash_502.ttf.b64")
    val b64 = when {
        aa.exists() && ab.exists() -> aa.readText() + ab.readText()
        single.exists() -> single.readText()
        else -> error("Missing iFlash 502 payload in android/fonts/")
    }
    ttf.parentFile.mkdirs()
    ttf.writeBytes(Base64.getDecoder().decode(b64.filter { !it.isWhitespace() }))
    return ttf
}

hatchwatchIflashFont()

android {
    namespace = "com.hatchwatch.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.hatchwatch.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 5
        versionName = "2.1.2"
    }

    signingConfigs {
        create("shared") {
            storeFile = hatchwatchKeystore()
            storePassword = "hatchwatch"
            keyAlias = "androiddebugkey"
            keyPassword = "hatchwatch"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("shared")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("shared")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    lint {
        abortOnError = false
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
