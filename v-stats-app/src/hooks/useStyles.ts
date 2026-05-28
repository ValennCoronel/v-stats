import { useThemeContext } from '../context/ThemeContext';
import { themeColors } from '../theme/colors';
import { baseStyles, RNStyle } from '../theme/baseStyles';

export function useStyles() {
  const { theme, toggleTheme } = useThemeContext();
  const colors = themeColors[theme];

  // Definimos clases dinámicas que mapean directamente a la paleta del tema actual
  const dynamicStyles: Record<string, RNStyle> = {
    'bg-main': { backgroundColor: colors.bgMain },
    'bg-surface': { backgroundColor: colors.bgSurface },
    'bg-primary': { backgroundColor: colors.primary },
    'border-theme': { borderColor: colors.border },
    'text-main': { color: colors.textMain },
    'text-muted': { color: colors.textMuted },
    'text-white': { color: '#ffffff' },
    'bg-brand': { backgroundColor: colors.brand },
    'text-brand': { color: colors.brand },
    'border-brand': { borderColor: colors.brand },
    'border-gray': { borderColor: colors.borderGray },
    'bg-header': { backgroundColor: colors.headerBg },
    'bg-screen': { backgroundColor: colors.screenBg },
    'text-slate': { color: colors.slate500 },
  };

  // Fusionamos los estilos estáticos y los dinámicos del tema
  const dictionary = { ...baseStyles, ...dynamicStyles };

  // Tagged Template Literal para procesar strings de clases separadas por espacios
  const styles = (strings: TemplateStringsArray, ...values: any[]): RNStyle[] => {
    const fullString = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
    
    return fullString
      .split(/\s+/)
      .filter(Boolean)
      .map(className => {
        const style = dictionary[className];
        if (!style && __DEV__) {
          console.warn(`[Styles] La clase '${className}' no existe en el diccionario.`);
        }
        return style;
      })
      .filter(Boolean) as RNStyle[];
  };

  return { styles, theme, toggleTheme, colors };
}