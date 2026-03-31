import { describe, it, expect } from 'vitest';
import { C, DARK, LIGHT, applyTheme, inp, btn, tag, isLightColor, perfIcon, perfIconColor, numUnit } from '../theme.js';

describe('isLightColor()', () => {
  it('detects white as light', () => {
    expect(isLightColor('#FFFFFF')).toBe(true);
  });

  it('detects black as dark', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('detects yellow as light', () => {
    expect(isLightColor('#FFFF00')).toBe(true);
  });

  it('detects dark blue as dark', () => {
    expect(isLightColor('#000080')).toBe(false);
  });

  it('handles missing hash', () => {
    expect(isLightColor('FFFFFF')).toBe(true);
  });

  it('returns false for invalid/short hex', () => {
    expect(isLightColor('#FFF')).toBe(false);
    expect(isLightColor('')).toBe(false);
    expect(isLightColor(null)).toBe(false);
  });
});

describe('applyTheme()', () => {
  it('sets dark theme', () => {
    applyTheme(true);
    expect(C.bg).toBe(DARK.bg);
    expect(C.text).toBe(DARK.text);
  });

  it('sets light theme', () => {
    applyTheme(false);
    expect(C.bg).toBe(LIGHT.bg);
    expect(C.text).toBe(LIGHT.text);
  });

  it('updates all color properties', () => {
    applyTheme(true);
    const darkKeys = Object.keys(DARK);
    darkKeys.forEach(key => {
      expect(C[key]).toBe(DARK[key]);
    });
  });
});

describe('btn()', () => {
  it('uses dark text on light background', () => {
    const style = btn('#FFFFFF');
    expect(style.color).toBe('#1a1a1a');
  });

  it('uses white text on dark background', () => {
    const style = btn('#000000');
    expect(style.color).toBe('#fff');
  });

  it('merges extra styles', () => {
    const style = btn('#000', { width: '100%', fontSize: 16 });
    expect(style.width).toBe('100%');
    expect(style.fontSize).toBe(16);
  });

  it('has required base properties', () => {
    const style = btn('#333');
    expect(style).toHaveProperty('background');
    expect(style).toHaveProperty('border');
    expect(style).toHaveProperty('borderRadius');
    expect(style).toHaveProperty('cursor', 'pointer');
  });
});

describe('inp()', () => {
  it('has required base properties', () => {
    const style = inp();
    expect(style).toHaveProperty('background');
    expect(style).toHaveProperty('border');
    expect(style).toHaveProperty('borderRadius');
    expect(style).toHaveProperty('color');
    expect(style.width).toBe('100%');
  });

  it('merges extra styles', () => {
    const style = inp({ flex: 1, textAlign: 'center' });
    expect(style.flex).toBe(1);
    expect(style.textAlign).toBe('center');
  });
});

describe('tag()', () => {
  it('uses color for text and semi-transparent background', () => {
    const style = tag('#FF0000');
    expect(style.color).toBe('#FF0000');
    expect(style.background).toBe('#FF000020');
  });
});

describe('perfIcon()', () => {
  it('returns correct icons for thresholds', () => {
    expect(perfIcon(85)).toBe('✓');
    expect(perfIcon(60)).toBe('⚠');
    expect(perfIcon(59)).toBe('✗');
  });
});

describe('perfIconColor()', () => {
  it('returns correct colors for thresholds', () => {
    expect(perfIconColor(85)).toBe('#22C55E');
    expect(perfIconColor(60)).toBe('#EAB308');
    expect(perfIconColor(59)).toBe('#EF4444');
  });
});

describe('numUnit()', () => {
  it('returns tuple of value and unit', () => {
    expect(numUnit(5, 'km')).toEqual([5, 'km']);
  });
});

describe('DARK and LIGHT themes', () => {
  it('have the same keys', () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
  });

  it('have all required color keys', () => {
    const required = ['bg', 'surface', 'card', 'text', 'text2', 'text3', 'blue', 'purple', 'green', 'yellow', 'red'];
    required.forEach(key => {
      expect(DARK).toHaveProperty(key);
      expect(LIGHT).toHaveProperty(key);
    });
  });

  it('all values are valid hex colors', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(DARK).forEach(v => expect(v).toMatch(hexRegex));
    Object.values(LIGHT).forEach(v => expect(v).toMatch(hexRegex));
  });
});
