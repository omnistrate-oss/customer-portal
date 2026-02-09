export type ResourceType = "compose" | "helm" | "operator" | "kustomize";

type BaseSystemParameter = {
  description: string;
  type: "string" | "integer";
  unapplicableTo?: ResourceType[];
};

export const baseSystermParameters: Record<string, BaseSystemParameter> = {
  // Compute Parameters
  "compute.node.poolName": {
    description: "Name of the node pool where the node is allocated.",
    type: "string",
  },
  "compute.node.cores": {
    description: "Number of CPU cores for the current node.",
    type: "integer",
  },
  "compute.node.memory": {
    description: "Amount of memory (RAM) in GB for the current node.",
    type: "integer",
  },
  "compute.node.instanceType": {
    description: "Instance type for the current node (e.g., m5.large).",
    type: "string",
  },
  "compute.node.name": {
    description: "Name of the current service node.",
    type: "string",
  },
  "compute.node.index": {
    description: "Index of the current node in the service instance.",
    type: "integer",
  },
  "compute.node.region": {
    description: "Region where the current node is deployed.",
    type: "string",
  },
  "compute.nodes[i].poolName": {
    description: "Name of the node pool where a specific node (node i) is allocated.",
    type: "string",
  },
  "compute.nodes[i].cores": {
    description: "Number of CPU cores for a specific node (node i).",
    type: "integer",
  },
  "compute.nodes[i].memory": {
    description: "Amount of memory (RAM) in GB for a specific node (node i).",
    type: "integer",
  },
  "compute.nodes[i].instanceType": {
    description: "Instance type for a specific node (node i) in the service instance.",
    type: "string",
  },
  "compute.nodes[i].name": {
    description: "Name of a specific node (node i) in the service instance.",
    type: "string",
  },
  "compute.nodes[i].index": {
    description: "Index of a specific node (node i) in the service instance.",
    type: "integer",
  },
  "compute.nodes[i].region": {
    description: "Region where a specific node (node i) is deployed.",
    type: "string",
  },
  "compute.numNodes": {
    description: "Total number of nodes in the service instance.",
    type: "integer",
  },

  // Network Parameters
  "network.node.internalEndpoint": {
    type: "string",
    description: "Internal DNS endpoint name of the current node.",
  },
  "network.node.externalEndpoint": {
    description: "External DNS endpoint name of the current node.",
    type: "string",
  },
  "network.node.availabilityZone.code": {
    description: "Code of the availability zone where the current node is located.",
    type: "string",
  },
  "network.node.availabilityZone.id": {
    description: "ID of the availability zone where the current node is located.",
    type: "string",
  },
  "network.node.internalIP": {
    description: "Internal IP address of the current node.",
    type: "string",
  },
  "network.node.hostIP": {
    description: "Host IP address of the current node.",
    type: "string",
  },
  "network.node.subnetID": {
    description: "Subnet ID associated with the current node.",
    type: "string",
  },
  "network.node.networkID": {
    description: "Network ID associated with the current node.",
    type: "string",
  },
  "network.node.cidrRange": {
    description: "CIDR range of the network for the current node.",
    type: "string",
  },
  "network.nodes[i].internalEndpoint": {
    description: "Internal network endpoint of a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].externalEndpoint": {
    description: "External network endpoint of a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].availabilityZone.code": {
    description: "Code of the availability zone for a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].availabilityZone.id": {
    description: "ID of the availability zone for a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].internalIP": {
    description: "Internal IP address of a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].hostIP": {
    description: "Host IP address of a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].subnetID": {
    description: "Subnet ID associated with a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].networkID": {
    description: "Network ID associated with a specific node (node i) in the network array.",
    type: "string",
  },
  "network.nodes[i].cidrRange": {
    description: "CIDR range of the network for a specific node (node i) in the network array.",
    type: "string",
  },
  "network.internalClusterEndpoint": {
    description: "Internal endpoint of the cluster.",
    type: "string",
  },
  "network.internalClusterServerlessEndpoint.endpointName": {
    description: "Endpoint name for the internal cluster serverless endpoint.",
    type: "string",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.internalClusterServerlessEndpoint.openPorts[i]": {
    description: "Open ports for the internal cluster serverless endpoint (port 0).",
    type: "integer",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.internalClusterServerlessEndpoint.partitionID": {
    description: "Partition ID for the internal cluster serverless endpoint.",
    type: "string",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.externalClusterEndpoint": {
    description: "External endpoint of the cluster.",
    type: "string",
  },
  "network.externalClusterServerlessEndpoint.endpointName": {
    description: "Endpoint name for the external cluster serverless endpoint.",
    type: "string",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.externalClusterServerlessEndpoint.openPorts[i]": {
    description: "Open ports for the external cluster serverless endpoint (port 0).",
    type: "integer",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.externalClusterServerlessEndpoint.partitionID": {
    description: "Partition ID for the external cluster serverless endpoint.",
    type: "string",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "network.availabilityZones[i].code": {
    description: "Code of the first availability zone in the array of availability zones.",
    type: "string",
  },
  "network.availabilityZones[i].id": {
    description: "ID of the first availability zone in the array of availability zones.",
    type: "string",
  },

  // Storage Parameters
  "storage.volumes[i].name": {
    description: "Name of the storage volume (volume i) in the volumes array.",
    type: "string",
    unapplicableTo: ["helm", "kustomize", "operator"],
  },
  "storage.volumes[i].size": {
    description: "Size of the storage volume (volume i) in GB.",
    type: "integer",
  },
  "storage.volumes[i].type": {
    description: "Type of the storage volume (volume i) (e.g., SSD, HDD).",
    type: "string",
  },
  "storage.volumes[i].mountPath": {
    description: "Mount path for the storage volume (volume i).",
    type: "string",
  },
  "storage.volumes[i].id": {
    description: "ID of the storage volume (volume i).",
    type: "string",
  },
  "storage.volumes[i].pvName": {
    description: "Persistent Volume (PV) name of the storage volume (volume i).",
    type: "string",
  },
  "storage.numVolumes": {
    description: "Total number of storage volumes in the current node.",
    type: "integer",
  },

  // Tenant Parameters
  "tenant.userID": { description: "User ID of the tenant.", type: "string" },
  "tenant.name": { description: "Name of the tenant.", type: "string" },
  "tenant.email": {
    description: "Email address of the tenant.",
    type: "string",
  },
  "tenant.orgId": {
    description: "Organization ID associated with the tenant.",
    type: "string",
  },
  "tenant.orgName": {
    description: "Organization name associated with the tenant.",
    type: "string",
  },

  // Deployment Parameters
  "deployment.planID": {
    description: "ID of the deployment plan.",
    type: "string",
  },
  "deployment.planName": {
    description: "Name of the deployment plan.",
    type: "string",
  },
  "deployment.planVersion": {
    description: "Version of the deployment plan.",
    type: "string",
  },
  "deployment.resourceAlias": {
    description: "Alias for the deployed resource.",
    type: "string",
  },
  "deployment.resourceID": {
    description: "ID of the deployed resource.",
    type: "string",
  },
  "deployment.nodeAffinityRules": {
    description: "Node affinity rules for the deployment.",
    type: "string",
  },
  "deployment.nodeSelectorRules": {
    description: "Node selector rules for the deployment.",
    type: "string",
  },
  "deployment.tlsServerCertificateSecretName": {
    description: "Secret name for the TLS server certificate.",
    type: "string",
  },
  "deployment.tlsCertMountPath": {
    description: "Mount path for the TLS certificate in the deployment.",
    type: "string",
  },
  "deployment.imageNameWithTag": {
    description: "Full image name with the tag for the deployment container.",
    type: "string",
  },
  "deployment.imagePullSecretName": {
    description: "Name of the image pull secret used for the deployment container image.",
    type: "string",
  },
  "deployment.iamWorkloadRoleARN": {
    description: "ARN of the IAM workload role for the deployment.",
    type: "string",
  },
  "deployment.kubernetesServiceAccountName": {
    description: "Name of the Kubernetes service account used in the deployment.",
    type: "string",
  },
  "deployment.cloudProvider": {
    description: "Cloud provider where the deployment is hosted (e.g., AWS, GCP).",
    type: "string",
  },
  "deployment.cloudProviderAccountID": {
    description: "Account ID of the cloud provider.",
    type: "string",
  },
  "deployment.gcpProjectNumber": {
    description: "Project number for the deployment if using GCP.",
    type: "string",
  },
  "deployment.gcpBootstrapEmail": {
    description: "Email used for GCP bootstrap actions in the deployment.",
    type: "string",
  },
  "deployment.kubernetesClusterID": {
    description: "ID of the Kubernetes cluster used for the deployment.",
    type: "string",
  },
  "deploymentCell.cloudProviderName": {
    description: "Name of the cloud provider for the deployment cell (e.g., AWS, GCP).",
    type: "string",
  },
  "deploymentCell.region": {
    description: "Region where the deployment cell is located.",
    type: "string",
  },
  "deploymentCell.cloudProviderNetworkID": {
    description: "Network ID of the cloud provider for the deployment cell.",
    type: "string",
  },
  "deploymentCell.publicSubnetIDs[i].id": {
    description: "ID of the first public subnet in the deployment cell.",
    type: "string",
  },
  "deploymentCell.availabilityZones[i].id": {
    description: "ID of the first availability zone in the deployment cell.",
    type: "string",
  },
  "deploymentCell.securityGroupID": {
    description: "Security group ID for the deployment cell.",
    type: "string",
  },
};

export const ungroupedSystemParameters: Record<string, BaseSystemParameter> = {
  // Instance Parameters
  id: {
    description: "Unique identifier for the service instance.",
    type: "string",
  },

  // Functions
  deterministicSeedValue: {
    description:
      "Deterministic seed used to generate unique values that are deterministic for each service instance (i.e., seed for password).",
    type: "integer",
  },
};
