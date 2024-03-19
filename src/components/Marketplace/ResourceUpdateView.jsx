import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../Button/Button";
import FieldContainer from "../FormElements/FieldContainer/FieldContainer";
import FieldDescription from "../FormElements/FieldDescription/FieldDescription";
import FieldLabel from "../FormElements/FieldLabel/FieldLabel";
import Form from "../FormElements/Form/Form";
import { FormControlLabel } from "../FormElements/Radio/Radio";
import TextField from "../FormElements/TextField/TextField";
import { H6, P } from "../Typography/Typography";
import ErrorLabel from "../ErrorLabel/ErrorLabel";
import { describeServiceOfferingResource } from "../../api/serviceOffering";
import Select from "../FormElements/Select/Select";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
function ResourceUpdateView(props) {
  const {
    serviceId,
    selectedResourceKey,
    serviceName,
    formCancelClick,
    formData,
    regions,
    isLoading,
    isCurrentResourceBYOA,
  } = props;

  const [viewParams, setCreateSchema] = useState([]);

  useEffect(() => {
    async function getSchema() {
      const schema = await describeServiceOfferingResource(
        serviceId,
        selectedResourceKey.id,
        formData.values.id
      );

      schema.data.apis.forEach((api) => {
        if (api.verb === "UPDATE") {
          if (api.inputParameters) {
            setCreateSchema(api.inputParameters);
          } else {
            // console.log("NULLL");
          }
        }
      });
    }
    getSchema();
  }, []);

  return (
    <>
      <H6 weight="extrabold" variant="mobile">
        Update {serviceName}
      </H6>
      <P
        weight="semibold"
        sx={{ color: (theme) => theme.palette.neutral[600], mt: "14px" }}
      >
        {serviceName} Instance Details
      </P>
      <Form onSubmit={formData.handleSubmit}>
        <>
          <FieldContainer>
            <FieldLabel>ID</FieldLabel>
            <FieldDescription sx={{ mt: "5px" }}>
              unique id of resource instance
            </FieldDescription>
            <TextField
              id="id"
              disabled="true"
              name="id"
              sx={{
                marginTop: "5px",
                fontSize: "14px",
                color: "black",
                cursor: "default",
                caretColor: "transparent",
              }}
              value={formData.values.id}
            />
          </FieldContainer>
          <FieldContainer>
            <FieldLabel>Cloud Provider</FieldLabel>
            <FieldDescription sx={{ mt: "5px" }}>
              Cloud Provider of resource instance
            </FieldDescription>
            <TextField
              id="cloud_provider"
              name="cloud_provider"
              disabled="true"
              value={
                isCurrentResourceBYOA
                  ? "Amazon Web Services"
                  : formData.values.cloud_provider
              }
              sx={{ marginTop: "16px" }}
            />
          </FieldContainer>
          {!isCurrentResourceBYOA && (
            <>
              <FieldContainer>
                <FieldLabel required>Region</FieldLabel>
                <Select
                  sx={{ marginTop: "16px" }}
                  id="region"
                  name="region"
                  disabled="true"
                  displayEmpty
                  /*multiple*/
                  value={formData.values.region}
                  // value={formData.values.region}
                  onChange={formData.handleChange}
                  input={<OutlinedInput />}
                >
                  <MenuItem disabled value="">
                    <em>None</em>
                  </MenuItem>
                  {[...regions]
                    .sort(function (a, b) {
                      if (a.code < b.code) return -1;
                      else if (a.code > b.code) {
                        return 1;
                      }
                      return -1;
                    })
                    .map((region) => (
                      <MenuItem key={region.code} value={region.code}>
                        {region.cloudProviderName} - {region.code}
                      </MenuItem>
                    ))}
                </Select>
                <ErrorLabel></ErrorLabel>
              </FieldContainer>
              <FieldContainer>
                <FieldLabel>Network Type</FieldLabel>
                <FieldDescription sx={{ mt: "5px" }}>
                  Type of Network
                </FieldDescription>
                <Select
                  id="network_type"
                  name="network_type"
                  disabled="true"
                  value={formData.values.network_type}
                  onChange={formData.handleChange}
                  sx={{ marginTop: "16px" }}
                >
                  {["PUBLIC"].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorLabel>
                  {formData.touched.network_type &&
                    formData.errors.network_type}
                </ErrorLabel>
              </FieldContainer>
            </>
          )}

          <Box mt={5}>
            {viewParams.length > 0 ? (
              <FieldLabel>
                <b>Result Parameters</b>
              </FieldLabel>
            ) : (
              ""
            )}
            {viewParams.map((param) => {
              if (param.custom == true && param.type == "Boolean") {
                return (
                  <FieldContainer key={param.displayName}>
                    {param.required == true ? (
                      <FieldLabel required>{param.displayName}</FieldLabel>
                    ) : (
                      <FieldLabel>{param.displayName}</FieldLabel>
                    )}
                    <FieldDescription sx={{ mt: "5px" }}>
                      {param.description}
                    </FieldDescription>
                    <RadioGroup
                      row
                      aria-labelledby="demo-row-radio-buttons-group-label"
                      id={`requestParams.${param.key}`}
                      name={`requestParams.${param.key}`}
                      value={formData.values.requestParams[param.key]}
                      onChange={formData.handleChange}
                      sx={{ marginTop: "16px" }}
                      //modifiable={param.modifiable}
                      required={param.required == true ? "required" : ""}
                    >
                      <FormControlLabel
                        value={true}
                        control={<Radio />}
                        label="True"
                      />
                      <FormControlLabel
                        value={false}
                        control={<Radio />}
                        label="False"
                      />
                    </RadioGroup>
                  </FieldContainer>
                );
              } else if (
                param.custom == true &&
                param.options !== undefined &&
                param.isList === true
              ) {
                const options = param.options ? param.options : [""];

                return (
                  <FieldContainer key={param.key}>
                    {param.required == true ? (
                      <FieldLabel required>{param.displayName}</FieldLabel>
                    ) : (
                      <FieldLabel>{param.displayName}</FieldLabel>
                    )}
                    <FieldDescription sx={{ mt: "5px" }}>
                      {param.description}
                    </FieldDescription>
                    <Select
                      multiple
                      fullWidth
                      sx={{ display: "block", marginTop: "16px" }}
                      id={`requestParams.${param.key}`}
                      name={`requestParams.${param.key}`}
                      renderValue={(selectedList) => {
                        if (selectedList.length === 0) {
                          return <em>None</em>;
                        }
                        const plist = selectedList
                          .map((valInList) => {
                            const returnVal = formData.values.requestParams[
                              param.key
                            ].find((val) => {
                              return val === valInList;
                            });
                            return returnVal;
                          })
                          .join(", ");
                        return (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {plist.split(",").map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        );
                      }}
                      value={formData.values.requestParams[param.key] || []}
                      onChange={formData.handleChange}
                      //modifiable={param.modifiable}
                      required={param.required == true ? "required" : ""}
                    >
                      {options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FieldContainer>
                );
              } else if (
                param.custom == true &&
                param.options !== undefined &&
                param.isList === false
              ) {
                const options = param.options ? param.options : [""];
                return (
                  <FieldContainer key={param.displayName}>
                    {param.required == true ? (
                      <FieldLabel required>{param.displayName}</FieldLabel>
                    ) : (
                      <FieldLabel>{param.displayName}</FieldLabel>
                    )}
                    <FieldDescription sx={{ mt: "5px" }}>
                      {param.description}
                    </FieldDescription>
                    <Select
                      fullWidth
                      MenuProps={MenuProps}
                      id={`requestParams.${param.key}`}
                      name={`requestParams.${param.key}`}
                      value={formData.values.requestParams[param.key] || []}
                      renderValue={(selectedVal) => {
                        return (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {<Chip key={selectedVal} label={selectedVal} />}
                          </Box>
                        );
                      }}
                      onChange={formData.handleChange}
                      modifiable={param.modifiable}
                      sx={{ marginTop: "16px" }}
                      required={param.required == true ? "required" : ""}
                    >
                      {options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FieldContainer>
                );
              } else if (param.custom == true) {
                return (
                  <FieldContainer key={param.key}>
                    {param.required == true ? (
                      <FieldLabel required>{param.displayName}</FieldLabel>
                    ) : (
                      <FieldLabel>{param.displayName}</FieldLabel>
                    )}
                    <FieldDescription sx={{ mt: "5px" }}>
                      {param.description}
                    </FieldDescription>
                    <TextField
                      id={`requestParams.${param.key}`}
                      name={`requestParams.${param.key}`}
                      value={formData.values.requestParams[param.key]}
                      onChange={formData.handleChange}
                      sx={{ marginTop: "16px" }}
                      modifiable={param.modifiable}
                      required={param.required == true ? "required" : ""}
                    />
                  </FieldContainer>
                );
              }
            })}
          </Box>
        </>
        {
          <Box display="flex" justifyContent="flex-end" gap="10px" mt="40px">
            <Button
              variant="contained"
              size="xsmall"
              bgColor="white"
              fontColor="black"
              onClick={formCancelClick}
              sx={{ border: " 1px solid #D1D5DB" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="xsmall"
              type="submit"
              disabled={isLoading}
            >
              Update {serviceName} Instance{" "}
              {isLoading && (
                <CircularProgress size={16} sx={{ marginLeft: "8px" }} />
              )}
            </Button>
          </Box>
        }
      </Form>
    </>
  );
}

export default ResourceUpdateView;
