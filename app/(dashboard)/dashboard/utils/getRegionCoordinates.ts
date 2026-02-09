import { CloudProvider } from "src/types/common/enums";

const AWS_REGION_COORDINATES = {
  "us-east-1": {
    name: "US East (N. Virginia)",
    latitude: 38.13,
    longitude: -78.45,
  },
  "us-east-2": { name: "US East (Ohio)", latitude: 39.96, longitude: -83 },
  "us-west-1": {
    name: "US West (N. California)",
    latitude: 37.35,
    longitude: -121.96,
  },
  "us-west-2": {
    name: "US West (Oregon)",
    latitude: 46.15,
    longitude: -123.88,
  },
  "af-south-1": {
    name: "Africa (Cape Town)",
    latitude: -33.9221,
    longitude: 18.4231,
  },
  "ap-east-1": {
    name: "Asia Pacific (Hong Kong)",
    latitude: 22.3193,
    longitude: 114.1694,
  },
  "ap-south-2": {
    name: "Asia Pacific (Hyderabad)",
    latitude: 17.4065,
    longitude: 78.4772,
  },
  "ap-southeast-3": {
    name: "Asia Pacific (Jakarta)",
    latitude: -6.1944,
    longitude: 106.8229,
  },
  "ap-southeast-5": {
    name: "Asia Pacific (Malaysia)",
    latitude: 4.2105,
    longitude: 101.9758,
  },
  "ap-southeast-4": {
    name: "Asia Pacific (Melbourne)",
    latitude: -37.8136,
    longitude: 144.9631,
  },
  "ap-south-1": {
    name: "Asia Pacific (Mumbai)",
    latitude: 19.08,
    longitude: 72.88,
  },
  "ap-northeast-3": {
    name: "Asia Pacific (Osaka)",
    latitude: 34.6937,
    longitude: 135.5023,
  },
  "ap-northeast-2": {
    name: "Asia Pacific (Seoul)",
    latitude: 37.56,
    longitude: 126.98,
  },
  "ap-southeast-1": {
    name: "Asia Pacific (Singapore)",
    latitude: 1.37,
    longitude: 103.8,
  },
  "ap-southeast-2": {
    name: "Asia Pacific (Sydney)",
    latitude: 33.8,
    longitude: 151.2,
  },
  "ap-northeast-1": {
    name: "Asia Pacific (Tokyo)",
    latitude: 35.41,
    longitude: 139.42,
  },
  "ca-central-1": {
    name: "Canada (Central)",
    latitude: 45.5,
    longitude: -73.6,
  },
  "ca-west-1": {
    name: "Canada West (Calgary)",
    latitude: 51.0447,
    longitude: 114.0719,
  },

  "eu-central-1": {
    name: "Europe (Frankfurt)",
    latitude: 50.0,
    longitude: 8.0,
  },
  "eu-west-1": {
    name: "Europe (Ireland)",
    latitude: 53.7798,
    longitude: -7.3055,
  },
  "eu-west-2": {
    name: "Europe (London)",
    latitude: 51.5072,
    longitude: -0.1276,
  },
  "eu-south-1": {
    name: "Europe (Milan)",
    latitude: 45.4685,
    longitude: 9.1824,
  },
  "eu-west-3": {
    name: "Europe (Paris)",
    latitude: 48.86,
    longitude: 2.35,
  },
  "eu-south-2": {
    name: "Europe (Spain)",
    latitude: 40.4637,
    longitude: -3.7492,
  },
  "eu-north-1": {
    name: "Europe (Stockholm)",
    latitude: 59.3293,
    longitude: 18.0686,
  },
  "eu-central-2": {
    name: "Europe (Zurich)",
    latitude: 47.3769,
    longitude: 8.5417,
  },
  "il-central-1": {
    name: "Israel (Tel Aviv)",
    latitude: 32.0853,
    longitude: 34.7818,
  },
  "me-south-1": {
    name: "Middle East (Bahrain)",
    latitude: 26.0667,
    longitude: 50.5577,
  },
  "me-central-1": {
    name: "Middle East (UAE)",
    latitude: 23.4241,
    longitude: 53.8478,
  },
  "sa-east-1": {
    name: "South America (São Paulo)",
    latitude: -23.5558,
    longitude: -46.6396,
  },
};

export const GCP_REGION_COORDINATES = {
  "africa-south1": {
    name: "Johannesburg, South Africa",
    latitude: -26.2041,
    longitude: 28.0473,
  },
  "asia-east1": {
    name: "Changhua County, Taiwan, APAC",
    latitude: 23.6978,
    longitude: 120.9605,
  },
  "asia-east2": {
    name: "Hong Kong, APAC",
    latitude: 22.3193,
    longitude: 114.1694,
  },
  "asia-northeast1": {
    name: "Tokyo, Japan, APAC",
    latitude: 35.6895,
    longitude: 139.6917,
  },
  "asia-northeast2": {
    name: "Osaka, Japan, APAC",
    latitude: 34.6937,
    longitude: 135.5023,
  },
  "asia-northeast3": {
    name: "Seoul, South Korea, APAC",
    latitude: 37.5665,
    longitude: 126.978,
  },
  "asia-south1": {
    name: "Mumbai, India, APAC",
    latitude: 19.08,
    longitude: 72.88,
  },
  "asia-south2": {
    name: "Delhi, India, APAC",
    latitude: 28.6139,
    longitude: 77.209,
  },
  "asia-southeast1": {
    name: "Jurong West, Singapore, APAC",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  "asia-southeast2": {
    name: "Jakarta, Indonesia, APAC",
    latitude: -6.2088,
    longitude: 106.8456,
  },
  "australia-southeast1": {
    name: "Sydney, Australia, APAC",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  "australia-southeast2": {
    name: "Melbourne, Australia, APAC",
    latitude: -37.8136,
    longitude: 144.9631,
  },
  "europe-central2": {
    name: "Warsaw, Poland, Europe",
    latitude: 52.2297,
    longitude: 21.0122,
  },
  "europe-north1": {
    name: "Hamina, Finland, Europe",
    latitude: 60.5693,
    longitude: 27.1878,
  },
  "europe-southwest1": {
    name: "Madrid, Spain, Europe",
    latitude: 40.4168,
    longitude: -3.7038,
  },
  "europe-west1": {
    name: "EU (Belgium)",
    latitude: 50.5039,
    longitude: 4.4699,
  },
  "europe-west10": {
    name: "Berlin, Germany, Europe",
    latitude: 48.2082,
    longitude: 16.3738,
  },
  "europe-west12": {
    name: "Turin, Italy, Europe",
    latitude: 45.0703,
    longitude: 7.6869,
  },
  "europe-west2": {
    name: "London, England, Europe",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  "europe-west3": {
    name: "Frankfurt, Germany, Europe",
    latitude: 50.1109,
    longitude: 8.6821,
  },
  "europe-west4": {
    name: "Eemshaven, Netherlands, Europe",
    latitude: 52.1326,
    longitude: 5.2913,
  },
  "europe-west6": {
    name: "Zurich, Switzerland, Europe",
    latitude: 47.3769,
    longitude: 8.5417,
  },
  "europe-west8": {
    name: "Milan, Italy, Europe",
    latitude: 45.4642,
    longitude: 9.19,
  },
  "europe-west9": {
    name: "Paris, France, Europe",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  "me-central1": {
    name: "Doha, Qatar, Middle East",
    latitude: 25.276987,
    longitude: 51.521801,
  },
  "me-central2": {
    name: "Dammam, Saudi Arabia, Middle East",
    latitude: 25.2048,
    longitude: 55.2708,
  },
  "me-west1": {
    name: "Tel Aviv, Israel, Middle East",
    latitude: 32.0853,
    longitude: 34.7818,
  },
  "northamerica-northeast1": {
    name: "Montréal, Québec, North America",
    latitude: 45.5017,
    longitude: -73.5673,
  },
  "northamerica-northeast2": {
    name: "Toronto, Ontario, North America",
    latitude: 43.6532,
    longitude: -79.3832,
  },
  "southamerica-east1": {
    name: "Osasco, São Paulo, Brazil, South America",
    latitude: -23.5505,
    longitude: -46.6333,
  },
  "southamerica-west1": {
    name: "Santiago, Chile, South America",
    latitude: -33.4489,
    longitude: -70.6693,
  },
  "us-central1": {
    name: "Council Bluffs, Iowa, North America",
    latitude: 42.032974,
    longitude: -93.581543,
  },
  "us-east1": {
    name: "Moncks Corner, South Carolina, North America",
    latitude: 33.8361,
    longitude: -81.1637,
  },
  "us-east4": {
    name: "Ashburn, Virginia, North America",
    latitude: 38.0336,
    longitude: -79.4583,
  },
  "us-east5": {
    name: "	Columbus, Ohio, North America",
    latitude: 39.9612,
    longitude: -82.9988,
  },
  "us-south1": {
    name: "Dallas, Texas, North America",
    latitude: 32.7767,
    longitude: -96.797,
  },
  "us-west1": {
    name: "The Dalles, Oregon, North America",
    latitude: 45.5231,
    longitude: -122.6765,
  },
  "us-west2": {
    name: "Los Angeles, California, North America",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  "us-west3": {
    name: "Salt Lake City, Utah, North America",
    latitude: 40.7608,
    longitude: -111.891,
  },
  "us-west4": {
    name: "Las Vegas, Nevada, North America",
    latitude: 36.1699,
    longitude: -115.1398,
  },
};

export const AZURE_REGION_COORDINATES = {
  eastus: {
    name: "(US) East US",
    latitude: 37.3719,
    longitude: -79.8164,
  },
  eastus2: {
    name: "(US) East US 2",
    latitude: 36.6681,
    longitude: -78.3889,
  },
  southcentralus: {
    name: "(US) South Central US",
    latitude: 29.4167,
    longitude: -98.5,
  },
  westus2: {
    name: "(US) West US 2",
    latitude: 47.6062,
    longitude: -122.3321,
  },
  westus3: {
    name: "(US) West US 3",
    latitude: 33.4484,
    longitude: -112.074,
  },
  australiaeast: {
    name: "(Asia Pacific) Australia East",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  southeastasia: {
    name: "(Asia Pacific) Southeast Asia",
    latitude: 1.283,
    longitude: 103.833,
  },
  northeurope: {
    name: "(Europe) North Europe",
    latitude: 53.3478,
    longitude: -6.2597,
  },
  swedencentral: {
    name: "(Europe) Sweden Central",
    latitude: 59.3293,
    longitude: 18.0686,
  },
  uksouth: {
    name: "(Europe) UK South",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  westeurope: {
    name: "(Europe) West Europe",
    latitude: 52.3667,
    longitude: 4.9,
  },
  centralus: {
    name: "(US) Central US",
    latitude: 41.5908,
    longitude: -93.6208,
  },
  southafricanorth: {
    name: "(Africa) South Africa North",
    latitude: -25.7313,
    longitude: 28.2184,
  },
  centralindia: {
    name: "(Asia Pacific) Central India",
    latitude: 18.5204,
    longitude: 73.8567,
  },
  eastasia: {
    name: "(Asia Pacific) East Asia",
    latitude: 22.267,
    longitude: 114.188,
  },
  japaneast: {
    name: "(Asia Pacific) Japan East",
    latitude: 35.6895,
    longitude: 139.6917,
  },
  koreacentral: {
    name: "(Asia Pacific) Korea Central",
    latitude: 37.5665,
    longitude: 126.978,
  },
  canadacentral: {
    name: "(Canada) Canada Central",
    latitude: 43.653,
    longitude: -79.383,
  },
  francecentral: {
    name: "(Europe) France Central",
    latitude: 46.3772,
    longitude: 2.373,
  },
  germanywestcentral: {
    name: "(Europe) Germany West Central",
    latitude: 50.1109,
    longitude: 8.6821,
  },
  italynorth: {
    name: "(Europe) Italy North",
    latitude: 45.4642,
    longitude: 9.19,
  },
  norwayeast: {
    name: "(Europe) Norway East",
    latitude: 59.9139,
    longitude: 10.7522,
  },
  polandcentral: {
    name: "(Europe) Poland Central",
    latitude: 52.2297,
    longitude: 21.0122,
  },
  spaincentral: {
    name: "(Europe) Spain Central",
    latitude: 40.4168,
    longitude: -3.7038,
  },
  switzerlandnorth: {
    name: "(Europe) Switzerland North",
    latitude: 47.3769,
    longitude: 8.5417,
  },
  mexicocentral: {
    name: "(Mexico) Mexico Central",
    latitude: 19.4326,
    longitude: -99.1332,
  },
  uaenorth: {
    name: "(Middle East) UAE North",
    latitude: 25.276987,
    longitude: 55.296249,
  },
  brazilsouth: {
    name: "(South America) Brazil South",
    latitude: -23.5505,
    longitude: -46.6333,
  },
  israelcentral: {
    name: "(Middle East) Israel Central",
    latitude: 31.7683,
    longitude: 35.2137,
  },
  qatarcentral: {
    name: "(Middle East) Qatar Central",
    latitude: 25.276987,
    longitude: 51.52,
  },
};

export const OCI_REGION_COORDINATES = {
  // US
  "us-ashburn-1": {
    name: "US East (Ashburn)",
    latitude: 39.0438,
    longitude: -77.4874,
  },
  "us-chicago-1": {
    name: "US Midwest (Chicago)",
    latitude: 41.8781,
    longitude: -87.6298,
  },
  "us-phoenix-1": {
    name: "US West (Phoenix)",
    latitude: 33.4484,
    longitude: -112.074,
  },
  "us-sanjose-1": {
    name: "US West (San Jose)",
    latitude: 37.3382,
    longitude: -121.8863,
  },
  // Americas
  "sa-saopaulo-1": {
    name: "Brazil East (São Paulo)",
    latitude: -23.5505,
    longitude: -46.6333,
  },
  "sa-vinhedo-1": {
    name: "Brazil Southeast (Vinhedo)",
    latitude: -23.0296,
    longitude: -46.9756,
  },
  "ca-montreal-1": {
    name: "Canada Southeast (Montreal)",
    latitude: 45.5017,
    longitude: -73.5673,
  },
  "ca-toronto-1": {
    name: "Canada Southeast (Toronto)",
    latitude: 43.6532,
    longitude: -79.3832,
  },
  "sa-santiago-1": {
    name: "Chile Central (Santiago)",
    latitude: -33.4489,
    longitude: -70.6693,
  },
  "sa-valparaiso-1": {
    name: "Chile West (Valparaíso)",
    latitude: -33.0472,
    longitude: -71.6127,
  },
  "sa-bogota-1": {
    name: "Colombia Central (Bogotá)",
    latitude: 4.711,
    longitude: -74.0721,
  },
  "mx-queretaro-1": {
    name: "Mexico Central (Querétaro)",
    latitude: 20.5888,
    longitude: -100.3899,
  },
  "mx-monterrey-1": {
    name: "Mexico Northeast (Monterrey)",
    latitude: 25.6866,
    longitude: -100.3161,
  },
  // Europe
  "eu-paris-1": {
    name: "France Central (Paris)",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  "eu-marseille-1": {
    name: "France South (Marseille)",
    latitude: 43.2965,
    longitude: 5.3698,
  },
  "eu-frankfurt-1": {
    name: "Germany Central (Frankfurt)",
    latitude: 50.1109,
    longitude: 8.6821,
  },
  "eu-milan-1": {
    name: "Italy Northwest (Milan)",
    latitude: 45.4642,
    longitude: 9.19,
  },
  "eu-turin-1": {
    name: "Italy North (Turin)",
    latitude: 45.0703,
    longitude: 7.6869,
  },
  "eu-amsterdam-1": {
    name: "Netherlands Northwest (Amsterdam)",
    latitude: 52.3676,
    longitude: 4.9041,
  },
  "eu-jovanovac-1": {
    name: "Serbia Central (Jovanovac)",
    latitude: 43.97,
    longitude: 21.24,
  },
  "eu-madrid-1": {
    name: "Spain Central (Madrid)",
    latitude: 40.4168,
    longitude: -3.7038,
  },
  "eu-madrid-3": {
    name: "Spain Central (Madrid 3)",
    latitude: 40.4168,
    longitude: -3.7038,
  },
  "eu-stockholm-1": {
    name: "Sweden Central (Stockholm)",
    latitude: 59.3293,
    longitude: 18.0686,
  },
  "eu-zurich-1": {
    name: "Switzerland North (Zurich)",
    latitude: 47.3769,
    longitude: 8.5417,
  },
  "uk-london-1": {
    name: "UK South (London)",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  "uk-cardiff-1": {
    name: "UK West (Newport)",
    latitude: 51.5842,
    longitude: -2.9977,
  },
  // Asia Pacific
  "ap-sydney-1": {
    name: "Australia East (Sydney)",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  "ap-melbourne-1": {
    name: "Australia Southeast (Melbourne)",
    latitude: -37.8136,
    longitude: 144.9631,
  },
  "ap-hyderabad-1": {
    name: "India South (Hyderabad)",
    latitude: 17.385,
    longitude: 78.4867,
  },
  "ap-mumbai-1": {
    name: "India West (Mumbai)",
    latitude: 19.076,
    longitude: 72.8777,
  },
  "ap-batam-1": {
    name: "Indonesia (Batam)",
    latitude: 1.0456,
    longitude: 104.0305,
  },
  "ap-osaka-1": {
    name: "Japan Central (Osaka)",
    latitude: 34.6937,
    longitude: 135.5023,
  },
  "ap-tokyo-1": {
    name: "Japan East (Tokyo)",
    latitude: 35.6762,
    longitude: 139.6503,
  },
  "ap-kulai-2": {
    name: "Malaysia (Kulai)",
    latitude: 1.6577,
    longitude: 103.6041,
  },
  "ap-singapore-1": {
    name: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  "ap-singapore-2": {
    name: "Singapore 2",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  "ap-seoul-1": {
    name: "South Korea Central (Seoul)",
    latitude: 37.5665,
    longitude: 126.978,
  },
  "ap-chuncheon-1": {
    name: "South Korea North (Chuncheon)",
    latitude: 37.8813,
    longitude: 127.7298,
  },
  "af-johannesburg-1": {
    name: "South Africa Central (Johannesburg)",
    latitude: -26.2041,
    longitude: 28.0473,
  },
  // Middle East
  "il-jerusalem-1": {
    name: "Israel Central (Jerusalem)",
    latitude: 31.7683,
    longitude: 35.2137,
  },
  "me-jeddah-1": {
    name: "Saudi Arabia West (Jeddah)",
    latitude: 21.4858,
    longitude: 39.1925,
  },
  "me-riyadh-1": {
    name: "Saudi Arabia Central (Riyadh)",
    latitude: 24.7136,
    longitude: 46.6753,
  },
  "me-abudhabi-1": {
    name: "UAE Central (Abu Dhabi)",
    latitude: 24.4539,
    longitude: 54.3773,
  },
  "me-dubai-1": {
    name: "UAE East (Dubai)",
    latitude: 25.2048,
    longitude: 55.2708,
  },
};

export const REGION_COORDINATES = {
  aws: AWS_REGION_COORDINATES,
  gcp: GCP_REGION_COORDINATES,
  azure: AZURE_REGION_COORDINATES,
  oci: OCI_REGION_COORDINATES,
};

export function getRegionCoordinates(
  cloudProvider: CloudProvider,
  region: string
): {
  name: string;
  latitude: number;
  longitude: number;
} {
  return REGION_COORDINATES[cloudProvider]?.[region];
}
