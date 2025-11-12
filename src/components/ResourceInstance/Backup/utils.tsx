import * as yup from "yup";

export const copySnapshotValidationSchema = yup.object().shape({
  targetRegion: yup.string().required("Target region is required"),
});

export const restoreInstanceWithCustomNetworkValidationSchema = yup.object().shape({
  customNetwork: yup.string().required("Custom network is required"),
});
