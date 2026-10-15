import { useLocalSearchParams } from 'expo-router';
import { LookPage } from '@/features/lookbook/LookPageScreen';

// L2 · A look's page (02 L2; #280), pushed from a Lookbook row: the photo, the score as stored, its fixes and pieces.
export default function LookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LookPage id={String(id ?? '')} />;
}
