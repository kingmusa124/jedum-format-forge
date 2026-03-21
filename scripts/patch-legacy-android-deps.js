const fs = require('fs');
const path = require('path');

function patchFile(target, transform, label) {
  if (!fs.existsSync(target)) {
    return;
  }

  const original = fs.readFileSync(target, 'utf8');
  const updated = transform(original);

  if (updated !== original) {
    fs.writeFileSync(target, updated, 'utf8');
    console.log(`Patched ${label}`);
  }
}

function ensureFile(target, content, label) {
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true });

  const original = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (original !== content) {
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Patched ${label}`);
  }
}

function ensureTurboModuleCodegenStub(packageName, specName) {
  const jniDir = path.join(
    __dirname,
    '..',
    'node_modules',
    packageName,
    'android',
    'build',
    'generated',
    'source',
    'codegen',
    'jni',
  );

  ensureFile(
    path.join(jniDir, 'CMakeLists.txt'),
    `cmake_minimum_required(VERSION 3.13)
project(react_codegen_${specName})
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(
  react_codegen_${specName}
  SHARED
  ${specName}-generated.cpp
)

target_include_directories(react_codegen_${specName} PUBLIC .)

target_link_libraries(
  react_codegen_${specName}
  fbjni
  jsi
  reactnative
)
`,
    `${packageName} codegen CMakeLists.txt`,
  );

  ensureFile(
    path.join(jniDir, `${specName}.h`),
    `#pragma once

#include <memory>
#include <string>

#include <ReactCommon/JavaTurboModule.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> ${specName}_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace react
} // namespace facebook
`,
    `${packageName} codegen header`,
  );

  ensureFile(
    path.join(jniDir, `${specName}-generated.cpp`),
    `#include "${specName}.h"

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> ${specName}_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  (void)moduleName;
  (void)params;
  return nullptr;
}

} // namespace react
} // namespace facebook
`,
    `${packageName} codegen source`,
  );
}

patchFile(
  path.join(__dirname, '..', 'node_modules', 'react-native-pdf-lib', 'android', 'build.gradle'),
  content =>
    content
      .replace(
        /buildscript\s*\{[\s\S]*?\}\s*\n\s*apply plugin: 'com\.android\.library'/m,
        "apply plugin: 'com.android.library'",
      )
      .replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 36')
      .replace(/buildToolsVersion\s+['"][^'"]+['"]\s*\n/g, '')
      .replace(/minSdkVersion\s+\d+/g, 'minSdkVersion 24')
      .replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 36')
      .replace(/com\.tom[_-]roush:pdfbox-android:[^'"]+/g, 'com.tom-roush:pdfbox-android:2.0.27.0')
      .replace(/\n\s*dexOptions\s*\{[\s\S]*?\n\s*\}\n/m, '\n'),
  'react-native-pdf-lib Android build.gradle',
);

patchFile(
  path.join(__dirname, '..', 'node_modules', 'rn-fetch-blob', 'android', 'build.gradle'),
  content =>
    content
      .replace(/^\s*jcenter\(\)\s*$/gm, '')
      .replace(/buildscript\s*\{[\s\S]*?\}\s*\n\s*android\s*\{/m, 'android {')
      .replace(/buildToolsVersion\s+safeExtGet\([^\n]+\)\s*\n/g, '')
      .replace(/safeExtGet\('compileSdkVersion',\s*\d+\)/g, "safeExtGet('compileSdkVersion', 36)")
      .replace(/safeExtGet\('minSdkVersion',\s*\d+\)/g, "safeExtGet('minSdkVersion', 24)")
      .replace(/safeExtGet\('targetSdkVersion',\s*\d+\)/g, "safeExtGet('targetSdkVersion', 36)")
      .replace(/\n{3,}/g, '\n\n'),
  'rn-fetch-blob Android build.gradle',
);

patchFile(
  path.join(__dirname, '..', 'node_modules', 'rn-fetch-blob', 'react-native.config.js'),
  () =>
    `module.exports = {
  dependency: {
    platforms: {
      android: {},
      ios: {},
    },
  },
};
`,
  'rn-fetch-blob react-native.config.js',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-document-picker',
    'android',
    'src',
    'main',
    'java',
    'com',
    'reactnativedocumentpicker',
    'RNDocumentPickerModule.java',
  ),
  content =>
    content
      .replace('import android.net.Uri;\n', 'import android.net.Uri;\nimport android.os.AsyncTask;\n')
      .replace('import androidx.annotation.NonNull;\n', 'import androidx.annotation.NonNull;\nimport androidx.annotation.Nullable;\n')
      .replace("import com.facebook.react.bridge.GuardedResultAsyncTask;\n", '')
      .replace('extends GuardedResultAsyncTask<ReadableArray>', 'extends AsyncTask<Void, Void, ReadableArray>')
      .replace('      super(reactContext.getExceptionHandler());\n', '')
      .replace('    protected ReadableArray doInBackgroundGuarded() {', '    protected ReadableArray doInBackground(Void... voids) {')
      .replace('    protected void onPostExecuteGuarded(ReadableArray readableArray) {', '    protected void onPostExecute(@Nullable ReadableArray readableArray) {'),
  'react-native-document-picker RNDocumentPickerModule.java',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-pdf-lib',
    'android',
    'src',
    'main',
    'java',
    'com',
    'hopding',
    'pdflib',
    'PDFLibModule.java',
  ),
  content =>
    content
      .replace("import android.support.v4.content.FileProvider;\n", '')
      .replace("import com.tom_roush.pdfbox.util.PDFBoxResourceLoader;\n", '')
      .replace("    PDFBoxResourceLoader.init(reactContext);\n", ''),
  'react-native-pdf-lib PDFLibModule.java',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-pdf-lib',
    'android',
    'src',
    'main',
    'java',
    'com',
    'hopding',
    'pdflib',
    'factories',
    'PDPageFactory.java',
  ),
  content => content.replace("import android.support.annotation.RequiresPermission;\n", ''),
  'react-native-pdf-lib PDPageFactory.java',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-pdf-thumbnail',
    'android',
    'src',
    'main',
    'java',
    'org',
    'songsterq',
    'pdfthumbnail',
    'PdfThumbnailModule.kt',
  ),
  content =>
    content.replace(
      '    val bitmapWhiteBG = Bitmap.createBitmap(bitmap.width, bitmap.height, bitmap.config)\n',
      '    val bitmapWhiteBG = Bitmap.createBitmap(bitmap.width, bitmap.height, bitmap.config ?: Bitmap.Config.ARGB_8888)\n',
    ),
  'react-native-pdf-thumbnail PdfThumbnailModule.kt',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-screens',
    'android',
    'src',
    'main',
    'java',
    'com',
    'swmansion',
    'rnscreens',
    'ScreenContainer.kt',
  ),
  content =>
    content
      .replace('import android.content.ContextWrapper\n', 'import android.content.ContextWrapper\nimport android.view.Choreographer\n')
      .replace(/import android\.view\.Choreographer\nimport android\.view\.Choreographer\n/g, 'import android.view.Choreographer\n')
      .replace('import com.facebook.react.modules.core.ChoreographerCompat\n', '')
      .replace('    private val layoutCallback: ChoreographerCompat.FrameCallback =\n', '    private val layoutCallback: Choreographer.FrameCallback =\n')
      .replace('        object : ChoreographerCompat.FrameCallback() {\n', '        object : Choreographer.FrameCallback {\n'),
  'react-native-screens ScreenContainer.kt',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-screens',
    'common',
    'cpp',
    'react',
    'renderer',
    'components',
    'rnscreens',
    'RNSScreenShadowNode.h',
  ),
  content =>
    content.replace(
      '  void appendChild(const ShadowNode::Shared &child) override;\n',
      '  void appendChild(const std::shared_ptr<const ShadowNode> &child) override;\n',
    ),
  'react-native-screens RNSScreenShadowNode.h',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-screens',
    'common',
    'cpp',
    'react',
    'renderer',
    'components',
    'rnscreens',
    'RNSScreenShadowNode.cpp',
  ),
  content =>
    content
      .replace(
        'std::optional<std::reference_wrapper<const ShadowNode::Shared>>\n',
        'std::optional<std::reference_wrapper<const std::shared_ptr<const ShadowNode>>>\n',
      )
      .replace(
        '  for (const ShadowNode::Shared &child : screenShadowNode.getChildren()) {\n',
        '  for (const std::shared_ptr<const ShadowNode> &child :\n       screenShadowNode.getChildren()) {\n',
      )
      .replace(
        'void RNSScreenShadowNode::appendChild(const ShadowNode::Shared &child) {\n',
        'void RNSScreenShadowNode::appendChild(\n    const std::shared_ptr<const ShadowNode> &child) {\n',
      ),
  'react-native-screens RNSScreenShadowNode.cpp',
);

patchFile(
  path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native-community',
    'slider',
    'common',
    'cpp',
    'react',
    'renderer',
    'components',
    'RNCSlider',
    'RNCSliderMeasurementsManager.h',
  ),
  content =>
    content
      .replace(
        '                const ContextContainer::Shared &contextContainer)\n',
        '                const std::shared_ptr<const ContextContainer> &contextContainer)\n',
      )
      .replace(
        '        const ContextContainer::Shared contextContainer_;\n',
        '        const std::shared_ptr<const ContextContainer> contextContainer_;\n',
      ),
  '@react-native-community/slider RNCSliderMeasurementsManager.h',
);

patchFile(
  path.join(__dirname, '..', 'node_modules', 'react-native-webp-converter', 'package.json'),
  content =>
    content
      .replace(
        /,\s*"outputDir":\s*\{\s*"ios":\s*"ios\/generated",\s*"android":\s*"android\/generated"\s*\}/m,
        '',
      )
      .replace(/"includesGeneratedCode":\s*true/g, '"includesGeneratedCode": false'),
  'react-native-webp-converter package.json',
);

patchFile(
  path.join(__dirname, '..', 'node_modules', 'react-native-webp-converter', 'android', 'build.gradle'),
  content =>
    content
      .replace(
        /if \(isNewArchitectureEnabled\(\)\) \{\s*apply plugin: "com\.facebook\.react"\s*\}/m,
        `if (isNewArchitectureEnabled()) {
  apply plugin: "com.facebook.react"

  def bundledCodegenJavaDir = file("generated/java")
  def bundledCodegenJniDir = file("generated/jni")
  def generatedCodegenJavaDir = file("$buildDir/generated/source/codegen/java")
  def generatedCodegenJniDir = file("$buildDir/generated/source/codegen/jni")

  if (!generatedCodegenJavaDir.exists() && bundledCodegenJavaDir.exists()) {
    copy {
      from bundledCodegenJavaDir
      into generatedCodegenJavaDir
    }
  }

  if (!generatedCodegenJniDir.exists() && bundledCodegenJniDir.exists()) {
    copy {
      from bundledCodegenJniDir
      into generatedCodegenJniDir
    }
  }
}`,
      )
      .replace(
        /if \(isNewArchitectureEnabled\(\)\) \{\s*java\.srcDirs \+= \[\s*"src\/newarch",\s*\/\/ Codegen specs\s*"generated\/java",\s*"generated\/jni"\s*\]\s*\} else \{/m,
        'if (isNewArchitectureEnabled()) {\n        java.srcDirs += ["src/newarch", "$buildDir/generated/source/codegen/java"]\n      } else {',
      )
      .replace(
        /if \(isNewArchitectureEnabled\(\)\) \{\s*java\.srcDirs \+= \["src\/newarch"\]\s*\} else \{/m,
        'if (isNewArchitectureEnabled()) {\n        java.srcDirs += ["src/newarch", "$buildDir/generated/source/codegen/java"]\n      } else {',
      ),
  'react-native-webp-converter android build.gradle',
);

ensureTurboModuleCodegenStub('react-native-file-access', 'RNFileAccessSpec');
ensureTurboModuleCodegenStub('react-native-pdf-to-image', 'PdfToImage');
ensureTurboModuleCodegenStub('react-native-webp-converter', 'RNWebpConverterSpec');
