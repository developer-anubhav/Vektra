package com.vektra.presentation.navigation;

import com.vektra.domain.usecase.RestoreSessionUseCase;
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
public final class NavViewModel_Factory implements Factory<NavViewModel> {
  private final Provider<RestoreSessionUseCase> restoreSessionUseCaseProvider;

  public NavViewModel_Factory(Provider<RestoreSessionUseCase> restoreSessionUseCaseProvider) {
    this.restoreSessionUseCaseProvider = restoreSessionUseCaseProvider;
  }

  @Override
  public NavViewModel get() {
    return newInstance(restoreSessionUseCaseProvider.get());
  }

  public static NavViewModel_Factory create(
      Provider<RestoreSessionUseCase> restoreSessionUseCaseProvider) {
    return new NavViewModel_Factory(restoreSessionUseCaseProvider);
  }

  public static NavViewModel newInstance(RestoreSessionUseCase restoreSessionUseCase) {
    return new NavViewModel(restoreSessionUseCase);
  }
}
