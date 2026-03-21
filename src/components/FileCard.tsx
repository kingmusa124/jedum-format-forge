import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {PickedFile} from '@app/types/files';
import {SymbolIcon} from '@app/components/SymbolIcon';
import {useAppTheme} from '@app/theme/ThemeProvider';
import {formatBytes, formatDate} from '@app/utils/formatters';

interface Props {
  file: PickedFile;
  onRemove?: (id: string) => void;
}

export function FileCard({file, onRemove}: Props) {
  const {theme} = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}>
      <View style={styles.thumbWrap}>
        {file.thumbnailUri ? (
          <FastImage source={{uri: file.thumbnailUri}} style={styles.thumb} resizeMode={FastImage.resizeMode.cover} />
        ) : (
          <View style={[styles.thumb, styles.placeholder, {backgroundColor: theme.colors.primary}]}>
            <SymbolIcon
              name={file.extension === 'pdf' ? 'file-text' : 'image'}
              color="#FFFFFF"
              size={18}
            />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, {color: theme.colors.text}]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          {formatBytes(file.size)} • {file.extension.toUpperCase()}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          {formatDate(file.modifiedAt)}
        </Text>
      </View>
      {onRemove ? (
        <Pressable onPress={() => onRemove(file.id)} hitSlop={10}>
          <SymbolIcon name="trash-2" size={18} color={theme.colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
  },
  thumbWrap: {
    width: 56,
    height: 56,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
  },
});
