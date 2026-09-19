# Vektra Android Application

## Architecture Overview — Phase 3 (Authentication & Security)

The Vektra Android application follows **Clean Architecture** paired with **MVVM (Model-View-ViewModel)**, **Hilt Dependency Injection**, and **JWT Authentication**.

```text
Presentation Layer (LoginScreen, EmployeePlaceholderScreen, Jetpack Compose)
       ↓
Domain Layer (LoginUseCase, LogoutUseCase, RestoreSessionUseCase, AuthUser, AuthSession)
       ↓
Data Layer (AuthRepositoryImpl, AuthApi, AuthMapper, TokenManager, AuthInterceptor)
       ↓
Vektra Node.js REST API (POST /api/auth/login)
```

### Key Technical Stack
* **Language**: Kotlin (JDK 17 target)
* **UI**: Jetpack Compose + Material 3
* **Navigation**: Navigation Compose (`VektraNavGraph` + session restoration routing)
* **Dependency Injection**: Dagger Hilt (`@HiltAndroidApp`, `@AndroidEntryPoint`, `@HiltViewModel`)
* **Networking**: Retrofit 2 + OkHttp 4 + Gson + `AuthInterceptor` (`Authorization: Bearer <token>`)
* **Security & Persistence**: Encapsulated `TokenManager` backed by Jetpack DataStore
* **Asynchronous / Reactive**: Kotlin Coroutines + Flow (`StateFlow`, `viewModelScope`)

---

## Package Structure

```text
com.vektra/
├── core/
│   ├── common/         # Result, UiState, Constants
│   ├── di/             # AppModule, NetworkModule, StorageModule, RepositoryModule
│   ├── network/        # ApiConstants, NetworkError, AuthInterceptor
│   ├── security/       # TokenManager (secure session persistence)
│   └── storage/        # DataStoreManager
├── data/
│   ├── mapper/         # AuthMapper (DTO -> Domain models)
│   ├── remote/         # AuthApi & DTOs (LoginRequestDto, LoginResponseDto, AuthUserDto)
│   └── repository/     # AuthRepositoryImpl, ConfigRepositoryImpl
├── domain/
│   ├── model/          # AuthUser, AuthSession, AuthState, AppConfig
│   ├── repository/     # AuthRepository, ConfigRepository
│   └── usecase/        # LoginUseCase, LogoutUseCase, RestoreSessionUseCase, GetAuthStateUseCase
├── presentation/
│   ├── auth/           # LoginScreen, LoginViewModel, LoginUiState
│   ├── components/     # LoadingView, ErrorView
│   ├── home/           # EmployeePlaceholderScreen, EmployeePlaceholderViewModel, HomeScreen, SplashScreen
│   ├── navigation/     # Screen, VektraNavGraph, NavViewModel
│   └── theme/          # Color, Theme, Type
├── MainActivity.kt     # Single Activity entry point (@AndroidEntryPoint)
└── VektraApplication.kt# Application entry point (@HiltAndroidApp)
```

---

## Build & Test Instructions

### Gradle Build
To assemble a debug APK:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

### Unit Tests
To execute unit tests:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat test
```
