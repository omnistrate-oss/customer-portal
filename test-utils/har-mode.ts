// HAR record/replay mode helpers. Single source of truth for env parsing —
// keeps record/replay/off behavior consistent across config, fixtures, and
// page objects.

export const isReplayMode = (): boolean => process.env.HAR_MODE?.toLowerCase() === "replay";
export const isRecordMode = (): boolean => process.env.HAR_MODE?.toLowerCase() === "record";
