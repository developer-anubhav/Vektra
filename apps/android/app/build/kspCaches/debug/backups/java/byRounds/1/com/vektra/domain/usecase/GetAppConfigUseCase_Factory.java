package com.vektra.domain.usecase;

import com.vektra.domain.repository.ConfigRepository;
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
public final class GetAppConfigUseCase_Factory implements Factory<GetAppConfigUseCase> {
  private final Provider<ConfigRepository> configRepositoryProvider;

  public GetAppConfigUseCase_Factory(Provider<ConfigRepository> configRepositoryProvider) {
    this.configRepositoryProvider = configRepositoryProvider;
  }

  @Override
  public GetAppConfigUseCase get() {
    return newInstance(configRepositoryProvider.get());
  }

  public static GetAppConfigUseCase_Factory create(
      Provider<ConfigRepository> configRepositoryProvider) {
    return new GetAppConfigUseCase_Factory(configRepositoryProvider);
  }

  public static GetAppConfigUseCase newInstance(ConfigRepository configRepository) {
    return new GetAppConfigUseCase(configRepository);
  }
}
