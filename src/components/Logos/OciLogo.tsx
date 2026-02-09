import Image from "next/image";

import ociLogo from "public/assets/images/logos/oci.svg";

function OciLogo(props) {
  return <Image src={ociLogo} alt="oci-logo" style={{ width: "auto", height: "17px" }} {...props} />;
}

export default OciLogo;
