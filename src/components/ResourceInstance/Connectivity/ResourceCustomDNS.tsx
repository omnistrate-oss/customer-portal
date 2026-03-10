import { Box, Stack } from "@mui/material";
import { useMemo } from "react";

import Card from "src/components/Card/Card";
import { Text } from "src/components/Typography/Typography";

import CustomDNS from "./CustomDNS";
import PropertyTable from "./PropertyTable";

function ResourceCustomDNS(props) {
  const {
    globalEndpoints,
    context,
    addCustomDNSMutation,
    removeCustomDNSMutation,
    accessQueryParams,
    refetchInstance,
  } = props;

  const primaryResourceName = globalEndpoints?.primary?.resourceName;
  const primaryResourceEndpoint = globalEndpoints?.primary?.endpoint;

  const [otherResourceFilteredEndpoints] = useMemo(() => {
    const otherEndpoints = globalEndpoints?.others;

    const otherResourceFilteredEndpoints: any[] = [];

    otherEndpoints?.forEach((endpointData) => {
      const { resourceName } = endpointData;
      if (resourceName) {
        // filter out omnistrate observability
        if (resourceName === "Omnistrate Observability") {
          return;
        }
        otherResourceFilteredEndpoints.push(endpointData);
      }
    });
    return [otherResourceFilteredEndpoints];
  }, [globalEndpoints]);

  const rows = useMemo(() => {
    const sectionLabel = "Resource";

    const res: any[] = [];

    if (primaryResourceName || primaryResourceEndpoint) {
      const customDNSEndpointName = globalEndpoints?.primary?.customDNSEndpoint?.name ?? "";
      if (globalEndpoints?.primary?.customDNSEndpoint?.enabled) {
        res.push({
          label: primaryResourceName,
          description: `The global endpoint of the ${sectionLabel.toLowerCase()}`,
          valueType: "custom",
          value: (
            <>
              {primaryResourceName && (
                <CustomDNS
                  resourceName={`${primaryResourceName} ${customDNSEndpointName}`}
                  customDNSData={globalEndpoints?.primary?.customDNSEndpoint}
                  accessQueryParams={accessQueryParams}
                  resourceKey={globalEndpoints?.primary?.resourceKey}
                  resourceId={globalEndpoints?.primary?.resourceId}
                  refetchInstance={refetchInstance}
                />
              )}
            </>
          ),
        });
      }
    }

    if (otherResourceFilteredEndpoints?.length > 0) {
      otherResourceFilteredEndpoints.forEach(({ resourceName, resourceKey, resourceId, customDNSEndpoint }) => {
        const customDNSEndpointName = customDNSEndpoint?.name ?? "";
        if (customDNSEndpoint?.enabled) {
          res.push({
            label: resourceName,
            description: `The global endpoint of the ${sectionLabel.toLowerCase()}`,
            valueType: "custom",
            value: (
              <CustomDNS
                resourceName={`${resourceName} ${customDNSEndpointName}`}
                customDNSData={customDNSEndpoint}
                accessQueryParams={accessQueryParams}
                resourceKey={resourceKey}
                resourceId={resourceId}
                refetchInstance={refetchInstance}
              />
            ),
          });
        }
      });
    }

    return res;
  }, [
    context,
    primaryResourceName,
    primaryResourceEndpoint,
    otherResourceFilteredEndpoints,
    globalEndpoints,
    addCustomDNSMutation,
    removeCustomDNSMutation,
  ]);

  return rows.length === 0 ? (
    <Card
      mt={3}
      sx={{
        paddingTop: "12.5px",
        paddingLeft: "20px",
        paddingRight: "20px",
        minHeight: "500px",
      }}
    >
      <Stack direction="row" justifyContent="center" marginTop="200px">
        <Text size="medium">{` Custom DNS configurations will be available once the instance setup process is complete. Please wait or revisit later.`}</Text>
      </Stack>
    </Card>
  ) : (
    <Box paddingTop={context === "fleet" ? "-10px" : "22px"}>
      <PropertyTable data-testid="connectivity-table" rows={rows} />
    </Box>
  );
}

export default ResourceCustomDNS;
