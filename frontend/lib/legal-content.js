import { siteConfig } from "@/lib/constants/site";

export const legalLastUpdated = "June 22, 2026";

export const legalPages = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    navLabel: "Terms",
    description:
      "The baseline terms for using the ElevenOrbits website, customer portal, managed services, support workflows, and billing features.",
    sections: [
      {
        heading: "Agreement Scope",
        paragraphs: [
          `These Terms of Service govern access to the ElevenOrbits website, customer portal, ordering flows, managed infrastructure services, AI services, workflow automation services, billing tools, support channels, and related communications. If you or your organization signs a separate written agreement with ElevenOrbits, that written agreement controls where it conflicts with these terms.`,
          "By using the website, creating an account, submitting an order, funding a wallet, paying an invoice, or requesting support, you accept these terms on behalf of yourself or the organization you represent.",
        ],
      },
      {
        heading: "Accounts and Portal Access",
        paragraphs: [
          "You are responsible for keeping account information accurate, protecting login credentials, and making sure only authorized users access your account. Notify ElevenOrbits promptly if you believe account access, credentials, payment details, or service information has been compromised.",
          "ElevenOrbits may rely on the instructions, support messages, payment submissions, and configuration choices submitted through your account unless we have clear reason to believe the request is unauthorized.",
        ],
      },
      {
        heading: "Orders and Managed Delivery",
        paragraphs: [
          "Orders submitted through the portal are requests for managed delivery. Provisioning may require payment confirmation, account review, service availability, licensing checks, infrastructure availability, and operational approval by the ElevenOrbits team.",
          "Configuration notes, selected add-ons, preferred regions, images, and deployment instructions are used to guide fulfillment. ElevenOrbits may contact you for clarification or decline requests that are incomplete, unavailable, unlawful, abusive, or outside the supported service scope.",
        ],
      },
      {
        heading: "Customer Responsibilities",
        paragraphs: [
          "You are responsible for the content, data, software, users, traffic, and instructions associated with your services. You must have the rights and permissions needed to submit materials, deploy workloads, process data, and request changes.",
          "You agree not to use ElevenOrbits services for unlawful activity, abuse, spam, malware, unauthorized access, excessive resource consumption, infringement, harassment, or activity prohibited by the Acceptable Use Policy.",
        ],
      },
      {
        heading: "Billing, Wallet, Renewals, and Taxes",
        paragraphs: [
          "Prices, billing cycles, wallet balances, add-on charges, invoices, manual payment submissions, saved payment methods, and renewal settings may be displayed in the portal. Unless a written agreement says otherwise, charges are due when presented or when the renewal cycle begins.",
          "Wallet funds may be applied before charging a saved card or requesting another payment method. You are responsible for taxes, bank fees, payment processor fees, currency conversion costs, and other external charges unless ElevenOrbits has expressly included them in writing.",
        ],
      },
      {
        heading: "Service Changes, Suspension, and Termination",
        paragraphs: [
          "ElevenOrbits may update, suspend, restrict, or terminate access when required for security, maintenance, unpaid amounts, legal compliance, platform integrity, suspected abuse, or violation of these terms.",
          "You may request cancellation through the portal or support channels. Cancellation affects future service periods and does not automatically refund past payments, setup work, licenses, third-party costs, or consumed services.",
        ],
      },
      {
        heading: "Intellectual Property and Feedback",
        paragraphs: [
          "ElevenOrbits retains ownership of its website, portal, brand assets, service workflows, software, documentation, designs, and operating methods. You retain ownership of your content and data, subject to the permissions needed for ElevenOrbits to provide, secure, support, and improve the services.",
          "If you provide feedback or suggestions, ElevenOrbits may use them without restriction or obligation unless a separate written agreement states otherwise.",
        ],
      },
      {
        heading: "Disclaimers and Liability Limits",
        paragraphs: [
          "Services are provided using commercially reasonable skill and care, but no online service can be guaranteed to be uninterrupted, error-free, secure from every threat, or suitable for every workload. ElevenOrbits does not promise a specific outcome unless a written agreement expressly states it.",
          "To the maximum extent permitted by law, ElevenOrbits is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, business interruption, or substitute services.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Questions about these terms can be sent to ${siteConfig.generalEmail}. Billing-specific questions can be sent to ${siteConfig.billingEmail}.`],
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    navLabel: "Privacy",
    description:
      "How ElevenOrbits collects, uses, shares, protects, and retains information connected to the website, portal, billing, support, and managed services.",
    sections: [
      {
        heading: "Information We Collect",
        paragraphs: [
          "ElevenOrbits may collect account details, contact information, organization details, billing information, order selections, service configuration notes, support tickets, uploaded payment evidence, communications, and portal activity.",
          "We may also collect technical information such as IP addresses, browser details, device identifiers, log events, security signals, authentication events, error reports, and usage patterns that help operate and protect the services.",
        ],
      },
      {
        heading: "How We Use Information",
        paragraphs: [
          "We use information to provide and manage services, create accounts, process orders, verify payments, issue invoices, provide support, provision infrastructure, secure the platform, troubleshoot issues, communicate with users, enforce policies, and comply with legal obligations.",
          "We may use aggregated or de-identified information to understand service performance, improve operations, and plan product improvements.",
        ],
      },
      {
        heading: "Payment and Authentication Providers",
        paragraphs: [
          "ElevenOrbits may use third-party providers for authentication, card processing, payment verification, infrastructure, email delivery, storage, security, and operational tooling. These providers process information as needed to perform services for ElevenOrbits.",
          "Card details are handled by payment processors where available. ElevenOrbits should not receive full card numbers through support messages or manual payment forms.",
        ],
      },
      {
        heading: "Support, Billing, and Uploaded Files",
        paragraphs: [
          "Support messages, payment screenshots, invoice references, and operational notes may be reviewed by authorized ElevenOrbits team members to resolve issues, verify payments, activate services, maintain records, and prevent abuse.",
          "Do not upload sensitive personal information, private keys, passwords, full payment card numbers, government identifiers, or regulated data unless ElevenOrbits has specifically requested it through an approved channel.",
        ],
      },
      {
        heading: "Sharing Information",
        paragraphs: [
          "We may share information with vendors, payment processors, authentication providers, infrastructure providers, professional advisors, and authorities when needed to operate the services, protect users, investigate abuse, complete transactions, enforce terms, or comply with law.",
          "ElevenOrbits does not sell personal information as a standalone business activity.",
        ],
      },
      {
        heading: "Retention and Security",
        paragraphs: [
          "We retain information for as long as needed to provide services, maintain business records, comply with legal obligations, resolve disputes, prevent fraud, and enforce agreements. Retention periods may vary by record type and legal requirement.",
          "We use administrative, technical, and organizational safeguards designed to protect information. No security program can eliminate all risk, so users must also protect their accounts, devices, credentials, and service access details.",
        ],
      },
      {
        heading: "Your Choices",
        paragraphs: [
          "You may request updates to account information, ask questions about your information, or request deletion where legally and operationally possible. Some records may need to be retained for billing, security, compliance, dispute resolution, or legitimate business purposes.",
          `Privacy requests can be sent to ${siteConfig.generalEmail}. Billing record questions can be sent to ${siteConfig.billingEmail}.`,
        ],
      },
      {
        heading: "Children",
        paragraphs: ["ElevenOrbits services are intended for business users and are not directed to children. We do not knowingly collect information from children."],
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    navLabel: "Cookies",
    description:
      "How ElevenOrbits uses cookies and similar technologies for authentication, security, preferences, performance, and service operation.",
    sections: [
      {
        heading: "What Cookies Are",
        paragraphs: [
          "Cookies and similar technologies are small files or browser storage entries that help websites remember information, authenticate sessions, protect accounts, route traffic, and understand service performance.",
        ],
      },
      {
        heading: "How ElevenOrbits Uses Cookies",
        paragraphs: [
          "We use required cookies and similar technologies to operate the website and portal, maintain sessions, secure authentication flows, prevent fraud, remember preferences, support checkout and billing workflows, and improve reliability.",
          "Where analytics or performance tools are used, they help us understand aggregate traffic, errors, and usage patterns so we can improve the website and portal.",
        ],
      },
      {
        heading: "Third-Party Cookies",
        paragraphs: [
          "Authentication, payment, hosting, security, and embedded service providers may set or read cookies as needed to provide their services. Their use is governed by their own policies and agreements.",
        ],
      },
      {
        heading: "Your Controls",
        paragraphs: [
          "Most browsers let you block, delete, or limit cookies. Blocking required cookies may prevent login, checkout, payment verification, support, or portal features from working correctly.",
          `Questions about cookie use can be sent to ${siteConfig.generalEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    navLabel: "Refunds",
    description:
      "How refund, wallet credit, cancellation, duplicate payment, and managed-service billing requests are reviewed by ElevenOrbits.",
    sections: [
      {
        heading: "Managed Service Billing",
        paragraphs: [
          "ElevenOrbits provides managed services that may include review, provisioning, setup, licensing, operational work, infrastructure coordination, and support. Once work has started, setup work, consumed service time, third-party costs, licenses, and completed operational work are generally non-refundable unless required by law or agreed in writing.",
        ],
      },
      {
        heading: "Eligible Refund Reviews",
        paragraphs: [
          "ElevenOrbits may review refund requests for duplicate payments, billing errors, payments made against unavailable services, accidental overpayments, or situations where ElevenOrbits determines it cannot provide the purchased service.",
          "Approved refunds may be returned to the original payment method, applied as wallet credit, or handled through another mutually acceptable method depending on the payment rail and account status.",
        ],
      },
      {
        heading: "Cancellations",
        paragraphs: [
          "Cancellation stops future renewal periods after the cancellation is processed. It does not automatically refund prior charges, current service periods, setup fees, license fees, third-party charges, or manual work already performed.",
          "Some services may require advance notice, data export coordination, credential handoff, or infrastructure decommissioning steps before cancellation is complete.",
        ],
      },
      {
        heading: "Wallet Funds and Manual Payments",
        paragraphs: [
          "Wallet credits are intended for ElevenOrbits service charges. Manual payment submissions must be verified before funds are applied. If a payment cannot be verified, ElevenOrbits may request additional proof or decline the wallet credit.",
        ],
      },
      {
        heading: "How to Request a Review",
        paragraphs: [
          `Refund or billing review requests should be sent to ${siteConfig.billingEmail} with the invoice number, payment reference, account email, amount, date, and reason for the request.`,
          "Submitting a request does not guarantee approval. ElevenOrbits will review available records, service state, third-party costs, and applicable obligations before deciding.",
        ],
      },
    ],
  },
  {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    navLabel: "Acceptable Use",
    description:
      "Rules that protect the ElevenOrbits platform, customers, infrastructure, networks, and third-party services from abuse or unlawful activity.",
    sections: [
      {
        heading: "Prohibited Activity",
        paragraphs: ["You may not use ElevenOrbits services, accounts, infrastructure, support channels, or networks for:"],
        list: [
          "Unlawful, fraudulent, deceptive, harassing, abusive, or harmful activity.",
          "Spam, unsolicited bulk messaging, phishing, credential harvesting, or deceptive traffic.",
          "Malware, botnets, command-and-control activity, ransomware, exploit hosting, or unauthorized scanning.",
          "Distributed denial-of-service activity, traffic amplification, network abuse, or attempts to disrupt services.",
          "Unauthorized access, privilege escalation, password attacks, credential misuse, or security circumvention.",
          "Copyright, trademark, privacy, publicity, trade secret, or intellectual-property infringement.",
          "Content or workloads that create unusual risk to people, property, public systems, or regulated environments without prior written approval.",
        ],
      },
      {
        heading: "Resource and Network Integrity",
        paragraphs: [
          "You must not overload shared systems, interfere with other users, bypass usage limits, hide abusive traffic, rotate infrastructure to evade enforcement, or use services in a way that damages IP reputation, upstream networks, or platform reliability.",
        ],
      },
      {
        heading: "Security Research",
        paragraphs: [
          "Security testing, scanning, vulnerability research, penetration testing, red-team activity, and similar work require prior written approval from ElevenOrbits unless the activity is limited to systems you fully own and does not touch ElevenOrbits infrastructure, customers, networks, or third parties.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "ElevenOrbits may investigate suspected violations and may remove content, restrict traffic, suspend services, disable accounts, preserve records, report activity, or terminate services when needed to protect users, networks, legal compliance, or platform integrity.",
          `Abuse reports can be sent to ${siteConfig.supportEmail}. Security-specific reports can be sent to ${siteConfig.securityEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "marketing-policy",
    title: "Marketing & Communications Policy",
    navLabel: "Marketing",
    description:
      "How ElevenOrbits handles marketing messages, service announcements, consent, opt-outs, promotions, and customer communications.",
    sections: [
      {
        heading: "Marketing Communications",
        paragraphs: [
          "ElevenOrbits may send marketing communications about managed infrastructure, AI services, automation, security, support offerings, product updates, events, promotions, and related business services.",
          "Marketing messages may be sent by email or other business communication channels when you request information, create an account, submit a form, become a customer, interact with the website, or otherwise provide contact details in a business context.",
        ],
      },
      {
        heading: "Service and Transactional Messages",
        paragraphs: [
          "Marketing opt-outs do not stop service, billing, security, legal, support, account, renewal, payment, invoice, or operational communications. These messages are required to administer accounts and services.",
          "Examples include order updates, provisioning questions, payment confirmations, renewal notices, support replies, security alerts, policy updates, and account access messages.",
        ],
      },
      {
        heading: "Consent and Preferences",
        paragraphs: [
          "Where consent or a subscription preference is required, ElevenOrbits will use the contact details and preferences available to us to manage marketing communications. You should only submit contact details that you are authorized to provide.",
          "If your organization gives ElevenOrbits a shared inbox, role-based address, or employee contact list, your organization is responsible for making sure it has the right to share those contacts for the requested business purpose.",
        ],
      },
      {
        heading: "Opt-Out Requests",
        paragraphs: [
          "You may ask ElevenOrbits to stop sending marketing communications. We will process opt-out requests within a reasonable time, but you may still receive messages already in progress or non-marketing communications needed for active services.",
          `Marketing preference requests can be sent to ${siteConfig.generalEmail}.`,
        ],
      },
      {
        heading: "Promotions and Offers",
        paragraphs: [
          "Promotional offers may be limited by eligibility, geography, account status, service availability, billing cycle, duration, or other conditions stated with the offer. ElevenOrbits may modify or withdraw promotions where permitted by law.",
          "A promotion does not change existing contracts, invoices, renewals, taxes, third-party charges, or service obligations unless ElevenOrbits confirms the change in writing.",
        ],
      },
    ],
  },
  {
    slug: "security-policy",
    title: "Security Policy",
    navLabel: "Security",
    description:
      "Security expectations for ElevenOrbits accounts, managed services, credentials, customer environments, and incident reporting.",
    sections: [
      {
        heading: "Shared Security Responsibilities",
        paragraphs: [
          "ElevenOrbits uses administrative, technical, and operational controls designed to protect the website, portal, managed services, support workflows, and customer records. Security is shared between ElevenOrbits, customers, vendors, and users.",
          "Customers are responsible for accurate account access, authorized users, secure devices, safe handling of credentials, workload configuration choices, and timely reporting of suspected compromise.",
        ],
      },
      {
        heading: "Credentials and Access",
        paragraphs: [
          "Do not send passwords, private keys, recovery codes, full card numbers, or sensitive secrets through ordinary email, public forms, screenshots, or support messages unless ElevenOrbits specifically instructs you to use an approved secure channel.",
          "ElevenOrbits may rotate, revoke, or reset credentials where needed for provisioning, handoff, incident response, account protection, employee offboarding, or platform security.",
        ],
      },
      {
        heading: "Security Events",
        paragraphs: [
          "If ElevenOrbits identifies a security event affecting services, we may investigate, preserve records, restrict access, suspend affected systems, contact customers, coordinate with vendors, or take other steps needed to protect the platform.",
          "Customer response may be required to validate ownership, rotate secrets, update software, remove vulnerable content, or approve remediation work.",
        ],
      },
      {
        heading: "Reporting Security Issues",
        paragraphs: [
          `Security concerns, suspected account compromise, or vulnerability reports should be sent to ${siteConfig.securityEmail}. Active customer emergencies can also be raised through support at ${siteConfig.supportEmail}.`,
          "Please include affected domains, IP addresses, account emails, timestamps, evidence, reproduction steps where appropriate, and a safe contact method.",
        ],
      },
    ],
  },
  {
    slug: "data-processing-policy",
    title: "Data Processing Policy",
    navLabel: "Data Processing",
    description:
      "How customer data, service data, support data, billing records, and operational data may be processed while ElevenOrbits provides managed services.",
    sections: [
      {
        heading: "Processing Roles",
        paragraphs: [
          "Depending on the service and the data involved, ElevenOrbits may act as an independent business operator, service provider, processor, or managed technical operator. The exact role may depend on the customer instructions, the services ordered, and any written agreement in place.",
          "Customers are responsible for determining whether their workloads require special data protection terms, regulated hosting, regional processing limits, or additional contractual safeguards before submitting data or ordering services.",
        ],
      },
      {
        heading: "Customer Data",
        paragraphs: [
          "Customer data may include files, databases, configuration details, application content, support attachments, deployment notes, user records, logs, credentials provided for setup, and other materials submitted by or on behalf of the customer.",
          "ElevenOrbits processes customer data as needed to provide, secure, troubleshoot, support, bill, maintain, migrate, back up, or improve the requested services.",
        ],
      },
      {
        heading: "Subprocessors and Vendors",
        paragraphs: [
          "ElevenOrbits may use infrastructure providers, authentication providers, payment processors, communication tools, storage providers, monitoring tools, security vendors, and professional service providers to deliver the services.",
          "These providers may process information as needed for hosting, authentication, payment, support, security, logging, email delivery, or operational administration.",
        ],
      },
      {
        heading: "Restricted Data",
        paragraphs: [
          "Do not submit health records, payment card numbers, government identifiers, regulated financial data, export-controlled data, or other sensitive regulated data unless ElevenOrbits has agreed in writing that the relevant service is suitable for that data.",
          "If you need additional data protection terms, contact ElevenOrbits before provisioning or uploading regulated data.",
        ],
      },
      {
        heading: "Requests and Deletion",
        paragraphs: [
          `Questions about data processing, deletion, export, or records can be sent to ${siteConfig.generalEmail}. Some records may be retained for billing, security, compliance, dispute resolution, abuse prevention, or legitimate business purposes.`,
        ],
      },
    ],
  },
  {
    slug: "service-level-policy",
    title: "Service Level & Support Policy",
    navLabel: "Service Levels",
    description:
      "How ElevenOrbits handles support, response expectations, maintenance, availability, incident work, and managed service coordination.",
    sections: [
      {
        heading: "Support Scope",
        paragraphs: [
          "ElevenOrbits support covers active customer accounts, ordered services, billing questions, provisioning coordination, managed infrastructure operations, approved add-ons, and issues submitted through official support channels.",
          "Support scope depends on the purchased plan, service category, active subscription status, customer instructions, and any written agreement between ElevenOrbits and the customer.",
        ],
      },
      {
        heading: "Response Expectations",
        paragraphs: [
          "ElevenOrbits aims to respond to support requests in a commercially reasonable manner based on severity, plan level, queue volume, account status, and available information. Unless a written agreement provides a specific SLA, response times are targets and not guaranteed service credits.",
          "Customers should provide complete details, affected services, timestamps, error messages, recent changes, screenshots where safe, and business impact so the team can prioritize correctly.",
        ],
      },
      {
        heading: "Maintenance and Changes",
        paragraphs: [
          "Maintenance, upgrades, migrations, reboots, security remediation, vendor work, network changes, and emergency fixes may be required to keep services stable and secure.",
          "Where practical, ElevenOrbits will coordinate planned work with affected customers. Emergency maintenance may occur without advance notice when required for security, availability, or platform integrity.",
        ],
      },
      {
        heading: "Exclusions",
        paragraphs: [
          "Support does not include unrelated third-party application development, unsupported software, customer-created vulnerabilities, unlawful content, unmanaged systems, custom engineering outside the service scope, or work that requires additional paid engagement.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Support requests can be opened through the customer portal or by contacting ${siteConfig.supportEmail}.`],
      },
    ],
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    navLabel: "Cancellations",
    description:
      "How cancellations, non-renewals, service decommissioning, data export, and access removal are handled for ElevenOrbits services.",
    sections: [
      {
        heading: "Cancellation Requests",
        paragraphs: [
          "Customers may request cancellation through the portal or official support channels. The request should identify the account, service, subscription, desired effective date, and any data export or handoff requirements.",
          "ElevenOrbits may verify account authority before processing cancellation, especially for services involving credentials, infrastructure, billing, data, or access removal.",
        ],
      },
      {
        heading: "Effective Date",
        paragraphs: [
          "Unless ElevenOrbits agrees otherwise in writing, cancellation affects future renewals after processing and does not automatically refund the current service period, setup work, third-party costs, or completed operational work.",
          "Some services may require decommissioning steps, vendor cancellation windows, license termination dates, backup handling, domain or DNS coordination, or infrastructure teardown before the service is fully closed.",
        ],
      },
      {
        heading: "Customer Data and Handoff",
        paragraphs: [
          "Customers are responsible for requesting data export, migration assistance, credential handoff, DNS changes, or service transition support before cancellation is completed. Additional work may require separate fees.",
          "After cancellation, access may be disabled and data may be deleted or archived according to operational, legal, billing, security, and backup retention practices.",
        ],
      },
      {
        heading: "Unpaid Amounts",
        paragraphs: [
          "Cancellation does not remove unpaid invoices, payment obligations, chargeback reviews, third-party costs, taxes, or fees already incurred. ElevenOrbits may apply wallet balances or request payment for open amounts.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Cancellation and billing questions can be sent to ${siteConfig.billingEmail}. Service handoff questions can be sent to ${siteConfig.supportEmail}.`],
      },
    ],
  },
  {
    slug: "third-party-services-policy",
    title: "Third-Party Services Policy",
    navLabel: "Third Parties",
    description:
      "How third-party platforms, licenses, vendors, integrations, infrastructure providers, and payment systems affect ElevenOrbits services.",
    sections: [
      {
        heading: "Third-Party Dependencies",
        paragraphs: [
          "ElevenOrbits services may depend on third-party infrastructure providers, operating systems, control panels, payment processors, authentication platforms, monitoring tools, software vendors, email providers, APIs, registrars, and other services.",
          "Availability, pricing, licensing, features, limits, security behavior, and terms for third-party services may change outside ElevenOrbits control.",
        ],
      },
      {
        heading: "Licenses and Customer Duties",
        paragraphs: [
          "Some services require software licenses, subscriptions, vendor approvals, or usage rights. Customers must provide accurate information and comply with applicable third-party terms when their workloads use those products.",
          "If a vendor changes pricing, terms, licensing, availability, or support status, ElevenOrbits may update service pricing, replace components, request customer action, or discontinue affected options where necessary.",
        ],
      },
      {
        heading: "Integrations and APIs",
        paragraphs: [
          "When customers ask ElevenOrbits to connect systems, APIs, payment tools, automation platforms, AI services, or communications services, the customer is responsible for having the required permissions, API rights, credentials, and data processing authority.",
          "Third-party outages, rate limits, account suspensions, API changes, or vendor restrictions may affect service performance and are not always within ElevenOrbits control.",
        ],
      },
      {
        heading: "Payment Providers",
        paragraphs: [
          "Payments, card storage, refunds, chargebacks, manual transfers, and wallet funding may depend on banks, card networks, payment processors, or transfer providers. Processing times, fees, reversals, and availability can vary by provider and region.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Questions about vendor requirements, licensing, or integrations can be sent to ${siteConfig.salesEmail} or the relevant department contact listed on the Contact page.`],
      },
    ],
  },
];

export function getLegalPage(slug) {
  return legalPages.find((page) => page.slug === slug) || null;
}
