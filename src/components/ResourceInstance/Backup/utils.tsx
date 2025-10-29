import * as yup from "yup";

export const copySnapshotValidationSchema = yup.object().shape({
  targetRegion: yup.string().required("Target region is required"),
});
