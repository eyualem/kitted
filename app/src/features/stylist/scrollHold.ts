// A card that grows because HE opened something in it (a picker tray) shouldn't make the thread
// jump to the bottom: the thing he just tapped would scroll away under the header. The card
// calls holdThreadScroll(); the thread skips its "stick to the bottom" for that moment.
let until = 0;

export function holdThreadScroll(ms = 700): void {
  until = Date.now() + ms;
}

export function threadScrollHeld(): boolean {
  return Date.now() < until;
}
