package com.vektra.presentation.home;

import com.vektra.domain.usecase.GetAppConfigUseCase;
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
public final class HomeViewModel_Factory implements Factory<HomeViewModel> {
  private final Provider<GetAppConfigUseCase> getAppConfigUseCaseProvider;

  public HomeViewModel_Factory(Provider<GetAppConfigUseCase> getAppConfigUseCaseProvider) {
    this.getAppConfigUseCaseProvider = getAppConfigUseCaseProvider;
  }

  @Override
  public HomeViewModel get() {
    return newInstance(getAppConfigUseCaseProvider.get());
  }

  public static HomeViewModel_Factory create(
      Provider<GetAppConfigUseCase> getAppConfigUseCaseProvider) {
    return new HomeViewModel_Factory(getAppConfigUseCaseProvider);
  }

  public static HomeViewModel newInstance(GetAppConfigUseCase getAppConfigUseCase) {
    return new HomeViewModel(getAppConfigUseCase);
  }
}
