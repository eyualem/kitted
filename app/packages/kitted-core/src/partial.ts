// Partial checks (spec 04 §8.1; port of kitted_logic partial_label / merge_shoe_snap / merge_bottom_snap /
// pick_shoes_from_closet). What isn't in the photo never costs points; these helpers fill the missing part.

import { idx } from "./names";
import type { ClosetItem, NotRated, Reading, Scene } from "./types";
import { clone, isNone } from "./util";

export function partialLabel(notRated: readonly (NotRated | string)[] | null | undefined): string | null {
  const nr = notRated ?? [];
  if (nr.includes("bottom half")) return "Partial check: top only";
  if (nr.includes("shoes")) return "Partial check: shoes not included";
  if (nr.includes("shoes not rated")) return "Partial check: shoes not rated";
  return null;
}

function sceneOf(r: Reading): Scene {
  if (!r.scene) r.scene = {};
  return r.scene;
}

/** Shoe snap: replace the footwear slot with the snap's first footwear; take bottom.hem from the snap if it read one. */
export function mergeShoeSnap(first: Reading, snap: Reading): Reading {
  const r = clone(first);
  r.garments = r.garments.filter((g) => g.category !== "footwear");
  const shoes = snap.garments.filter((g) => g.category === "footwear");
  r.garments.push(...clone(shoes.slice(0, 1)));
  const sb = snap.garments.find((g) => g.category === "bottom");
  const bi = idx(r, "bottom");
  if (sb && bi >= 0 && !isNone(sb.hem) && sb.hem !== "na") r.garments[bi]!.hem = sb.hem;
  sceneOf(r).shoes_visible = shoes.length > 0;
  return r;
}

/** Bottom-half snap: replace bottom + footwear with the snap's, framing becomes full_body. */
export function mergeBottomSnap(first: Reading, snap: Reading): Reading {
  const r = clone(first);
  r.garments = r.garments.filter((g) => g.category !== "bottom" && g.category !== "footwear");
  r.garments.push(...clone(snap.garments.filter((g) => g.category === "bottom" || g.category === "footwear")));
  const sc = sceneOf(r);
  sc.framing = "full_body";
  sc.shoes_visible = snap.garments.some((g) => g.category === "footwear");
  return r;
}

/** Pick shoes from Closet: drop any footwear, add the item's garment, shoes_visible = true. bottom.hem stays as read. */
export function pickShoesFromCloset(first: Reading, item: Pick<ClosetItem, "garment">): Reading {
  const r = clone(first);
  r.garments = r.garments.filter((g) => g.category !== "footwear");
  r.garments.push(clone(item.garment));
  sceneOf(r).shoes_visible = true;
  return r;
}
