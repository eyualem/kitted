// Web preview: no action sheet; the call link (layout checks only).
import { Linking } from 'react-native';

export function chooseSupport(): void {
  void Linking.openURL('tel:988');
}
