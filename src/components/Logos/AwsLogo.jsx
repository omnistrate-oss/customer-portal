import Image from "next/image";

import awsIcon from "public/assets/images/logos/aws.svg";

function AwsLogo(props) {
  return <Image src={awsIcon} alt="aws-logo" {...props} />;
}

export default AwsLogo;
