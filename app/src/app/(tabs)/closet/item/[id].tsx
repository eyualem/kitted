import { useLocalSearchParams } from 'expo-router';
import { PiecePage } from '@/features/closet/PiecePage';

// C2 · A piece's page (02 C2; #276): the drawing, then his photos of it with the piece outlined.
export default function ItemDetailScreen() {
  // `mergedFrom`: this page got here by folding that piece into this one (#280), so a merge's Undo can move it back.
  const { id, mergedFrom } = useLocalSearchParams<{ id: string; mergedFrom?: string }>();
  return <PiecePage id={String(id ?? '')} mergedFrom={typeof mergedFrom === 'string' && mergedFrom ? mergedFrom : null} />;
}
