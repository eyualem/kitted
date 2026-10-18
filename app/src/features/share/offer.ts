// Where the card's Share button shows (#344): the switch is on, this build can make the image, and the check can be
// shared (a full check at 7.0+, or a re-check that went up; shareModel canShare).
import { SHARE_CARD_BUILT } from '@/config/features';
import type { FitCheckRow } from '@/data/types';
import { canShare } from './shareModel';
import { shareNativeReady } from './shareNative';

export function shareOffered(row: Pick<FitCheckRow, 'status' | 'score' | 'isPartial' | 'parentId' | 'details'>): boolean {
  return SHARE_CARD_BUILT && canShare(row) && shareNativeReady();
}
