// A photo chosen outside the camera cover but meant for it (the Simulator's sample sheet,
// "Choose from your photos"): handed back to the open camera so it gets the same quick check
// (DECISIONS-LOG #100). One listener at a time: the camera that's open.
type Listener = (uri: string) => void;
let listener: Listener | null = null;

export function onLibraryPick(cb: Listener): () => void {
  listener = cb;
  return () => {
    if (listener === cb) listener = null;
  };
}

/** True when an open camera took it; otherwise the caller starts the check itself. */
export function handLibraryPick(uri: string): boolean {
  if (!listener) return false;
  listener(uri);
  return true;
}
