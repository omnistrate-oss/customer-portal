import React, { ReactNode } from "react";

import { colors } from "src/themeConfig";

import { Text } from "../Typography/Typography";

import { Field, Section } from "./types";

type PreviewCardProps = {
  sections: Section[];
  formData: any;
};

const FieldValue = ({ field, formData }: { field: Field; formData: any }) => {
  const { name, label, previewValue } = field;
  const value = formData.values[name];

  if (previewValue === null) return null;

  if (!previewValue && !value) {
    return null;
  }

  const renderPreviewValue = (): ReactNode => {
    if (typeof previewValue === "string" || typeof previewValue === "number") {
      return (
        <Text
          title={previewValue}
          size="small"
          weight="medium"
          color={colors.gray900}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {previewValue}
        </Text>
      );
    }

    if (typeof previewValue === "function") {
      return previewValue({ field, formData });
    }
    return null;
  };

  const renderValue = (): ReactNode => {
    if (value) {
      return (
        <Text
          title={value}
          size="small"
          weight="medium"
          color={colors.gray900}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {value}
        </Text>
      );
    }
    return null;
  };

  return (
    <>
      <div style={{ gridColumn: "span 2 / span 2", maxWidth: "100%" }}>
        <Text
          title={label}
          size="small"
          weight="medium"
          color="#414651"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Text>
      </div>
      <div className="col-span-3 flex items-baseline gap-2">
        <div style={{ marginTop: "-3px" }}>:</div>
        <div style={{ maxWidth: "100%" }}>{previewValue ? renderPreviewValue() : renderValue()}</div>
      </div>
    </>
  );
};

const PreviewCard: React.FC<PreviewCardProps> = ({ sections, formData }) => {
  return (
    <div className="px-4 py-4 flex-1 space-y-6">
      {sections.map((section, index) => {
        if (!section.fields.length) return null;

        return (
          <div key={index}>
            <Text size="small" weight="semibold" color={colors.purple600} sx={{ mb: "10px" }}>
              {section.title}
            </Text>

            <div
              className="grid grid-cols-5 items-baseline"
              style={{
                gap: "10px 8px",
              }}
            >
              {section.fields.map((field, index) => {
                return <FieldValue key={index} field={field} formData={formData} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PreviewCard;
