# Foolproof Mobile Stack (Windows + VS Code → iOS & Android)

## TL;DR
| Item | Summary |
|---|---|
| **Default** | Expo (React Native) + TypeScript + EAS cloud build. Test with Expo Go on an iPhone and Android emulator. |
| **Alternative** | Flutter + Codemagic for cloud builds. Test with Flutter on Android emulator and an iPhone. |
| **Goal** | Build and test on Windows without owning a Mac, ship to both stores reliably. |

## Decision Matrix
This matrix compares four cross‑platform options. Cells use concise phrases rather than full sentences.

| Option | Windows fit | iOS w/o Mac | Performance | Ecosystem | Learning curve | Verdict |
|---|---|---|---|---|---|---|
| **Expo (React Native)** | Excellent | **Excellent** – EAS cloud builds eliminate mac requirements【401521479267332†L1018-L1029】 | High | Large & mature | Easy–Medium | **Default choice** |
| **Flutter** | Excellent | **Good** – Codemagic builds iOS apps on cloud but local iOS debugging still needs a Mac【927713866814617†L90-L102】 | Very high | Large, growing | Medium | **Alternate** |
| **.NET MAUI** | Good | Requires a Mac build host【835605381271486†L201-L203】 | Medium | Growing | Medium | Niche, not ideal |
| **Kotlin Multiplatform** | Good | Needs macOS with Xcode for iOS frameworks【210716219483559†L77-L80】 | High | Smaller | Hard | Advanced use only |

## Default Stack — Expo (React Native)

### Why Expo?
- **No Mac needed**: EAS cloud build handles iOS compilation so you can develop on Windows【401521479267332†L1018-L1029】.
- **Test easily**: Use the Expo Go app on your iPhone. Windows users must use a physical iOS device because the iOS simulator only runs on macOS【919667948581006†L103-L106】.
- **Hot reload**: Fast feedback via Expo Dev Server; works with Android emulator and real devices.

### Stack Definition
| Layer | Choice | Notes |
|---|---|---|
| **Language** | TypeScript | Use Node LTS; typed safety and great editor support. |
| **Framework** | Expo (managed workflow) | Switch to custom workflow only if you need native modules. |
| **Routing** | Expo Router | File‑system based routes; integrates well with Expo. |
| **State** | Zustand | Lightweight; choose Redux Toolkit only for complex state. |
| **UI** | NativeWind or Tamagui | Tailwind‑style styling; pick one and standardize. |
| **Data** | Supabase | Provides auth, database and storage; Firebase is an alternative. |
| **Testing** | Jest + React Native Testing Library; Detox for e2e | Detox works on physical iOS devices; limitations on managed Expo projects. |
| **Build & Release** | EAS Build & EAS Submit | Cloud builds for iOS and Android; OTA updates via EAS Update. |
| **Crash & Analytics** | Sentry + Expo crash reports | Instrument early; wrap errors. |
| **Push notifications** | Expo Notifications | Later migrate to FCM/APNs if needed. |

### 10‑Minute Quickstart (Expo)
Follow these steps on Windows after installing Node LTS, Git and Android Studio:

```bash
# 1. Create a new project
npx create-expo-app@latest myapp --template
cd myapp

# 2. Install TypeScript and tooling
npm i -D typescript @types/react @types/react-native eslint prettier husky lint-staged

# 3. Add routing and state management
npx expo install expo-router
npm i zustand nativewind

# 4. Add Expo modules
npx expo install expo-font expo-splash-screen expo-updates expo-notifications
npx expo install sentry-expo

# 5. Initialize EAS (for cloud builds)
npx eas init

# 6. Start development
npm run dev  # alias for 'expo start --tunnel'
# Scan the QR with Expo Go on your iPhone or run on Android emulator.
```

### EAS Build & Submit
Use EAS to create production‑ready binaries and submit to stores. Cloud builds avoid local Xcode or Android SDK issues.

Example `eas.json` profiles:

```json
{
  "cli": { "version": ">= 11.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "ios": { "simulator": false } },
    "preview":    { "distribution": "internal" },
    "production": { "autoIncrement": "version", "distribution": "store" }
  },
  "submit": {
    "production": { "ios": { "ascAppId": "<APP_STORE_CONNECT_APP_ID>" } }
  }
}
```

### GitHub Actions for Expo + EAS
Create `.github/workflows/eas-build.yml` to automate builds on tags. Use repository secrets for tokens and Apple credentials.

```yaml
name: Build & Deploy
on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
      - run: npm ci
      - run: npm run lint
      - run: npm test --if-present
      - run: npm install -g eas-cli
      - name: Authenticate with EAS
        run: |
          eas whoami || eas login --token ${{ secrets.EAS_TOKEN }}
      - name: Build iOS & Android
        run: |
          eas build --platform ios --profile production --non-interactive
          eas build --platform android --profile production --non-interactive
      - name: Submit to App Store
        run: |
          eas submit --platform ios --latest --apple-id ${{ secrets.APPLE_ID }} \
            --asc-api-key-id ${{ secrets.ASC_API_KEY_ID }} \
            --asc-api-key-issuer-id ${{ secrets.ASC_API_KEY_ISSUER_ID }} \
            --asc-api-key ${{ secrets.ASC_API_KEY }}
      - name: Submit to Google Play
        run: |
          eas submit --platform android --latest --key ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
```

### Device Testing
| Platform | Approach | Notes |
|---|---|---|
| **iOS** | Use Expo Go on a real iPhone. Scan the QR from `expo start --tunnel` to run your app. | The iOS simulator only runs on macOS; Windows users must test on physical devices【919667948581006†L103-L106】. |
| **Android** | Use the Android emulator from Android Studio or `expo run:android` to test native builds. | Set up an emulator with a recent API level. |

### OTA Updates & Crash Reporting
After release, use `eas update` to push JavaScript/asset updates. Crashes should be captured via `sentry-expo` and Expo's crash reporting, giving you stack traces tied to release versions.

### Costs & Accounts
| Service | Cost | Notes |
|---|---|---|
| **Apple Developer Program** | ~$99/year | Required to publish on the App Store. |
| **Google Play Console** | One‑time ~$25 fee | Needed to publish on Google Play. |
| **Expo Free Tier** | Includes 15 iOS cloud builds per month【401521479267332†L1018-L1033】 | Upgrade for more builds or faster queues. |
| **Sentry, Supabase, etc.** | Free tiers available | Costs scale with usage. |

### Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Need to add a native module (e.g. custom Bluetooth) | Use Expo Prebuild/Custom workflow, or eject to bare React Native if required. |
| Limited iOS testing on Windows | Acquire at least one iPhone for physical testing. Remote debugging on macOS is not possible without a Mac. |
| OTA policy changes from Apple/Google | Use OTA only for JS/asset changes; schedule full builds for native updates. |

## Alternative Stack — Flutter + Codemagic

### Why Flutter?
- **Performance**: Compiled ahead‑of‑time to native code; excellent for complex animations.
- **UI fidelity**: Same code renders identically across platforms.
- **Cloud builds**: Codemagic CI/CD lets you build and distribute iOS apps from Windows or Linux【927713866814617†L94-L102】.

### Limitations
- You still need a Mac to debug on the iOS simulator or run Xcode, even though Codemagic can build for you【927713866814617†L90-L102】.
- Larger binary size compared to React Native; slower over‑the‑air updates.

### Stack Definition (Flutter)
| Layer | Choice |
|---|---|
| **Language** | Dart |
| **UI** | Flutter (Material 3) |
| **State** | Riverpod or Bloc |
| **Testing** | `flutter_test` and `integration_test`; device labs via Firebase Test Lab or AWS Device Farm |
| **CI/CD** | Codemagic (YAML config); optionally GitHub Actions + Fastlane |
| **OTA** | Shorebird for AOT patches; note App Store restrictions |

### Example codemagic.yaml

```yaml
workflows:
  release:
    name: Flutter Release iOS & Android
    instance_type: mac_mini
    scripts:
      - flutter pub get
      - flutter build apk --release
      - flutter build ipa --release
    publishing:
      app_store_connect:
        api_key: $APP_STORE_CONNECT_KEY
      google_play:
        credentials: $GOOGLE_PLAY_JSON
```

### When to Choose Flutter
| Condition | Stack |
|---|---|
| Custom UI/animation heavy app | **Flutter** – performance and consistency are top priorities. |
| You need all native capabilities and plan to eventually maintain iOS code in Swift/Objective‑C | **Flutter** – easier to bridge with platform channels. |
| You prefer a JavaScript/TypeScript ecosystem and want OTA updates out of the box | **Expo** – simpler development cycle. |

## .NET MAUI & Kotlin Multiplatform (Brief)

| Framework | Key points |
|---|---|
| **.NET MAUI** | Allows C# developers to build cross‑platform apps. However, developing and building iOS apps on Windows requires a Mac build host【835605381271486†L201-L203】. For this reason, it’s less suitable when no Mac is available. |
| **Kotlin Multiplatform** | Shares business logic across platforms. Creating iOS applications requires a macOS host with Xcode to build frameworks【210716219483559†L77-L80】. Setup on Windows is possible for Android, but you must compile on macOS to produce iOS binaries. |

## Bootstrap Script (PowerShell)
Use this script to scaffold a new Expo app on Windows. Save it as `scripts/new-app.ps1` and run `./new-app.ps1 -Name MyApp`.

```powershell
param([string]$Name = "myapp")

npx create-expo-app@latest $Name --template
Set-Location $Name

# Add TypeScript and tooling
npm i -D typescript @types/react @types/react-native eslint prettier husky lint-staged

# Install Expo modules and libraries
npx expo install expo-router expo-font expo-splash-screen expo-updates expo-notifications
npm i zustand nativewind
npx expo install sentry-expo

# Initialize EAS
npx eas init

# Set up git
git init
git add .
git commit -m "chore: bootstrap $Name"
```

## Appendix

- **File tree**: Place `eas.json` at the root, `.github/workflows/eas-build.yml` under `.github/workflows/`, `codemagic.yaml` at the project root for Flutter projects, and store reusable scripts in `scripts/`.
- **Environment variables**: Use repository secrets for `EAS_TOKEN`, Apple and Google credentials. For Flutter/Codemagic, set `APP_STORE_CONNECT_KEY` and `GOOGLE_PLAY_JSON` in Codemagic’s settings.
- **Testing schedule**: Run unit tests on every commit; run end‑to‑end tests nightly on the Android emulator. For iOS, schedule manual smoke tests with each release candidate since there is no simulator on Windows.
