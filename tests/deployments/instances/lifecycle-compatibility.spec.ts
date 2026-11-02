import { canTakeFinalSnapshotBeforeDeletion } from "app/(dashboard)/instance-snapshots/utils";
import { expect, test } from "test-fixtures/har-test";

import { getInstanceHealthStatus } from "src/components/InstanceHealthStatusChip/InstanceHealthStatusChip";
import { statuses } from "src/components/StatusChip/StatusChip";
import { resourceInstanceStatusMap } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { calculateInstanceHealthPercentage } from "src/utils/instanceHealthPercentage";
import { isActiveInstanceLifecycle } from "src/utils/resourceInstance";

// These cases use no browser context or API requests, so there is no traffic to record in a HAR.
test.describe("Instance lifecycle compatibility", () => {
  for (const status of ["RUNNING", "ACTIVE"] as const) {
    test(`${status} preserves lifecycle eligibility and its own display label`, () => {
      expect(isActiveInstanceLifecycle(status)).toBe(true);
      expect(resourceInstanceStatusMap[status]).toEqual({
        category: "success",
        label: status === "ACTIVE" ? "Active" : "Running",
      });
      expect(statuses[status]).toBe(status === "ACTIVE" ? "Active" : "Running");
      expect(canTakeFinalSnapshotBeforeDeletion(true, status)).toBe(true);
      expect(canTakeFinalSnapshotBeforeDeletion(false, status)).toBe(false);
    });

    test(`${status} does not replace explicitly unknown health with healthy`, () => {
      const topology = {
        main: {
          main: true,
          hasCompute: true,
          allowedIPRanges: [],
          clusterEndpoint: "",
          disabled: false,
          isJob: false,
          networkingType: "PRIVATE",
          publiclyAccessible: false,
          resourceKey: "main",
          resourceName: "Main",
          nodes: [{ id: "node-1", healthStatus: "UNKNOWN" }],
        },
      };
      expect(getInstanceHealthStatus(topology, status)).toBe("UNKNOWN");
      expect(calculateInstanceHealthPercentage(topology, status)).toBe(0);
    });
  }

  for (const status of ["STOPPED", "DEPLOYING", "FAILED", "UNKNOWN", "INSTALLER_READY", "active", "", undefined]) {
    test(`${String(status)} does not enable active lifecycle operations or snapshots`, () => {
      expect(isActiveInstanceLifecycle(status)).toBe(false);
      expect(canTakeFinalSnapshotBeforeDeletion(true, status)).toBe(false);
    });
  }

  test("Active with no health observations remains Unknown and zero percent", () => {
    expect(getInstanceHealthStatus({}, "ACTIVE")).toBe("UNKNOWN");
    expect(calculateInstanceHealthPercentage({}, "ACTIVE")).toBe(0);
  });

  test("Ready instances preserve their existing snapshot eligibility", () => {
    expect(isActiveInstanceLifecycle("READY")).toBe(false);
    expect(canTakeFinalSnapshotBeforeDeletion(true, "READY")).toBe(true);
    expect(canTakeFinalSnapshotBeforeDeletion(false, "READY")).toBe(false);
  });

  test("missing lifecycle and disabled snapshot features remain ineligible", () => {
    expect(isActiveInstanceLifecycle(null)).toBe(false);
    expect(canTakeFinalSnapshotBeforeDeletion(undefined, "ACTIVE")).toBe(false);
    expect(canTakeFinalSnapshotBeforeDeletion()).toBe(false);
  });
});
