"use client";

import { Fragment } from "react";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";

export type SummaryItem = {
  label: string;
  value?: React.ReactNode;
};

export type SummarySection = {
  title: string;
  items: SummaryItem[];
};

type CloudAccountSummaryCardProps = {
  sections: SummarySection[];
  onDoItLater: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  hideNext?: boolean;
};

const CloudAccountSummaryCard: React.FC<CloudAccountSummaryCardProps> = ({
  sections,
  onDoItLater,
  onNext,
  nextLabel = "Next",
  isNextDisabled = false,
  isNextLoading = false,
  hideNext = false,
}) => {
  return (
    <div
      style={{
        position: "sticky",
        top: "104px",
        border: `1px solid ${colors.gray300}`,
        boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208",
      }}
      className="bg-white rounded-xl flex flex-col"
    >
      {/* Header */}
      <div className="py-4 px-6 border-b border-gray-200">
        <Text size="large" weight="semibold" color={colors.purple600}>
          Cloud Account Summary
        </Text>
      </div>

      {/* Content */}
      <div className="px-6 py-5 flex-1 space-y-5">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <Text size="small" weight="semibold" color={colors.purple600} sx={{ mb: "10px", display: "block" }}>
              {section.title}
            </Text>
            <div
              className="grid grid-cols-5 items-baseline"
              style={{ gap: "8px 8px" }}
            >
              {section.items.map((item, iIdx) => (
                item.value !== null && item.value !== undefined ? (
                  <Fragment key={iIdx}>
                    <div className="col-span-2">
                      <Text
                        size="small"
                        weight="medium"
                        color="#414651"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </Text>
                    </div>
                    <div className="col-span-3 flex items-baseline gap-2">
                      <div style={{ marginTop: "-3px" }}>:</div>
                      <div style={{ overflow: "hidden" }}>
                        {typeof item.value === "string" ? (
                          <Text
                            size="small"
                            weight="medium"
                            color={colors.gray900}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.value}
                          >
                            {item.value}
                          </Text>
                        ) : (
                          item.value
                        )}
                      </div>
                    </div>
                  </Fragment>
                ) : null
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer buttons */}
      <div
        style={{
          margin: "0px 16px 20px",
          paddingTop: "20px",
          borderTop: "1px solid #E9EAEB",
        }}
        className="flex items-center gap-3 justify-end"
      >
        <Button
          data-testid="do-it-later-button"
          variant="outlined"
          onClick={onDoItLater}
          sx={{ height: "40px !important", padding: "10px 14px !important" }}
        >
          Do it later
        </Button>
        {!hideNext && (
          <Button
            data-testid="wizard-next-button"
            variant="contained"
            disabled={isNextDisabled || isNextLoading}
            onClick={onNext}
            sx={{ height: "40px !important", padding: "10px 14px !important" }}
          >
            {nextLabel}
            {isNextLoading && <LoadingSpinnerSmall />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CloudAccountSummaryCard;
