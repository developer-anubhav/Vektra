package com.vektra.core.network;

import com.vektra.core.security.TokenManager;
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
public final class AuthInterceptor_Factory implements Factory<AuthInterceptor> {
  private final Provider<TokenManager> tokenManagerProvider;

  public AuthInterceptor_Factory(Provider<TokenManager> tokenManagerProvider) {
    this.tokenManagerProvider = tokenManagerProvider;
  }

  @Override
  public AuthInterceptor get() {
    return newInstance(tokenManagerProvider.get());
  }

  public static AuthInterceptor_Factory create(Provider<TokenManager> tokenManagerProvider) {
    return new AuthInterceptor_Factory(tokenManagerProvider);
  }

  public static AuthInterceptor newInstance(TokenManager tokenManager) {
    return new AuthInterceptor(tokenManager);
  }
}
