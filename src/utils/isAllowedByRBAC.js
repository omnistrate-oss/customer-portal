const operationEnum = {
  Create: "Create",
  Read: "Read", //READ = DESCRIBE
  Update: "Update",
  Delete: "Delete",
  List: "List",

  Invite: "Invite",
  UnInvite: "UnInvite",
};

const roleEnum = {
  Root: "root",
  Admin: "Admin",
  Service_Editor: "Service_Editor",
  Service_Operator: "Service_Operator",
  Service_Reader: "Service_Reader",
  Outside_User: "Outside_User",
  Editor: "Editor",
  Reader: "Reader",
};

const viewEnum = {
  AccountConfig: "AccountConfig",
  AccessControl: "AccessControl",
  Template: "Template",
  BillingPricing: "BillingPricing",
  BuildService: "BuildService",
  PipelinesOfService: "PipelinesOfService",
  ServiceFleet: "ServiceFleet",
  ImageRegistry: "ImageRegistry",
  AccessService: "AccessService",

  Access_AccessControl: "Access_AccessControl",
  Access_Resources: "Access_Resources",
};

function isOperationAllowedByRBAC(operation, role, view, options = {}) {
  const isConsumptionSubscriptionAdminRBACEnabled = Boolean(options.consumptionSubscriptionAdminRBAC);

  switch (true) {
    // Admin - BillingPricing
    case operation === operationEnum.Read && role === roleEnum.Admin && view === viewEnum.BillingPricing:
      return true;
    case operation === operationEnum.List && role === roleEnum.Admin && view === viewEnum.BillingPricing:
      return true;

    // Root - BillingPricing
    case operation === operationEnum.Read && role === roleEnum.Root && view === viewEnum.BillingPricing:
      return true;
    case operation === operationEnum.List && role === roleEnum.Root && view === viewEnum.BillingPricing:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Root && view === viewEnum.BillingPricing:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Root && view === viewEnum.BillingPricing:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Root && view === viewEnum.BillingPricing:
      return true;

    // AccessService -  Root
    case operation === operationEnum.List && role === roleEnum.Root && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Read && role === roleEnum.Root && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Root && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Root && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Root && view === viewEnum.AccessService:
      return true;

    // AccessService -  Admin
    case operation === operationEnum.List && role === roleEnum.Admin && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Read && role === roleEnum.Admin && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Admin && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Admin && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Admin && view === viewEnum.AccessService:
      return true;

    // AccessService -  Service Editor
    case operation === operationEnum.List && role === roleEnum.Service_Editor && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Read && role === roleEnum.Service_Editor && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Service_Editor && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Service_Editor && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Service_Editor && view === viewEnum.AccessService:
      return true;

    // AccessService -  Service Reader
    case operation === operationEnum.List && role === roleEnum.Service_Reader && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Read && role === roleEnum.Service_Reader && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Service_Reader && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Service_Reader && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Service_Reader && view === viewEnum.AccessService:
      return true;

    // AccessService -  Service Operator
    case operation === operationEnum.List && role === roleEnum.Service_Operator && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Read && role === roleEnum.Service_Operator && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Create && role === roleEnum.Service_Operator && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Update && role === roleEnum.Service_Operator && view === viewEnum.AccessService:
      return true;
    case operation === operationEnum.Delete && role === roleEnum.Service_Operator && view === viewEnum.AccessService:
      return true;

    // Access_AccessControl -  Root
    case operation === operationEnum.List && role === roleEnum.Root && view === viewEnum.Access_AccessControl:
      return true;
    case operation === operationEnum.Invite && role === roleEnum.Root && view === viewEnum.Access_AccessControl:
      return true;
    case operation === operationEnum.UnInvite && role === roleEnum.Root && view === viewEnum.Access_AccessControl:
      return true;

    // Access_AccessControl -  Admin
    case operation === operationEnum.List && role === roleEnum.Admin && view === viewEnum.Access_AccessControl:
      return true;
    case isConsumptionSubscriptionAdminRBACEnabled &&
      operation === operationEnum.Invite &&
      role === roleEnum.Admin &&
      view === viewEnum.Access_AccessControl:
      return true;
    case isConsumptionSubscriptionAdminRBACEnabled &&
      operation === operationEnum.UnInvite &&
      role === roleEnum.Admin &&
      view === viewEnum.Access_AccessControl:
      return true;

    // Access_Resources - Root
    case operation === operationEnum.Create && role === roleEnum.Root && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Root && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Root && view === viewEnum.Access_Resources:
      return true;

    // Access_Resources - Admin
    case operation === operationEnum.Create && role === roleEnum.Admin && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Admin && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Admin && view === viewEnum.Access_Resources:
      return true;

    // Access_Resources - Service_Editor
    case operation === operationEnum.Create && role === roleEnum.Service_Editor && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Service_Editor && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Service_Editor && view === viewEnum.Access_Resources:
      return true;

    // Access_Resources - Editor
    case operation === operationEnum.Create && role === roleEnum.Editor && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Editor && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Editor && view === viewEnum.Access_Resources:
      return true;

    // Access_Resources - Service_Operator
    case operation === operationEnum.Create && role === roleEnum.Service_Operator && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Service_Operator && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Service_Operator && view === viewEnum.Access_Resources:
      return true;

    // Access_Resources - Service_Reader
    case operation === operationEnum.Create && role === roleEnum.Service_Reader && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Update && role === roleEnum.Service_Reader && view === viewEnum.Access_Resources:
      return true;

    case operation === operationEnum.Delete && role === roleEnum.Service_Reader && view === viewEnum.Access_Resources:
      return true;

    default:
      return false;
  }
}

function isPermittedByRBAC(permission, view) {
  switch (true) {
    case permission === "" && view === "":
      return true;

    default:
      return false;
  }
}

function getEnumFromUserRoleString(role) {
  switch (role) {
    case "admin":
      return roleEnum.Admin;
    case "root":
      return roleEnum.Root;
    case "service_editor":
      return roleEnum.Service_Editor;
    case "service_reader":
      return roleEnum.Service_Reader;
    case "service_operator":
      return roleEnum.Service_Operator;
    case "outside_user":
      return roleEnum.Outside_User;
    case "editor":
      return roleEnum.Editor;
    case "reader":
      return roleEnum.Reader;
  }
}

export { getEnumFromUserRoleString, isOperationAllowedByRBAC, isPermittedByRBAC, operationEnum, roleEnum, viewEnum };
