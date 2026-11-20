import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { endOfCentralDay, isDateString, lastCoveredCentralDate } from "@/lib/central-date";

describe("central-date", () => {
  it("end of a CST day is 06:00Z next day", () => {
    assert.equal(endOfCentralDay("2027-02-28").toISOString(), "2027-03-01T06:00:00.000Z");
  });
  it("end of a CDT day is 05:00Z next day", () => {
    assert.equal(endOfCentralDay("2027-06-15").toISOString(), "2027-06-16T05:00:00.000Z");
  });
  it("round-trips for display", () => {
    for (const d of ["2027-01-10", "2027-03-13", "2027-03-14", "2027-07-04", "2027-11-07"]) {
      assert.equal(lastCoveredCentralDate(endOfCentralDay(d)), d);
    }
  });
  it("validates date strings", () => {
    assert.equal(isDateString("2027-02-28"), true);
    assert.equal(isDateString("2027-02-30"), false);
    assert.equal(isDateString("27-2-1"), false);
  });
});
