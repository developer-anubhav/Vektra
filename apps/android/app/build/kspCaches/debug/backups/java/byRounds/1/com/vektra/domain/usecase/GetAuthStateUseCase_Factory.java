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
public final class GetAuthStateUseCase_Factory implements Factory<GetAuthStateUseCase> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public GetAuthStateUseCase_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public GetAuthStateUseCase get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static GetAuthStateUseCase_Factory create(
      Provider<AuthRepository> authRepositoryProvider) {
    return new GetAuthStateUseCase_Factory(authRepositoryProvider);
  }

  public static GetAuthStateUseCase newInstance(AuthRepository authRepository) {
    return new GetAuthStateUseCase(authRepository);
  }
}
