/**
 * Stop focused `<input type="number">` from changing value on mouse wheel.
 *
 * Uses preventDefault so the value never steps, then blurs so later wheel
 * events can scroll the page instead of being trapped on the control.
 */
export function suppressNumberInputWheel(event: {
  preventDefault: () => void;
  currentTarget: { blur: () => void };
}): void {
  event.preventDefault();
  event.currentTarget.blur();
}
