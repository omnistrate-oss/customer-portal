# Customer Portal Open Source Project README

## Introduction

The Customer Portal project, provided by Omnistrate, is an open-source platform designed for service providers to deliver customizable SaaS solutions to end customers. It supports direct use for quick deployment or extensive customization through forking, catering to diverse provider needs. This adaptability saves significant time and costs in developing and launching SaaS offerings. Additionally, its open-source nature encourages community engagement, leading to continuous improvement, innovation, and security enhancements, benefiting from the collective expertise of developers worldwide.

## Getting Started

To get started with the Customer Portal open-source project, begin by configuring your service on the Omnistrate Platform to make it ready for use. While familiarity with Next.js and Docker enhances your ability to customize the application, lack of expertise in these areas won't hinder your ability to deploy the Customer Portal application with basic customizations. The process involves cloning the project's repository, setting up your development environment, and configuring the necessary environment variables to tailor the application to your requirements.

### Pre-requisites

- Before starting, ensure your SaaS offering is already configured on the Omnistrate platform; for guidance, refer to this instructional video [here](https://www.youtube.com/watch?v=oYhxQIjdbAc).
- Make sure your service is marked public for customer access
- Update your Omnistrate profile with essential service and Customer Portal configurations, including your organization's description, support email, logo, and favicon URLs.

These details are crucial as they will be presented to customers accessing your application, enhancing brand visibility and support accessibility.

![Alt text](https://drive.google.com/uc?id=1ZcxfwS1cqRNbpdGTnUSj_-SGZ4FwFosE "Organization config")

![Alt text](https://drive.google.com/uc?id=1h7Lnp_-1P-dOdD1ri0QZPi2Rd_U1LUK9 "Customer Portal config")

| Service Provider Details    | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| Organization Name           | Name of your organization                                  |
| Organization Description    | Description of your organization                           |
| Organization Support Email  | Email address to which customers can reach out for support |
| Organization Logo URL       | Your organization's logo URL                               |
| Organization Favicon URL    | Your organization's favicon URL                            |
| Organization Privacy Policy | Your organization's privacy policy for Customer Portal     |
| Organization Terms of use   | Your organization's terms of use for Customer Portal       |

### Customizations

#### Mandatory Customizations

- For mandatory customizations, include configurations such as organization details (name, description, support email, logo URL, and favicon URL) directly in your Omnistrate account. These are already covered in the pre-requisites section
- Additionally, customize your service plan details to include pricing, support options, descriptions for each plan, and relevant documentation links. These elements are crucial for presenting a clear, branded, and informative interface to your customers, ensuring they have all the necessary information to select and utilize your services effectively.

![Alt text](https://drive.google.com/uc?id=1QW3RJ_eT6EIprYIagToNL0pDcUd5ZXd2 "Service plan config modify")

![Alt text](https://drive.google.com/uc?id=1ERufnIhd_YhYVTynbWYbg3FO9JxH5ucV "Service plan config details")

#### Optional Customizations

- For deeper and more comprehensive customizations, optional modifications involve altering the source code itself. This approach allows for significant changes beyond the basic settings, enabling you to tailor the application's functionality, user interface, and overall user experience to better align with your brand and customer needs. Through code customizations, you have the freedom to implement new features, optimize existing workflows, or integrate with other services, providing a truly unique solution for your users.
- When opting for deeper customizations by altering the source code, it's important to remember that maintaining your forked repository in sync with the master branch is your responsibility. This ensures that your customizations benefit from the latest updates, features, and security patches from the original project, helping maintain your application's integrity and performance over time.

## Build and Run Locally

To build and run the Customer Portal locally

1. You'll need Node.js installed on your system. Download the latest LTS version (20.11.1 as of March 13, 2024) from <https://nodejs.org/>. Check the node version to confirm successful installation.

```bash
node --version
```

2. Visit the Yarn website: Go to <https://classic.yarnpkg.com/lang/en/docs/install/> and follow platform-specific instructions for your operating system (Linux, macOS, Windows) to install yarn classic (1.x). Check the yarn version (1.22.19 as of March 13, 2024) to confirm successful installation.

```bash
yarn --version
```

3. Clone the Repository: Use Git to clone the repository to your local machine.

```bash
git clone https://github.com/omnistrate-oss/customer-portal.git
```

4. Install dependencies with yarn

```bash
yarn install
```

5. Configure .env.local: Create a .env.local file in the root directory. Populate it with necessary environment variables

| Environment Variables       | Description                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROVIDER_EMAIL              | Service provider's Omnistrate email address                                                                                                                                                                                                                               |
| PROVIDER_PASSWORD           | Service provider's Omnistrate account password                                                                                                                                                                                                                            |
| ENVIRONMENT_TYPE            | The environment type for your application. Defaults to _PROD_. Learn more about environments [here](https://docs.omnistrate.com/operate-guides/pipelines/)                                                                                                                |
| YOUR_SAAS_DOMAIN_URL        | The secure domain URL where this application will be deployed eg. <https://www.yourcloud.com>. When working locally, it should be <http://localhost:3000>                                                                                                                 |
| YOUR_SAAS_DOMAIN_ALIAS      | The domain alias for your deployment                                                                                                                                                                                                                                      |
| MAIL_SMTP_HOST              | The the hostname or IP address of the mail service provider. Defaults to _smtp.gmail.com_                                                                                                                                                                                 |
| MAIL_SMTP_PORT              | The port to be used for creating the SMTP connection. Defaults to _587_                                                                                                                                                                                                   |
| MAIL_USER_EMAIL             | The email account to be used to authenticate to send mails (signup, reset password etc) to your customers. Check the following [section](#how-to-configure-google-account-for-sending-out-emails) for instructions to configure gmail account for sending out the emails. |
| MAIL_USER_PASSWORD          | The email account password                                                                                                                                                                                                                                                |
| MAIL_FROM                   | Gmail account from which emails will be sent (might be different than MAIL_USER_EMAIL). If this environment variable is not configured, the mails will be sent using MAIL_USER_EMAIL                                                                                      |
| GOOGLE_ANALYTICS_TAG_ID     | Google Analytics tag ID                                                                                                                                                                                                                                                   |
| GOOGLE_RECAPTCHA_SITE_KEY   | Google reCAPTCHA v2 (Invisible) Site Key                                                                                                                                                                                                                                  |
| GOOGLE_RECAPTCHA_SECRET_KEY | Google reCAPTCHA v2 (Invisible) Secret Key                                                                                                                                                                                                                                |
| DISABLE_PASSWORD_LOGIN      | Set this environment variable to true to disable password login                                                                                                                                                                                                           |

6. Run the development server:

```bash
yarn dev
```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to access the app locally

## Deploy on Omnistrate Platform and configure your domain

Deploying on the Omnistrate Platform can follow two main paths: without code customizations and with code customizations.

### With Code Customizations

For users looking to customize the Customer Portal, this option involves customizing the code after forking the Customer Portal repository. You'll make necessary changes, build and push your Docker image to a repository, update the Docker compose file to use your new image, and then create and launch your service on Omnistrate. This method allows for significant level of customization and flexibility however it is important to remember that maintaining your forked repository and keeping it in sync with the master branch is your responsibility.

- After you have made all the customization code changes, you need to build a docker image and push it to your own repo. The dockerfile is already [available](https://github.com/omnistrate-oss/customer-portal/blob/master/Dockerfile), you could use the same.

```bash
docker build -t yourorg/your-customer-portal:1.0.0 .
```

```bash
docker push yourorg/your-customer-portal:1.0.0
```

- Once you have pushed the docker image, you need to refer to it in your docker compose spec

- After updating the docker compose spec, you will use it to create a service in Omnistrate. Rest of the steps are same as those defined in the "Without Code Customization" [section](#without-code-customizations).

### Without Code Customizations

For users looking to deploy the Customer Portal quickly and without modifications, the straightforward approach involves using a predefined Docker compose [yaml](https://github.com/omnistrate-oss/customer-portal/blob/master/docker-compose.yaml). This method facilitates the creation and launching of your service on the Omnistrate platform, utilizing the Customer Portal's existing setup and allowing for basic, provided customizations. It's an efficient path for rapid deployment, capitalizing on the built-in configurations of Customer Portal.

For a video guide covering all the below steps, you can follow it [here](https://www.loom.com/share/58d0019c307646868dae2ba9bc56f727?sid=bab3b5f7-b6b8-4669-9dff-e53ee74dd3cc). The manual steps are listed below -

- Copy the contents of the docker-compose.yaml
- Login to Omnistrate and navigate to "Build Your SaaS" and "Your Compose Spec" tab
- Paste the content of docker-compose.yaml in the yaml editor and provide name, description (logo image is optional and wont be seen by your customers).
- Choose your service model i.e. Provider Hosted, to create your service.
- Follow the prompt to launch an instance of the Customer Portal Service.
- Specify instance details: type, Omnistrate account and password, SMTP email and password, and hosting domain.
- Post-creation, navigate to the "Connectivity" tab, copy the cluster endpoint.
- Access the Customer Portal App through the copied endpoint to reach the login page.
- Once you have confirmed that you can access the Customer Portal app. You are ready to configure your domain.

  - Contact Omnistrate support and share your domain name that you want to use for the Customer Portal App along with the cluster endpoint for the Customer Portal App. Omnistrate team will be able to use this data and do the necessary configurations in Omnistrate Platform.
  - Login to your DNS provider/domain registrar portal (where you bought your domain). Find the DNS section for your domain and add two CNAME records as follows -

    - Type - CNAME
    - Name - @
    - Target - Customer Portal cluster endpoint
    - TTL - Leave as default or as suggested by your DNS provider

    and

    - Type - CNAME
    - Name - www
    - Target - Customer Portal cluster endpoint
    - TTL - Leave as default or as suggested by your DNS provider

- Access your domain and confirm that Customer Portal app is now available on your domain.

## Troubleshooting/FAQ

#### What should I do if I encounter a yarn install error?

Ensure your node and yarn versions meet the project's requirements. Try clearing your yarn cache with yarn cache clean and reinstalling dependencies.

#### Why do I need to specify an environment type?

Customer Portal runs in an environment scope. The services and subscription plans that are made available to the users depend on the environment type that you specify when running the application. Customer Portal supports DEV, STAGING, QA, CANARY, PRIVATE and PROD environment types.
User sign-ups are supported in _PROD_, while other environments are meant for internal use.

Learn more about environments [here](https://docs.omnistrate.com/operate-guides/pipelines/)

#### How to configure Google Account for sending out emails?

Configuring Google Account for sending out emails is a two step process. First the account must have a 2-Step Verification enabled, and second, the app password needs to be set. If the Google Account you are using, already has 2-Step Verification configured, you may skip Step 1, and start with Step 2.

- Step 1 - Enable 2-Step Verification

  1. Visit Your Google Account by navigating to <https://myaccount.google.com> and log in.
  2. Navigate to Security by clicking on "Security" in the left navigation menu.
  3. Scroll down to find the "How you sign in to Google" section and click on "2-Step Verification."
  4. Click on "Get Started."
  5. Follow the on-screen prompts to configure your 2-Step Verification method. Google offers various options like text messages, voice calls, or authenticator apps.

  ![Alt text](https://drive.google.com/uc?id=1_xZudcroEPfiYV456UtwuY1-_K7FfHEQ "Configured Account with 2-Step Verification")

- Step 2 - Create App Password

  1. Once 2-Step Verification is configured, follow the below instructions to create App Password.
  2. While still in the "How you sign in to Google" -> "2-Step Verification" section of your account security, locate and click "App Passwords"
  3. If for some reason you can't locate it, you can follow this link - <https://myaccount.google.com/apppasswords> make sure it is configured for the same Google Account, in case you have multiple Google Accounts opened in your browser.

  ![Alt text](https://drive.google.com/uc?id=1TNKc7u0zLcozw95OIMbFUf22EBL5ocAY "Create App Password")

  4. Provide name of the app, say Customer Portal.
  5. Click "Create."
  6. Google will display a 16-character password something like "fasb nxpq lfnr chtn"
  7. Copy this password and **remove in between spaces** (e.g. fasbnxpqlfnrchtn) to use it instead of your regular Google Account password.

  ![Alt text](https://drive.google.com/uc?id=1N_COKw_GX9rwgpdLKWzrchaclfamK6JH "Copy App Password")

  8. Treat the app password like your regular password and store it securely.

#### How to configure Google reCAPTCHA?

Customer Portal uses Google reCAPTCHA v2 (Invisible) to protect certain pages from attacks against bots. To configure reCAPTCHA,

1. Register a new site by navigating to <https://www.google.com/recaptcha/admin/create>
2. On the site registration form, choose "Challenge(v2)" as the reCAPTCHA type and then choose the
   "Invisible reCAPTCHA badge" option

![Alt text](https://drive.google.com/uc?id=1_LsnRbSX4-XHEw3IAXZHKYqaetH7tqFn "reCAPTHCA Site Registration")

3. Provide the other required details and submit the form.
4. Google will generate a Site Key and a Secret Key for your site.

![Alt text](https://drive.google.com/uc?id=1Ntk2NzpRC545X-7pw24nxs-ZhjVLiS_E "reCAPTHCA Key")

#### How do I resolve "node version not compatible" errors?

Ensure that you have the correct Node.js version installed. Customer Portal requires Node.js version 20.11.1 as mentioned in the guide. You can check your current Node version by running node --version in your terminal. If the version is incorrect, download and install the correct version from Node.js [official website](https://nodejs.org/).

#### What if my organization details do not appear correctly on the Customer Portal platform?

Double-check that you've correctly updated your Omnistrate profile with your organization's details, including the description, support email, logo, and favicon URLs. These details are crucial for presenting your organization correctly to customers. Refer to the provided instructional video for guidance on updating these details on the Omnistrate platform.

#### What should I do if I encounter issues deploying on the Omnistrate Platform?

Review the deployment steps outlined in the [deploy section](#deploy-on-omnistrate-platform-and-configure-your-domain) to ensure all steps were followed correctly. If deploying with code customizations, ensure your forked repository is up to date and your Docker image is correctly built and pushed. For issues specific to the Omnistrate Platform, contact Omnistrate support for assistance.

#### What to do if emails are not being sent to customers?

Verify the configuration of your Google Account for sending out emails, ensuring that 2-Step Verification is enabled and an App Password is generated and used. Double-check the MAIL_USER_EMAIL and MAIL_USER_PASSWORD environment variables to ensure they match your Gmail account and App Password.

#### How can I get more direct support or report an issue not covered by the README?

If the README or existing issues do not cover your problem, open a new issue on the GitHub repository with a detailed description, steps to reproduce, environment details, and any necessary screenshots or videos. For direct support, contact Omnistrate support with your query.

## Contributing

We welcome contributions from the community! Here's how you can help:

- Fork the Repository: Start by forking the project's repository.
- Make Your Changes: Whether it's fixing a bug or adding a feature, make your changes in a separate branch.
- Adhere to Coding Standards: Ensure your code matches the project's style and best practices.
- Submit a Pull Request: Open a pull request with a clear description of your changes and any relevant issue numbers.

## Support and Contact

If you need help or want to report an issue, please follow these steps:

- Open an Issue: If you can't find an answer, open an issue on our GitHub repository with a detailed description of the problem along with reproducible steps, environment details and all necessary screenshots, videos.
- Contact Us: For more direct support, contact Omnistrate support

We strive to create a welcoming and supportive community, so don't hesitate to reach out!
