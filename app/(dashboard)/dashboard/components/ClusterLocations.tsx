import { FC } from "react";
import dynamic from "next/dynamic";
import { Box, Stack, styled } from "@mui/material";

import ClusterLocationsIcon from "src/components/Icons/Dashboard/ClusterLocations";
import { Text } from "src/components/Typography/Typography";
import { ResourceInstance } from "src/types/resourceInstance";
const DottedWorldMap = dynamic(() => import("./DottedWorldMap"), {
  ssr: false,
});
import { CloudProvider } from "src/types/common/enums";

const ContainerCard = styled(Box)({
  border: "1px solid #E4E7EC",
  borderRadius: "12px",
  boxShadow: "box-shadow: 0px 1px 2px 0px ",
  padding: "24px",
  marginTop: "32px",
});

type ClusterLocationsProps = {
  resourceInstances: ResourceInstance[];
  isFetchingInstances: boolean;
};

const ClusterLocations: FC<ClusterLocationsProps> = (props) => {
  const { resourceInstances = [] } = props;

  // @ts-ignore
  const regionProviderInstancesHash: Record<
    string,
    {
      instanceCount: number;
      cloudProvider: CloudProvider;
      region: string;
    }
  > = resourceInstances.reduce(
    (
      acc: Record<
        string,
        {
          instanceCount: number;
          cloudProvider?: CloudProvider;
          region?: string;
        }
      >,
      curr
    ) => {
      const region = curr.region;
      let cloudProvider = curr.cloud_provider;

      const resultParams: any = curr.result_params;

      //check if instance of type cloud provider account and set cloud provider
      if (
        resultParams &&
        ((resultParams.gcp_project_id && resultParams.gcp_project_number) || resultParams.aws_account_id)
      ) {
        if (resultParams.gcp_project_id) {
          cloudProvider = "gcp";
        } else if (resultParams.azure_subscription_id) {
          cloudProvider = "azure";
        } else if (resultParams.aws_account_id) {
          cloudProvider = "aws";
        } else {
          cloudProvider = "oci";
        }
      }

      const key = `${cloudProvider}-${region}`;

      if (acc[key]) {
        acc[key] = {
          cloudProvider: cloudProvider as CloudProvider,
          instanceCount: acc[key].instanceCount + 1,
          region: region,
        };
      } else {
        acc[key] = {
          cloudProvider: cloudProvider as CloudProvider,
          instanceCount: 1,
          region: region,
        };
      }
      return acc;
    },
    {}
  );

  const regionsWithInstanceCount = Object.entries(regionProviderInstancesHash).map(
    ([, { instanceCount, cloudProvider, region }]) => ({
      region,
      instanceCount,
      cloudProvider,
    })
  );

  return (
    <ContainerCard>
      <Stack paddingBottom="20px" borderBottom="1px solid #E4E7EC" direction="row" alignItems="center" gap="16px">
        <ClusterLocationsIcon />
        <Text size="large" weight="semibold">
          Cluster Locations
        </Text>
      </Stack>
      <Box marginTop="8px" sx={{ marginInline: "auto", maxWidth: "1200px" }}>
        <DottedWorldMap regionsWithInstanceCount={regionsWithInstanceCount} />
      </Box>
    </ContainerCard>
  );
};

export default ClusterLocations;
