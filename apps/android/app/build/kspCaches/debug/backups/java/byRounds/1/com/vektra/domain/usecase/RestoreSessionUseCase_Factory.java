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
public final class RestoreSessionUseCase_Factory implements Factory<RestoreSessionUseCase> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public RestoreSessionUseCase_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public RestoreSessionUseCase get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static RestoreSessionUseCase_Factory create(
      Provider<AuthRepository> authRepositoryProvider) {
    return new RestoreSessionUseCase_Factory(authRepositoryProvider);
  }

  public static RestoreSessionUseCase newInstance(AuthRepository authRepository) {
    return new RestoreSessionUseCase(authRepository);
  }
}
