package com.jedumformatforge

import android.app.Application
import com.facebook.react.ReactHost
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here.
            }

        override fun getJSMainModuleName(): String = "index"
      }

  override val reactHost: ReactHost
    get() =
        DefaultReactHost.getDefaultReactHost(
            context = applicationContext,
            packageList = PackageList(this).packages,
            jsMainModulePath = "index",
            jsBundleAssetPath = "index.android.bundle",
            useDevSupport = BuildConfig.DEBUG,
        )

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}

