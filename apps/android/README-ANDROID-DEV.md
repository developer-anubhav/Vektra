# Vektra Android Development & Networking Guide

## Overview

This guide details the permanent, reliable local development networking architecture for the **Vektra Android Application** and **Node.js REST Backend**.

---

## 1. Network Architecture

### Local Development Flow
```text
Android Application (Debug Build)
        ↓
http://127.0.0.1:5000/api/
        ↓
ADB Reverse Tunnel (tcp:5000 -> tcp:5000)
        ↓
Windows host localhost:5000
        ↓
Vektra Node.js REST API
```

### Production Flow
```text
Android Application (Release Build)
        ↓
https://api.vektra.com/api/ (HTTPS)
        ↓
Vektra Production Server
```

---

## 2. Quick Startup Instructions

### Step 1: Start the Backend Server
In PowerShell or Terminal:
```powershell
cd backend
npm run dev
# Server will listen on 0.0.0.0:5000
```

### Step 2: Run Development Setup Script
In PowerShell from the repository root:
```powershell
.\setup-android-dev.ps1
```
This script automatically:
* Locates `adb.exe`.
* Detects connected physical devices or Android Emulators.
* Executes `adb reverse tcp:5000 tcp:5000`.
* Verifies `adb reverse --list`.
* Tests `http://localhost:5000/api/health`.

### Step 3: Run the Android Application
Open Android Studio, select the debug build variant, and run on your connected device or emulator. The debug build automatically uses `BuildConfig.API_BASE_URL` (`http://127.0.0.1:5000/api/`).

---

## 3. Environment-Aware Build Configuration

Configured in [`android/app/build.gradle.kts`](file:///c:/Code/E-HRMS/android/app/build.gradle.kts):

```kotlin
buildTypes {
    debug {
        buildConfigField("String", "API_BASE_URL", "\"http://127.0.0.1:5000/api/\"")
    }
    release {
        buildConfigField("String", "API_BASE_URL", "\"https://api.vektra.com/api/\"")
    }
}
```

Referenced centrally in [`ApiConstants.kt`](file:///c:/Code/E-HRMS/android/app/src/main/java/com/vektra/core/network/ApiConstants.kt):

```kotlin
object ApiConstants {
    val BASE_URL: String = BuildConfig.API_BASE_URL
}
```

---

## 4. Production Migration Checklist
When deploying to production:
1. Update `release` build variant `API_BASE_URL` in `app/build.gradle.kts` to your production HTTPS domain.
2. Production builds strictly enforce HTTPS via [`network_security_config.xml`](file:///c:/Code/E-HRMS/android/app/src/main/res/xml/network_security_config.xml) (cleartext HTTP permitted only for local development IPs `127.0.0.1`, `10.0.2.2`, and `localhost`).
