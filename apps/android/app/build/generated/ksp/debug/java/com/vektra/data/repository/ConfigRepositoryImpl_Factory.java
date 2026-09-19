package com.vektra.data.repository;

import com.vektra.core.storage.DataStoreManager;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
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
public final class ConfigRepositoryImpl_Factory implements Factory<ConfigRepositoryImpl> {
  private final Provider<DataStoreManager> dataStoreManagerProvider;

  public ConfigRepositoryImpl_Factory(Provider<DataStoreManager> dataStoreManagerProvider) {
    this.dataStoreManagerProvider = dataStoreManagerProvider;
  }

  @Override
  public ConfigRepositoryImpl get() {
    return newInstance(dataStoreManagerProvider.get());
  }

  public static ConfigRepositoryImpl_Factory create(
      Provider<DataStoreManager> dataStoreManagerProvider) {
    return new ConfigRepositoryImpl_Factory(dataStoreManagerProvider);
  }

  public static ConfigRepositoryImpl newInstance(DataStoreManager dataStoreManager) {
    return new ConfigRepositoryImpl(dataStoreManager);
  }
}
