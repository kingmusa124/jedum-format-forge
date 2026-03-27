import React, {useCallback, useEffect, useState} from 'react';
import {Alert, BackHandler, Pressable, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useFocusEffect} from '@react-navigation/native';
import {TabParamList} from '@app/navigation/types';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {ValueStepper} from '@app/components/ValueStepper';
import {BrandMark} from '@app/components/BrandMark';
import {SymbolIcon} from '@app/components/SymbolIcon';
import {AdMobBannerCard} from '@app/components/AdMobBannerCard';
import {useAppDispatch, useAppSelector} from '@app/store/hooks';
import {setCompression, setOutputFolder, setQuality} from '@app/store/slices/conversionSlice';
import {
  resetSettings,
  setAdmobAndroidAppId,
  setAdmobIosAppId,
  setAdsEnabled,
  setBackendApiKey,
  setBackendUrl,
  setDefaultCompression,
  setDefaultOutputFolder,
  setDefaultQuality,
  setThemeMode,
} from '@app/store/slices/settingsSlice';
import {clearHistory} from '@app/store/slices/historySlice';
import {getStorageSummary, saveHistory, saveSettings} from '@app/services/storageService';
import {checkServerHealth} from '@app/services/serverConversionService';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = BottomTabScreenProps<TabParamList, 'Settings'>;
type SettingsPanel = 'main' | 'appearance' | 'conversion' | 'storage' | 'cloud' | 'ads' | 'maintenance';

export function SettingsScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const {theme} = useAppTheme();
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>('main');
  const [storage, setStorage] = useState<{freeSpace: number; totalSpace: number} | null>(null);

  useEffect(() => {
    getStorageSummary().then(setStorage).catch(() => null);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (activePanel !== 'main') {
        setActivePanel('main');
      }
    });

    return unsubscribe;
  }, [activePanel, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (activePanel !== 'main') {
          setActivePanel('main');
          return true;
        }

        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [activePanel]),
  );

  const persistSettings = (nextSettings: typeof settings) => {
    saveSettings(nextSettings).catch(() => null);
  };

  const renderPanelHeader = (title: string) => (
    <View style={styles.panelHeader}>
      <Text style={[styles.panelTitle, {color: theme.colors.text}]}>{title}</Text>
    </View>
  );

  const renderMain = () => (
    <>
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, {color: theme.colors.text}]}>Settings</Text>
        <BrandMark size={52} />
      </View>

      <View style={styles.sectionList}>
        <SettingsTile title="Appearance" subtitle="Theme and visual tone" icon="settings" onPress={() => setActivePanel('appearance')} />
        <SettingsTile title="Conversion defaults" subtitle="Quality, layout, and export defaults" icon="refresh-cw" onPress={() => setActivePanel('conversion')} />
        <SettingsTile title="Storage" subtitle="Output folder and device space" icon="file" onPress={() => setActivePanel('storage')} />
        <SettingsTile title="Cloud & security" subtitle="Backend connection and safety checks" icon="shield" onPress={() => setActivePanel('cloud')} />
        <SettingsTile title="Ads & consent" subtitle="AdMob prep and privacy readiness" icon="clock" onPress={() => setActivePanel('ads')} />
        <SettingsTile title="Maintenance" subtitle="History and reset tools" icon="trash-2" onPress={() => setActivePanel('maintenance')} />
      </View>
    </>
  );

  const renderAppearance = () => (
    <>
      {renderPanelHeader('Appearance')}
      <SectionCard title="Theme mode">
        <View style={styles.segmentRow}>
          {(['light', 'dark', 'system'] as const).map(mode => {
            const active = mode === settings.themeMode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  dispatch(setThemeMode(mode));
                  persistSettings({...settings, themeMode: mode});
                }}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                <Text style={{color: active ? '#FFFFFF' : theme.colors.text, fontWeight: '800'}}>
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>
    </>
  );

  const renderConversion = () => (
    <>
      {renderPanelHeader('Conversion defaults')}
      <SectionCard title="Image & PDF profile" subtitle="These defaults drive the app so the Convert screen stays lighter.">
        <View style={styles.stack}>
          <ValueStepper
            label="Default quality"
            value={settings.defaultQuality}
            minimumValue={40}
            maximumValue={100}
            suffix="%"
            onChange={next => {
              dispatch(setDefaultQuality(next));
              dispatch(setQuality(next));
              persistSettings({...settings, defaultQuality: next});
            }}
          />
          <ValueStepper
            label="Default compression"
            value={settings.defaultCompression}
            minimumValue={30}
            maximumValue={100}
            suffix="%"
            onChange={next => {
              dispatch(setDefaultCompression(next));
              dispatch(setCompression(next));
              persistSettings({...settings, defaultCompression: next});
            }}
          />
          <View style={[styles.infoCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <Text style={[styles.infoTitle, {color: theme.colors.text}]}>PDF image layout</Text>
            <Text style={[styles.infoBody, {color: theme.colors.textMuted}]}>
              Images are fitted proportionally on A4 pages with margins to keep them clearer and more polished.
            </Text>
          </View>
        </View>
      </SectionCard>
    </>
  );

  const renderStorage = () => (
    <>
      {renderPanelHeader('Storage')}
      <SectionCard title="Output folder">
        <View style={styles.stack}>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>Default output folder</Text>
            <TextInput
              value={settings.defaultOutputFolder}
              onChangeText={text => {
                dispatch(setDefaultOutputFolder(text));
                dispatch(setOutputFolder(text));
                persistSettings({...settings, defaultOutputFolder: text});
              }}
              placeholder="Downloads/JedumFormatForge"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
          <View style={[styles.infoCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <Text style={[styles.infoTitle, {color: theme.colors.text}]}>Device storage</Text>
            <Text style={[styles.infoBody, {color: theme.colors.textMuted}]}>
              {storage
                ? `Free space: ${formatStorage(storage.freeSpace)}\nTotal space: ${formatStorage(storage.totalSpace)}`
                : 'Storage details are currently unavailable.'}
            </Text>
          </View>
        </View>
      </SectionCard>
    </>
  );

  const renderCloud = () => (
    <>
      {renderPanelHeader('Cloud & security')}
      <SectionCard title="Backend connection">
        <View style={styles.stack}>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>Backend convert URL</Text>
            <TextInput
              value={settings.backendUrl}
              onChangeText={text => {
                dispatch(setBackendUrl(text));
                persistSettings({...settings, backendUrl: text});
              }}
              placeholder="https://your-domain.example.com/api/convert"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>Backend API key</Text>
            <TextInput
              value={settings.backendApiKey}
              onChangeText={text => {
                dispatch(setBackendApiKey(text));
                persistSettings({...settings, backendApiKey: text});
              }}
              placeholder="x-api-key"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
          <PrimaryButton
            label={checkingHealth ? 'Checking backend...' : 'Test backend connection'}
            onPress={async () => {
              try {
                setCheckingHealth(true);
                await checkServerHealth(settings.backendUrl, settings.backendApiKey);
                Alert.alert('Backend reachable', 'The app can reach your conversion backend.');
              } catch (error) {
                Alert.alert(
                  'Backend check failed',
                  error instanceof Error ? error.message : 'Unable to reach the backend.',
                );
              } finally {
                setCheckingHealth(false);
              }
            }}
            disabled={checkingHealth}
            secondary
          />
          <View style={[styles.infoCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <Text style={[styles.infoTitle, {color: theme.colors.text}]}>Production checklist</Text>
            <Text style={[styles.infoBody, {color: theme.colors.textMuted}]}>
              HTTPS only, request auth, upload limits, file validation, cleanup, logging, and a privacy policy.
            </Text>
          </View>
        </View>
      </SectionCard>
    </>
  );

  const renderAds = () => (
    <>
      {renderPanelHeader('Ads & consent')}
      <SectionCard title="AdMob setup">
        <View style={styles.stack}>
          <View style={[styles.toggleCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <View style={{flex: 1}}>
              <Text style={[styles.label, {color: theme.colors.text}]}>Enable ads in app builds</Text>
              <Text style={[styles.toggleHint, {color: theme.colors.textMuted}]}>Keep this off until test ads, consent, and policy work are ready.</Text>
            </View>
            <Switch
              value={settings.adsEnabled}
              onValueChange={value => {
                dispatch(setAdsEnabled(value));
                persistSettings({...settings, adsEnabled: value});
              }}
              trackColor={{true: theme.colors.primary, false: theme.colors.border}}
              thumbColor="#FFFFFF"
            />
          </View>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>Android AdMob app ID</Text>
            <TextInput
              value={settings.admobAndroidAppId}
              onChangeText={text => {
                dispatch(setAdmobAndroidAppId(text));
                persistSettings({...settings, admobAndroidAppId: text});
              }}
              placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~android"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>iOS AdMob app ID</Text>
            <TextInput
              value={settings.admobIosAppId}
              onChangeText={text => {
                dispatch(setAdmobIosAppId(text));
                persistSettings({...settings, admobIosAppId: text});
              }}
              placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~ios"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
          <View style={[styles.infoCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <Text style={[styles.infoTitle, {color: theme.colors.text}]}>Consent & privacy</Text>
            <Text style={[styles.infoBody, {color: theme.colors.textMuted}]}>
              Before production ads, add a consent flow, privacy policy, and app-ads.txt. This section is where that setup belongs.
            </Text>
          </View>
          <AdMobBannerCard enabled={settings.adsEnabled} />
        </View>
      </SectionCard>
    </>
  );

  const renderMaintenance = () => (
    <>
      {renderPanelHeader('Maintenance')}
      <SectionCard title="Maintenance tools">
        <View style={styles.stack}>
          <PrimaryButton
            label="Clear history"
            onPress={() => {
              dispatch(clearHistory());
              saveHistory([]).catch(() => null);
            }}
            secondary
          />
          <PrimaryButton
            label="Reset settings"
            onPress={() => {
              dispatch(resetSettings());
              dispatch(setQuality(90));
              dispatch(setCompression(85));
              dispatch(setOutputFolder('Downloads/JedumFormatForge'));
              saveSettings({
                themeMode: 'system',
                defaultQuality: 90,
                defaultCompression: 85,
                defaultOutputFolder: 'Downloads/JedumFormatForge',
                backendUrl: 'http://127.0.0.1:4000/api/convert',
                backendApiKey: '',
                adsEnabled: false,
                admobAndroidAppId: '',
                admobIosAppId: '',
                keepHistory: true,
              }).catch(() => null);
            }}
            secondary
          />
        </View>
      </SectionCard>
    </>
  );

  return (
    <Screen>
      {activePanel === 'main' ? renderMain() : null}
      {activePanel === 'appearance' ? renderAppearance() : null}
      {activePanel === 'conversion' ? renderConversion() : null}
      {activePanel === 'storage' ? renderStorage() : null}
      {activePanel === 'cloud' ? renderCloud() : null}
      {activePanel === 'ads' ? renderAds() : null}
      {activePanel === 'maintenance' ? renderMaintenance() : null}
    </Screen>
  );
}

function SettingsTile({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: 'settings' | 'refresh-cw' | 'file' | 'shield' | 'clock' | 'trash-2';
  onPress: () => void;
}) {
  const {theme} = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}>
      <View style={[styles.tileIcon, {backgroundColor: theme.colors.surface}]}>
        <SymbolIcon name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.tileTitle, {color: theme.colors.text}]}>{title}</Text>
        <Text style={[styles.tileSubtitle, {color: theme.colors.textMuted}]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function formatStorage(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const styles = StyleSheet.create({
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  panelHeader: {
    paddingHorizontal: 4,
    marginBottom: -2,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionList: {
    gap: 12,
  },
  tile: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 4,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tileSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 94,
    alignItems: 'center',
  },
  stack: {
    gap: 14,
  },
  label: {
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  infoTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  toggleCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
