import mapJSON from "../utils/map.json";
import DottedMap from "dotted-map/without-countries";
import { FC } from "react";
import { CloudProvider } from "src/types/common/enums";
import { getRegionCoordinates } from "../utils/getRegionCoordinates";
import { Box, Stack } from "@mui/material";
import SVGMap from "./Map";
import RippleCircle from "src/components/Ripple/Ripple";
import RegionTootlip from "./RegionToolip";
import { getRegionHexColor } from "../utils/getRegionColor";
import LegendListItem from "./LegendListItem";
import { getPercent } from "src/utils/calculatePercentage";

type DottedWorldMapProps = {
  regionsWithInstanceCount: {
    region: string;
    instanceCount: number;
    cloudProvider: CloudProvider;
  }[];
};

const DottedWorldMap: FC<DottedWorldMapProps> = (props) => {
  const { regionsWithInstanceCount = [] } = props;
  /*@ts-ignore */
  const map = new DottedMap({ map: mapJSON });

  const inUseProviderRegions = regionsWithInstanceCount.map(
    (regionsWithInstanceCount) =>
      `${regionsWithInstanceCount.cloudProvider}-${regionsWithInstanceCount.region}`
  );

  const totalInstanceCount = regionsWithInstanceCount.reduce((acc, curr) => {
    acc = acc + curr.instanceCount;
    return acc;
  }, 0);

  const svgMap = map.getSVG({
    radius: 0.35,
    color: "#D1D5DA",
    shape: "circle",
  });

  return (
    <>
      <Box position="relative">
        <SVGMap>
          {regionsWithInstanceCount.map((location, index) => {
            const coordinates = getRegionCoordinates(
              location.cloudProvider,
              location.region
            );
            if (coordinates) {
              const pin = map.getPin({
                lat: coordinates.latitude,
                lng: coordinates.longitude,
              });

              const colorRGBNumbers = getRegionHexColor(
                location.cloudProvider,
                location.region,
                inUseProviderRegions
              );

              return (
                <>
                  <foreignObject
                    x={pin.x}
                    y={pin.y}
                    key={index}
                    height="6px"
                    width="6px"
                    style={{
                      borderRadius: "50%",
                      transform: "translate(-3px, -3px)",
                    }}
                  >
                    <RegionTootlip
                      cloudProvider={location.cloudProvider}
                      region={location.region}
                    >
                      <Box
                        sx={{
                          transform: "translate(2px, 2px)",
                          borderRadius: "50%",
                          height: "6px",
                          width: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <RippleCircle
                          size={2}
                          colorHex={colorRGBNumbers}
                          animationName={location.region}
                        />
                      </Box>
                    </RegionTootlip>
                  </foreignObject>
                </>
              );
            } else {
              return "";
            }
          })}
        </SVGMap>
        {/* eslint-disable-next-line */}
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          alt=""
        />
      </Box>
      <Stack
        direction="row"
        justifyContent="center"
        columnGap="58px"
        rowGap="8px"
        marginTop="48px"
        flexWrap="wrap"
      >
        {regionsWithInstanceCount.map((regionWithInstanceCount) => (
          <LegendListItem
            key={`${regionWithInstanceCount.cloudProvider}-${regionWithInstanceCount.region}`}
            cloudProvider={regionWithInstanceCount.cloudProvider}
            region={regionWithInstanceCount.region}
            color={getRegionHexColor(
              regionWithInstanceCount.cloudProvider,
              regionWithInstanceCount.region,
              inUseProviderRegions
            )}
            numInstances={regionWithInstanceCount.instanceCount}
            percent={getPercent(
              regionWithInstanceCount.instanceCount,
              totalInstanceCount
            )}
          />
        ))}
      </Stack>
    </>
  );
};

export default DottedWorldMap;
