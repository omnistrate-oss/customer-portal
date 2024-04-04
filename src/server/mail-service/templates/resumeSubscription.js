function getSubscriptionResumedMailContent(resumeSubscriptionEventObj) {
  const orgName = resumeSubscriptionEventObj.orgName;
  const email = resumeSubscriptionEventObj.userEmail;
  const serviceName = resumeSubscriptionEventObj.eventPayload.service_name;
  const servicePlanName =
    resumeSubscriptionEventObj.eventPayload.product_tier_name;

  const subject = `Your ${serviceName} - ${servicePlanName} subscription resumed`;

  const message = `
            <html>
                <body>
                    <p>Hello,</p>
                    <p>Your ${servicePlanName} subscription on ${serviceName} has been resumed. You can now start to use the service again.</p>
                    <p>If you have any questions, please contact support.</p>
                    <p>Sincerely,</p>
                    <p>The ${serviceName} Team</p>
                </body>
            </html>`;

  const recepientEmail = email;

  let mailContent = null;
  if (orgName && serviceName && servicePlanName && recepientEmail) {
    mailContent = {
      recepientEmail: recepientEmail,
      subject: subject,
      message: message,
      senderName: orgName,
    };
  }

  return mailContent;
}

module.exports = {
  getSubscriptionResumedMailContent,
};
