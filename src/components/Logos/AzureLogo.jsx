import Image from "next/image";

import azureIcon from "public/assets/images/logos/azure.svg";

function AzureLogo(props) {
  return <Image src={azureIcon} alt="azure-logo" style={{ width: "auto", height: "17px" }} {...props} />;
}

export default AzureLogo;
