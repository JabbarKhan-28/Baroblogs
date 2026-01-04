import { Platform, useWindowDimensions } from 'react-native';

export function useIsMobile() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && width < 768;
  const isMobile = Platform.OS === 'android' || Platform.OS === 'ios' || isMobileWeb;

  return { isMobile, isMobileWeb, isWeb, width };
}
