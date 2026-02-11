const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { getSignUpMailContent } = require("./templates/signupTemplate");
const { getOrgInviteUserMailContent } = require("./templates/orgInviteUserTemplate");
const { getOrgRevokeUserMailContent } = require("./templates/orgRevokeUserTemplate");
const { eventTypes } = require("./constants");
const { getEventsList, acknowledgeEvent } = require("../api/events");
const { getResetPasswordMailContent } = require("./templates/forgotPasswordTemplate");
const { getApproveSubscriptionMailContent } = require("./templates/approveSubscriptionRequest");
const { getDenySubscriptionMailContent } = require("./templates/denySubscriptionRequest");
const { getSubscriptionResumedMailContent } = require("./templates/resumeSubscription");
const { getSubscriptionSuspendedMailContent } = require("./templates/suspendSubscription");
const { getSubscriptionTerminateMailContent } = require("./templates/terminateSubscription");
const { getInvoiceCreatedTemplate } = require("./templates/invoiceCreatedTemplate");
const { getUpgradeNotificationMailContent } = require("./templates/upgradeNotification");

const { getProviderOrgDetails } = require("../api/customer-user");
const { getNodeMailerConfig } = require("./mail-config");
const { getEnvironmentType } = require("../utils/getEnvironmentType");
const { getDisconnectedAccountCompleteMailContentAWS } = require("./templates/disconnectedAccountcompleteAWS");
const { getConnectedAccountCompleteMailContentAWS } = require("./templates/connectedAccountCompleteAWS");
const { getPendingRevokePermissionsMailContentAWS } = require("./templates/pendingRevokePermissionsAWS");
const { getPendingRestorePermissionsMailContentAWS } = require("./templates/pendingRestorePermissionsAWS");

const { getDisconnectedAccountCompleteMailContentGCP } = require("./templates/disconnectedAccountcompleteGCP");
const { getConnectedAccountCompleteMailContentGCP } = require("./templates/connectedAccountCompleteGCP");
const { getPendingRevokePermissionsMailContentGCP } = require("./templates/pendingRevokePermissionsGCP");
const { getPendingRestorePermissionsMailContentGCP } = require("./templates/pendingRestorePermissionsGCP");

let isRunning = false;

function startMailServiceCron() {
  let mailTransporter = null;

  async function mailService() {
    if (isRunning) return;

    try {
      isRunning = true;
      if (mailTransporter === null) {
        mailTransporter = nodemailer.createTransport(getNodeMailerConfig());
      }
      await mailTransporter.verify();
      const environmentType = getEnvironmentType();

      //Fetch all events
      const eventsResponse = await getEventsList(environmentType);
      const events = eventsResponse.data.events || [];
      const orgDetailsResponse = await getProviderOrgDetails();
      const orgLogoURL = orgDetailsResponse.data.orgLogoURL;
      const orgSupportEmail = orgDetailsResponse.data.orgSupportEmail;

      const mailPromises = [];

      for (const event of events) {
        try {
          let mailContent = null;
          switch (event.eventType) {
            case eventTypes.CustomerSignUp: {
              mailContent = await getSignUpMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.InviteUser: {
              mailContent = await getOrgInviteUserMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.RevokeUserRole: {
              mailContent = await getOrgRevokeUserMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.ResetPassword: {
              mailContent = await getResetPasswordMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.ApproveSubscriptionRequest: {
              mailContent = await getApproveSubscriptionMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.DenySubscriptionRequest: {
              mailContent = await getDenySubscriptionMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.ResumeSubscription: {
              mailContent = await getSubscriptionResumedMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.SuspendSubscription: {
              mailContent = await getSubscriptionSuspendedMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.TerminateSubscription: {
              mailContent = await getSubscriptionTerminateMailContent(event, orgLogoURL);
              break;
            }

            case eventTypes.InstanceMaintenanceScheduled: {
              mailContent = await getUpgradeNotificationMailContent(
                "upgradeScheduled",
                event,
                orgLogoURL,
                orgSupportEmail
              );
              break;
            }

            case eventTypes.InstanceMaintenanceCompleted: {
              mailContent = await getUpgradeNotificationMailContent(
                "upgradeCompleted",
                event,
                orgLogoURL,
                orgSupportEmail
              );
              break;
            }

            case eventTypes.InvoiceCreated: {
              mailContent = await getInvoiceCreatedTemplate(event, orgLogoURL);
              break;
            }

            case eventTypes.PendingRestorePermissions: {
              if (event?.eventPayload?.gcp_connect_bash_script) {
                mailContent = await getPendingRestorePermissionsMailContentGCP(event, orgLogoURL, orgSupportEmail);
              } else if (event?.eventPayload?.connect_cfn_url) {
                mailContent = await getPendingRestorePermissionsMailContentAWS(event, orgLogoURL, orgSupportEmail);
              } else {
                console.warn(`Connection event missing cloud provider signature: ${event.eventID}`);
              }
              break;
            }
            case eventTypes.PendingRevokePermissions: {
              if (event?.eventPayload?.gcp_disconnect_bash_script) {
                mailContent = await getPendingRevokePermissionsMailContentGCP(event, orgLogoURL, orgSupportEmail);
              } else if (event?.eventPayload?.disconnect_cfn_url) {
                mailContent = await getPendingRevokePermissionsMailContentAWS(event, orgLogoURL, orgSupportEmail);
              } else {
                console.warn(`Connection event missing cloud provider signature: ${event.eventID}`);
              }
              break;
            }
            case eventTypes.DisconnectAccountComplete: {
              if (event?.eventPayload?.gcp_disconnect_bash_script) {
                mailContent = await getDisconnectedAccountCompleteMailContentGCP(event, orgLogoURL, orgSupportEmail);
              } else if (event?.eventPayload?.disconnect_cfn_url) {
                mailContent = await getDisconnectedAccountCompleteMailContentAWS(event, orgLogoURL, orgSupportEmail);
              } else {
                console.warn(`Connection event missing cloud provider signature: ${event.eventID}`);
              }
              break;
            }

            case eventTypes.ConnectAccountComplete: {
              if (event?.eventPayload?.gcp_connect_bash_script) {
                mailContent = await getConnectedAccountCompleteMailContentGCP(event, orgLogoURL, orgSupportEmail);
              } else if (event?.eventPayload?.connect_cfn_url) {
                mailContent = await getConnectedAccountCompleteMailContentAWS(event, orgLogoURL, orgSupportEmail);
              } else {
                console.warn(`Connection event missing cloud provider signature: ${event.eventID}`);
              }
              break;
            }

            default:
              break;
          }

          if (mailContent) {
            //use address configured in MAIL_FROM. If not configured fallback to MAIL_USER_EMAIL
            const fromEmailAddress = process.env.MAIL_FROM || process.env.MAIL_USER_EMAIL;

            const mailPromise = mailTransporter
              .sendMail({
                from: `"${mailContent.senderName}" <${fromEmailAddress}>`,
                replyTo: fromEmailAddress,
                to: mailContent.recepientEmail,
                subject: mailContent.subject,
                html: mailContent.message,
              })
              .then(async () => {
                //call backend api
                await acknowledgeEvent(event.eventID);
              });

            mailPromises.push(mailPromise);
          }
        } catch {
          console.error("Mail error");
        }
      }

      await Promise.all(mailPromises)
        .then(() => {
          if (mailPromises.length === events.length && events.length > 0)
            console.log("All mails sent and events acknowledged");
        })
        .finally(() => {
          isRunning = false;
        });
    } catch {
      isRunning = false;
      console.error("Mail cron error");
    }
  }
  //run cron job after every 30 seconds
  cron.schedule("*/30 * * * * *", function () {
    console.log("Running mail service cron job");
    mailService();
  });
}

module.exports = { startMailServiceCron };
