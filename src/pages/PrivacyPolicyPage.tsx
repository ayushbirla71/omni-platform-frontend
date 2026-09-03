import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Database,
  Users,
  MessageSquare,
  Server,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Mail,
  FileCheck,
} from 'lucide-react';
import { PublicLegalLayout } from '../components/layout/PublicLegalLayout';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <PublicLegalLayout
      title="Privacy Policy"
      subtitle="Detailed privacy disclosures regarding how Omni Platform collects, processes, protects, and stores user data, WhatsApp Business API communications, and contact information."
      lastUpdated="September 3, 2026"
      badge="Meta Verified & GDPR Compliant"
    >
      {/* Quick Summary Highlights */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary-600" />
          Key Privacy Principles at a Glance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Meta / WhatsApp Integration:</strong> We utilize official WhatsApp Cloud APIs strictly for customer-initiated & consented business messaging.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Data Selling:</strong> We never sell, rent, or monetize your customer data, phone numbers, or message contents to third parties.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Multi-Tenant Isolation:</strong> All tenant databases, credentials, and contacts are strictly isolated with robust encryption at rest and in transit.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Full User Control & Deletion:</strong> You and your end-users can request full data deletion at any time via our automated portal.
            </span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="border-y border-slate-100 py-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Table of Contents</h4>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-primary-600">
          <li><a href="#1-introduction" className="hover:underline">1. Introduction & Scope</a></li>
          <li><a href="#2-information-we-collect" className="hover:underline">2. Information We Collect</a></li>
          <li><a href="#3-whatsapp-cloud-api" className="hover:underline">3. Meta & WhatsApp Cloud API Data Handling</a></li>
          <li><a href="#4-how-we-use-information" className="hover:underline">4. How We Use Information</a></li>
          <li><a href="#5-subprocessors" className="hover:underline">5. Third-Party Sub-Processors</a></li>
          <li><a href="#6-security-isolation" className="hover:underline">6. Security & Multi-Tenant Isolation</a></li>
          <li><a href="#7-retention-deletion" className="hover:underline">7. Data Retention & Deletion Schedules</a></li>
          <li><a href="#8-privacy-rights" className="hover:underline">8. Your Privacy Rights (GDPR & CCPA)</a></li>
          <li><a href="#9-data-deletion-requests" className="hover:underline">9. User Data Deletion Instructions</a></li>
          <li><a href="#10-contact-dpo" className="hover:underline">10. Contact Information & DPO</a></li>
        </ol>
      </div>

      {/* Section 1 */}
      <section id="1-introduction" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">1</span>
          Introduction & Scope
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Omni Platform ("we", "us", "our", or "the Platform") operates a multi-tenant omnichannel communication software service that empowers businesses ("Clients", "Tenants", or "Customers") to connect their communication channels—including the WhatsApp Business Platform via Meta Cloud API, Telegram, and others—to manage customer conversations, build visual automation flow graphs, manage CRM deals, and broadcast campaigns.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          This Privacy Policy describes how Omni Platform collects, uses, stores, and protects personal data when you access or use our platform, APIs, web applications, or when your end-users interact with our communication services. By creating an account or integrating your WhatsApp Business Account (WABA), you acknowledge that you have read, understood, and agreed to this Privacy Policy.
        </p>
      </section>

      {/* Section 2 */}
      <section id="2-information-we-collect" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">2</span>
          Information We Collect
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We collect information in three categories to deliver and maintain our communication services:
        </p>

        <div className="space-y-3 pl-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-600" />
              A. Client Account Information (Data Controller: Client)
            </h4>
            <p className="text-xs text-slate-600">
              When a business creates an Omni Platform account, we collect: business/tenant name, administrator name, work email address, hashed passwords, billing identifiers, and role-based access configurations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              B. Channel Credentials & Integration Metadata
            </h4>
            <p className="text-xs text-slate-600">
              When a Client connects a messaging channel (e.g., via Meta Embedded Signup or token configuration), we securely store: Meta WhatsApp Business Account ID (WABA ID), Phone Number ID, App ID, Meta System User Access Tokens (encrypted with AES-256 at rest), webhook verification tokens, and channel status flags.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              C. Contact Data & Message Transmissions (Data Processor)
            </h4>
            <p className="text-xs text-slate-600">
              To route conversations, automate workflows, and send authorized broadcasts, we process: recipient phone numbers, contact names, email addresses, contact tags (e.g. segmentation tags like <code>followup</code>, <code>lead</code>, <code>vip</code>), message content (text, button payload clicks, interactive replies), delivery status receipts (sent, delivered, read, failed), and flow builder execution states.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="3-whatsapp-cloud-api" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">3</span>
          Meta & WhatsApp Cloud API Data Handling
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          As a Tech Provider integrating with Meta Platforms, Inc., Omni Platform strictly adheres to the <strong>Meta Business Platform Terms</strong> and <strong>WhatsApp Business Messaging Policy</strong>:
        </p>

        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
          <li>
            <strong>Consent & Opt-in:</strong> Clients are legally required to obtain prior affirmative opt-in consent from end-users before initiating WhatsApp template broadcast campaigns.
          </li>
          <li>
            <strong>Template Approval:</strong> Broadcast messages to recipients outside the 24-hour customer service window must use pre-approved Meta WhatsApp Message Templates.
          </li>
          <li>
            <strong>Webhook Payload Processing:</strong> Inbound WhatsApp messages, interactive button selections, and delivery status updates received from Meta webhooks are processed in real time and stored securely in the Client's isolated tenant database.
          </li>
          <li>
            <strong>No Prohibited Categories:</strong> Omni Platform prohibits using WhatsApp APIs for illegal activities, unsolicited spam, payday loans, gambling, firearms, or harmful content as governed by Meta's acceptable use policies.
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="4-how-we-use-information" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">4</span>
          How We Use Information
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We use collected data solely for the following legitimate business purposes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h5 className="font-bold text-slate-800 mb-1">Delivering Messaging Services</h5>
            <p>Sending and receiving customer messages across WhatsApp, Telegram, and other configured channels.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h5 className="font-bold text-slate-800 mb-1">Flow Automation</h5>
            <p>Executing visual Flow Builder logic graphs, routing user responses, triggering buttons, and setting contact tags.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h5 className="font-bold text-slate-800 mb-1">Campaign Orchestration</h5>
            <p>Dispatching authorized broadcast messages, managing drip sequences, and tracking delivery analytics.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h5 className="font-bold text-slate-800 mb-1">Platform Security & Audit</h5>
            <p>Preventing unauthorized access, enforcing tenant isolation, monitoring error rates, and maintaining audit logs.</p>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="5-subprocessors" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">5</span>
          Third-Party Sub-Processors & Data Sharing
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We engage select, vetted third-party sub-processors to assist in delivering our infrastructure. Each sub-processor is bound by strict Data Processing Agreements (DPAs) requiring enterprise-level data protection:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="p-2.5 border-b border-slate-200">Sub-Processor</th>
                <th className="p-2.5 border-b border-slate-200">Purpose</th>
                <th className="p-2.5 border-b border-slate-200">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Meta Platforms, Inc. / Meta Platforms Ireland Ltd.</td>
                <td className="p-2.5">WhatsApp Cloud API & Graph API messaging gateway</td>
                <td className="p-2.5">USA / Ireland (EU)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">PostgreSQL Cloud Hosting</td>
                <td className="p-2.5">Encrypted multi-tenant database & contact record storage</td>
                <td className="p-2.5">USA / EU Regions</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Redis Cloud Cache & BullMQ</td>
                <td className="p-2.5">Delayed campaign scheduling, rate-limiting, and queue processing</td>
                <td className="p-2.5">USA / EU Regions</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Telegram Bot API</td>
                <td className="p-2.5">Telegram messaging channel routing (when configured)</td>
                <td className="p-2.5">Global / EU</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6 */}
      <section id="6-security-isolation" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">6</span>
          Security & Multi-Tenant Isolation
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We implement defense-in-depth technical and organizational security controls to protect all data against unauthorized access, destruction, loss, or alteration:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <Lock className="w-4 h-4 text-emerald-600 mb-1.5" />
            <h5 className="font-bold text-slate-900 mb-1">AES-256 Encryption</h5>
            <p>All sensitive channel credentials, Meta access tokens, and webhook secrets are encrypted at rest using industry-standard AES-256-GCM.</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <Server className="w-4 h-4 text-primary-600 mb-1.5" />
            <h5 className="font-bold text-slate-900 mb-1">Multi-Tenant Scoping</h5>
            <p>Every SQL query and database transaction enforces strict tenant isolation via indexed <code>tenant_id</code> keys, preventing cross-tenant data leakage.</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <Shield className="w-4 h-4 text-indigo-600 mb-1.5" />
            <h5 className="font-bold text-slate-900 mb-1">TLS 1.3 in Transit</h5>
            <p>All client connections, Webhooks from Meta, and outbound API calls use mandatory TLS 1.3 / HTTPS encryption.</p>
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="7-retention-deletion" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">7</span>
          Data Retention & Deletion Schedules
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We retain personal data only for as long as necessary to provide the services requested by Clients or to comply with legal obligations:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
          <li><strong>Active Account Data:</strong> Retained for the duration of the Client's active subscription.</li>
          <li><strong>Message Transcripts & Logs:</strong> Retained for up to 90 days after delivery or as configured in Client data retention settings.</li>
          <li><strong>Terminated Accounts:</strong> Following account closure, all tenant data, contacts, and tokens are permanently purged within 30 days.</li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="8-privacy-rights" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">8</span>
          Your Privacy Rights (GDPR & CCPA)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Under applicable data protection laws (including the European General Data Protection Regulation and California Consumer Privacy Act), you possess the following statutory rights:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Access:</strong> Request a copy of all personal data held about you.</div>
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete records.</div>
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Erasure:</strong> Request permanent deletion of personal records ("Right to be Forgotten").</div>
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Restrict Processing:</strong> Request suspension of certain automated data processing.</div>
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Data Portability:</strong> Obtain your data in a structured, machine-readable CSV/JSON format.</div>
          <div className="p-2.5 bg-slate-50 rounded-lg"><strong>Right to Opt-Out:</strong> Opt-out of any marketing communications at any time.</div>
        </div>
      </section>

      {/* Section 9 */}
      <section id="9-data-deletion-requests" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">9</span>
          Meta User Data Deletion Instructions & Request Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          In compliance with Meta Platform Policy and Facebook App Verification guidelines, users whose data was processed through an integrated Meta App or WhatsApp Business API have the right to request the deletion of all data associated with their Meta account.
        </p>
        <div className="p-4 rounded-xl bg-primary-50/70 border border-primary-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-primary-900 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-primary-700" />
              Meta User Data Deletion Request & Callback Portal
            </h4>
            <p className="text-xs text-primary-700">
              Submit an interactive data erasure request and receive a verifiable tracking confirmation code.
            </p>
          </div>
          <Link
            to="/data-deletion"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors shrink-0 shadow-xs"
          >
            Access Data Deletion Instructions →
          </Link>
        </div>
      </section>

      {/* Section 10 */}
      <section id="10-contact-dpo" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">10</span>
          Contact Information & Data Protection Officer (DPO)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          If you have any questions, concerns, or requests regarding this Privacy Policy or wish to exercise your legal privacy rights, please contact our dedicated Data Protection team:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
          <p><strong>Omni Platform Privacy & Compliance Team</strong></p>
          <p>Data Protection Officer (DPO): <a href="mailto:dpo@omni-platform.com" className="text-primary-600 hover:underline">dpo@omni-platform.com</a></p>
          <p>General Privacy Inquiries: <a href="mailto:privacy@omni-platform.com" className="text-primary-600 hover:underline">privacy@omni-platform.com</a></p>
          <p>Response Time: All formal privacy and deletion requests are addressed within 48 business hours.</p>
        </div>
      </section>
    </PublicLegalLayout>
  );
};
