import React from 'react';
import {Text} from 'react-native';

type SymbolName =
  | 'home'
  | 'refresh-cw'
  | 'clock'
  | 'settings'
  | 'shield'
  | 'file-text'
  | 'image'
  | 'trash-2'
  | 'file';

const glyphs: Record<SymbolName, string> = {
  home: '\u2302',
  'refresh-cw': '\u21BB',
  clock: '\u25F7',
  settings: '\u2699',
  shield: '\u26E8',
  'file-text': '\u25A4',
  image: '\u25A7',
  'trash-2': '\u2715',
  file: '\u25A3',
};

interface Props {
  name: SymbolName;
  size?: number;
  color: string;
}

export function SymbolIcon({name, size = 18, color}: Props) {
  return (
    <Text
      style={{
        color,
        fontSize: size,
        lineHeight: size + 2,
        fontWeight: '700',
        textAlign: 'center',
        minWidth: size + 4,
      }}>
      {glyphs[name]}
    </Text>
  );
}
