// How much today's thread grew or shrank this frame from a card opening or folding (#344), on the UI thread. A card's
// Expandable adds its height change here as it animates; StylistScreen scrolls by the same amount when he's at the
// bottom, so the card's foot stays put and its top rises (one motion) instead of the card growing under the composer
// and the thread catching up a beat later (iOS won't scroll past content that hasn't grown yet).
import { makeMutable } from 'react-native-reanimated';

export const threadGrow = makeMutable(0);
