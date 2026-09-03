import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Scale,
  Ban,
  Radio,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { PublicLegalLayout } from '../components/layout/PublicLegalLayout';

export const TermsPage: React.FC = () => {
  return (
    <PublicLegalLayout
      title="Terms of Service"
      subtitle="The binding terms and conditions governing the use of Omni Platform, WhatsApp Business Cloud API integrations, automated Flow Builder graphs, and broadcast services."
      lastUpdated="September 3, 2026"
      badge="Service Terms & Acceptable Use"
    >
      {/* Quick Summary Highlights */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-600" />
          Key Terms & WhatsApp Policy Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Opt-In Consent Required:</strong> You must have explicit consent from end-users before initiating WhatsApp template messages.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Meta Policy Compliance:</strong> All messaging must adhere strictly to the Meta Business Platform Terms and WhatsApp Business Messaging Policy.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Spam Tolerance:</strong> Sending unsolicited spam or prohibited content will result in immediate channel suspension.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Customer Data Ownership:</strong> You retain 100% full ownership and intellectual property of your contact lists and business data.
            </span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="border-y border-slate-100 py-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Table of Contents</h4>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-primary-600">
          <li><a href="#1-agreement" className="hover:underline">1. Agreement to Terms</a></li>
          <li><a href="#2-description-of-service" className="hover:underline">2. Description of Service</a></li>
          <li><a href="#3-account-security" className="hover:underline">3. Account Registration & Tenant Security</a></li>
          <li><a href="#4-whatsapp-compliance" className="hover:underline">4. WhatsApp Business Messaging Policy Compliance</a></li>
          <li><a href="#5-acceptable-use" className="hover:underline">5. Acceptable Use Policy & Prohibited Conduct</a></li>
          <li><a href="#6-meta-cloud-api" className="hover:underline">6. Meta Platforms & Third-Party Dependencies</a></li>
          <li><a href="#7-data-ownership" className="hover:underline">7. Data Ownership & Intellectual Property</a></li>
          <li><a href="#8-fees-billing" className="hover:underline">8. Fees, Subscriptions & Meta Conversation Charges</a></li>
          <li><a href="#9-sla-disclaimer" className="hover:underline">9. Disclaimers & Warranties</a></li>
          <li><a href="#10-limitation-liability" className="hover:underline">10. Limitation of Liability & Indemnification</a></li>
          <li><a href="#11-termination" className="hover:underline">11. Suspension & Termination</a></li>
          <li><a href="#12-governing-law" className="hover:underline">12. Governing Law & Contact</a></li>
        </ol>
      </div>

      {/* Section 1 */}
      <section id="1-agreement" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">1</span>
          Agreement to Terms
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer", "Client", or "You") and Omni Platform ("we", "us", or "our") concerning your access to and use of the Omni Platform website, software application, APIs, and communication services.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          By registering for an account, accessing the application, or utilizing any automated messaging or API services, you expressly agree to be bound by all of these Terms and our <Link to="/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link>. If you do not agree with all of these Terms, you are prohibited from using the platform.
        </p>
      </section>

      {/* Section 2 */}
      <section id="2-description-of-service" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">2</span>
          Description of Service
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Omni Platform provides a multi-tenant cloud software suite providing:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
          <li><strong>WhatsApp Business Platform Integration:</strong> Connecting WABA accounts, managing approved message templates, and handling Meta webhooks.</li>
          <li><strong>No-Code Visual Flow Builder:</strong> Designing stateful multi-step conversational bot graphs, handling interactive template buttons, and conditional routing.</li>
          <li><strong>Broadcast & Campaign Automation:</strong> Segmenting contacts using tags (e.g. <code>followup</code>, <code>vip</code>), dispatching automated broadcast campaigns, and scheduling drip sequences.</li>
          <li><strong>Unified Team Inbox & CRM:</strong> Centralized real-time conversation management, agent assignment, and pipeline deal tracking.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="3-account-security" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">3</span>
          Account Registration & Tenant Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You agree to provide accurate, current, and complete information during registration and to maintain the security of your account credentials. You are solely responsible for all activities that occur under your tenant account and must immediately notify Omni Platform of any unauthorized security breach or compromise of your Meta API credentials.
        </p>
      </section>

      {/* Section 4 */}
      <section id="4-whatsapp-compliance" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">4</span>
          WhatsApp Business Messaging Policy Compliance
        </h2>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            Mandatory Compliance Requirement for Meta & WhatsApp
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            As an Omni Platform user integrating with the WhatsApp Business Platform, you must strictly comply with all rules set forth by Meta Platforms, Inc., including the <strong>WhatsApp Business Terms of Service</strong>, <strong>WhatsApp Business Messaging Policy</strong>, and <strong>Meta Developer Policies</strong>.
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Specifically, you agree that:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
          <li><strong>Valid Opt-In:</strong> You will only message individuals who have provided explicit, affirmative opt-in consent to receive communications from your business on WhatsApp.</li>
          <li><strong>Opt-Out Mechanism:</strong> You must promptly honor opt-out requests (such as keywords like "STOP", "UNSUBSCRIBE", or interactive opt-out buttons) and immediately cease messaging unsubscribed contacts.</li>
          <li><strong>24-Hour Customer Care Window:</strong> Free-form messaging is restricted to the 24-hour customer service window initiated by the customer. Any business-initiated messages outside this window must use pre-approved Meta WhatsApp Message Templates.</li>
          <li><strong>Prohibited Industries:</strong> You will not promote or transmit content regarding illegal drugs, weapons, alcohol, adult content, gambling, predatory lending, or tobacco.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="5-acceptable-use" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">5</span>
          Acceptable Use Policy & Prohibited Conduct
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You may not use Omni Platform for any unlawful, fraudulent, or harmful purposes. You shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
            <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>Send unsolicited spam broadcasts or mass cold-outreach messaging.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
            <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>Harass, threaten, defraud, or impersonate any individual or entity.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
            <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>Attempt to reverse engineer, decompile, or breach multi-tenant security boundaries.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
            <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>Transmit malware, viruses, or malicious payloads through automated flows.</span>
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="6-meta-cloud-api" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">6</span>
          Meta Platforms & Third-Party Dependencies
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Omni Platform depends on third-party APIs provided by Meta Platforms, Inc. (WhatsApp Cloud API) and Telegram. You acknowledge that we are not responsible for:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 pl-2">
          <li>Downtime, rate limits, or service disruptions caused by Meta or Telegram infrastructure.</li>
          <li>Rejection or revocation of WhatsApp Message Templates by Meta review systems.</li>
          <li>Meta policy enforcement actions, WABA phone number tier restrictions, or account bans resulting from your messaging practices.</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="7-data-ownership" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">7</span>
          Data Ownership & Intellectual Property
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          <strong>Your Data:</strong> As between you and Omni Platform, you retain 100% of all right, title, and interest in and to your customer contact lists, uploaded spreadsheets, flow designs, and message contents.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          <strong>Our IP:</strong> Omni Platform and its underlying software, algorithms, flow execution engines, APIs, and documentation remain the exclusive property of Omni Platform and its licensors.
        </p>
      </section>

      {/* Section 8 */}
      <section id="8-fees-billing" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">8</span>
          Fees, Subscriptions & Meta Conversation Charges
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Clients are responsible for all subscription fees associated with their Omni Platform plan. Additionally, when utilizing the WhatsApp Cloud API, Clients remain directly responsible for any conversation-based charges billed by Meta Platforms according to official Meta pricing tiers.
        </p>
      </section>

      {/* Section 9 */}
      <section id="9-sla-disclaimer" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">9</span>
          Disclaimers & Warranties
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. OMNI PLATFORM DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
        </p>
      </section>

      {/* Section 10 */}
      <section id="10-limitation-liability" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">10</span>
          Limitation of Liability & Indemnification
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL OMNI PLATFORM BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, REVENUE, OR DATA.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You agree to defend, indemnify, and hold harmless Omni Platform and its officers from and against any claims, damages, liabilities, and expenses arising out of your violation of these Terms or the WhatsApp Business Messaging Policy.
        </p>
      </section>

      {/* Section 11 */}
      <section id="11-termination" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">11</span>
          Suspension & Termination
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We reserve the right to suspend or terminate your account immediately without prior notice if we have reason to believe that your usage violates Meta's WhatsApp policies, sends unsolicited spam, or threatens platform integrity. Upon termination, you may request permanent data deletion pursuant to our <Link to="/data-deletion" className="text-primary-600 hover:underline">User Data Deletion Policy</Link>.
        </p>
      </section>

      {/* Section 12 */}
      <section id="12-governing-law" className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">12</span>
          Governing Law & Contact
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          These Terms shall be governed by and construed in accordance with applicable laws without regard to conflict of law principles.
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
          <p><strong>Omni Platform Legal & Compliance Office</strong></p>
          <p>Email: <a href="mailto:legal@omni-platform.com" className="text-primary-600 hover:underline">legal@omni-platform.com</a></p>
          <p>Support & Inquiries: <a href="mailto:support@omni-platform.com" className="text-primary-600 hover:underline">support@omni-platform.com</a></p>
        </div>
      </section>
    </PublicLegalLayout>
  );
};
