package com.vektra.presentation.home;

import com.vektra.domain.usecase.GetAuthStateUseCase;
import com.vektra.domain.usecase.LogoutUseCase;
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
public final class EmployeePlaceholderViewModel_Factory implements Factory<EmployeePlaceholderViewModel> {
  private final Provider<GetAuthStateUseCase> getAuthStateUseCaseProvider;

  private final Provider<LogoutUseCase> logoutUseCaseProvider;

  public EmployeePlaceholderViewModel_Factory(
      Provider<GetAuthStateUseCase> getAuthStateUseCaseProvider,
      Provider<LogoutUseCase> logoutUseCaseProvider) {
    this.getAuthStateUseCaseProvider = getAuthStateUseCaseProvider;
    this.logoutUseCaseProvider = logoutUseCaseProvider;
  }

  @Override
  public EmployeePlaceholderViewModel get() {
    return newInstance(getAuthStateUseCaseProvider.get(), logoutUseCaseProvider.get());
  }

  public static EmployeePlaceholderViewModel_Factory create(
      Provider<GetAuthStateUseCase> getAuthStateUseCaseProvider,
      Provider<LogoutUseCase> logoutUseCaseProvider) {
    return new EmployeePlaceholderViewModel_Factory(getAuthStateUseCaseProvider, logoutUseCaseProvider);
  }

  public static EmployeePlaceholderViewModel newInstance(GetAuthStateUseCase getAuthStateUseCase,
      LogoutUseCase logoutUseCase) {
    return new EmployeePlaceholderViewModel(getAuthStateUseCase, logoutUseCase);
  }
}
