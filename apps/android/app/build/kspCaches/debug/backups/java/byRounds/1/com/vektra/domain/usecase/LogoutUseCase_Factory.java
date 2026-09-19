package com.vektra.domain.usecase;

import com.vektra.domain.repository.AuthRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class LogoutUseCase_Factory implements Factory<LogoutUseCase> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public LogoutUseCase_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public LogoutUseCase get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static LogoutUseCase_Factory create(Provider<AuthRepository> authRepositoryProvider) {
    return new LogoutUseCase_Factory(authRepositoryProvider);
  }

  public static LogoutUseCase newInstance(AuthRepository authRepository) {
    return new LogoutUseCase(authRepository);
  }
}
