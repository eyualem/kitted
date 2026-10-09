import { useLocalSearchParams } from 'expo-router';
import { PastDayScreen } from '@/features/stylist/PastChats';

// One earlier day of the Stylist thread (founder, Oct 9).
export default function PastDay() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <PastDayScreen dayKey={key ?? ''} />;
}
