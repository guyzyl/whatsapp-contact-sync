import { Deferred } from "./deferred";

export const enforcePayments: Deferred<boolean> = new Deferred();

export function setEnforcePayments(value: boolean): void {
  enforcePayments.resolve(value);
}
