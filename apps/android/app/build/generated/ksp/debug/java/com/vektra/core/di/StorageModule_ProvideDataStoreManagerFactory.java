package com.vektra.core.di;

import android.content.Context;
import com.vektra.core.storage.DataStoreManager;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class StorageModule_ProvideDataStoreManagerFactory implements Factory<DataStoreManager> {
  private final Provider<Context> contextProvider;

  public StorageModule_ProvideDataStoreManagerFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public DataStoreManager get() {
    return provideDataStoreManager(contextProvider.get());
  }

  public static StorageModule_ProvideDataStoreManagerFactory create(
      Provider<Context> contextProvider) {
    return new StorageModule_ProvideDataStoreManagerFactory(contextProvider);
  }

  public static DataStoreManager provideDataStoreManager(Context context) {
    return Preconditions.checkNotNullFromProvides(StorageModule.INSTANCE.provideDataStoreManager(context));
  }
}
