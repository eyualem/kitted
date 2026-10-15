import { useLocalSearchParams } from 'expo-router';
import { PiecePage } from '@/features/closet/PiecePage';

// C2 · A piece's page (02 C2; #276): the drawing, then his photos of it with the piece outlined.
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PiecePage id={String(id ?? '')} />;
}
