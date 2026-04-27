import { StyleSheet, Text, View } from 'react-native';

import { getAppConfig } from '@config/appConfig';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

export function HomeScreen() {
  const { appName, environment } = getAppConfig();

  return (
    <View style={styles.root} testID="home-screen-root">
      <Text style={styles.title} testID="home-screen-title">
        {appName}
      </Text>
      <Text style={styles.subtitle} testID="home-screen-subtitle">
        Single-root React Native boilerplate (TypeScript-first)
      </Text>
      <View style={styles.badge} testID="home-screen-environment-badge">
        <Text style={styles.badgeText} testID="home-screen-environment-text">
          Environment: {environment}
        </Text>
      </View>
      <Text
        style={styles.smokeMarker}
        testID="maestro-smoke-ready"
        accessibilityLabel="maestro-smoke-ready"
        accessible={true}
      >
        MAESTRO_SMOKE_READY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  smokeMarker: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});
