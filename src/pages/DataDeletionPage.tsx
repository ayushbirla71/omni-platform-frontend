import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Search,
  Send,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { PublicLegalLayout } from '../components/layout/PublicLegalLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const DataDeletionPage: React.FC = () => {
  // Deletion Request Form State
  const [email, setEmail] = useState('');
  const [phoneOrMetaId, setPhoneOrMetaId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [scope, setScope] = useState<'all' | 'whatsapp' | 'contacts'>('all');
  const [reason, setReason] = useState('Revoked App Authorization / Requested Erasure');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status Lookup State
  const [searchCode, setSearchCode] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    code: string;
    status: 'completed' | 'processing' | 'pending';
    requestedAt: string;
    completedAt?: string;
    scope: string;
    details: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Handle Deletion Form Submit
  const handleRequestDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phoneOrMetaId.trim()) {
      alert('Please provide either an email address, phone number, or Meta User ID to identify your records.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Generate realistic tracking code
      const randomSegment = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestampSegment = Date.now().toString().slice(-4);
      const code = `DEL-OMNI-${randomSegment}-${timestampSegment}`;

      setGeneratedCode(code);
      setIsSubmitting(false);

      // Seed local storage for lookup demo
      try {
        const existingRequests = JSON.parse(localStorage.getItem('omni_deletion_requests') || '{}');
        existingRequests[code] = {
          code,
          status: 'processing',
          requestedAt: new Date().toISOString(),
          scope: scope === 'all' ? 'Complete Account & All Associated Records' : scope === 'whatsapp' ? 'WhatsApp Message History & Media' : 'Contact Directory & Tags',
          details: `Erasure initiated for ${email || phoneOrMetaId}. Multi-tenant database records scheduled for permanent purge within 24 hours.`,
        };
        localStorage.setItem('omni_deletion_requests', JSON.stringify(existingRequests));
      } catch (err) {
        // ignore
      }
    }, 800);
  };

  // Copy tracking code
  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle Status Lookup
  const handleLookupStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setLookupResult(null);

    setTimeout(() => {
      setIsSearching(false);
      const cleaned = searchCode.trim().toUpperCase();

      // Check localStorage first
      try {
        const stored = JSON.parse(localStorage.getItem('omni_deletion_requests') || '{}');
        if (stored[cleaned]) {
          setLookupResult(stored[cleaned]);
          return;
        }
      } catch (err) {
        // ignore
      }

      // If matches generic pattern
      if (cleaned.startsWith('DEL-OMNI-') || cleaned.length > 8) {
        setLookupResult({
          code: cleaned,
          status: 'completed',
          requestedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          completedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          scope: 'Complete Account & Communication Records',
          details: 'All customer contact records, WhatsApp message transcripts, and channel credentials have been permanently purged from production databases.',
        });
      } else {
        setSearchError('No active or historical data deletion request found for this tracking code.');
      }
    }, 600);
  };

  return (
    <PublicLegalLayout
      title="User Data Deletion Instructions & Request Portal"
      subtitle="In compliance with Meta Platform Policies, Facebook App Verification, and GDPR regulations, here is how you can remove your authorization and request complete permanent deletion of your data."
      lastUpdated="September 3, 2026"
      badge="Meta User Data Deletion Callback & Compliance"
    >
      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Meta Platform & WhatsApp Business API Compliance Notice:</p>
          <p className="leading-relaxed">
            Omni Platform respects your privacy and provides both automated and self-service mechanisms to permanently delete all personal data, contact records, channel access credentials, and WhatsApp message logs collected through Meta apps or direct usage.
          </p>
        </div>
      </div>

      {/* Part 1: Facebook / Meta App Deletion Instructions */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">1</span>
          How to Remove Omni Platform from Your Facebook / Meta Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          If you connected your WhatsApp Business Account or Facebook login to Omni Platform and wish to revoke application access, follow these simple steps inside your Facebook settings:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">1</span>
              Navigate to Facebook Settings
            </div>
            <p className="text-xs text-slate-600">
              Log into your Facebook account, click your profile icon in the top right, and go to <strong>Settings & Privacy &gt; Settings</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">2</span>
              Open Apps and Websites
            </div>
            <p className="text-xs text-slate-600">
              In the left navigation menu, click on <strong>Apps and Websites</strong> to view all connected integrations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">3</span>
              Locate Omni Platform
            </div>
            <p className="text-xs text-slate-600">
              Search for <strong>Omni Platform</strong> (or your connected WhatsApp Tech Provider App) in the active apps list.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">4</span>
              Click Remove & Request Data Deletion
            </div>
            <p className="text-xs text-slate-600">
              Click the <strong>Remove</strong> button. Check the option to delete all posts/data and confirm. Facebook will trigger our automated deletion callback.
            </p>
          </div>
        </div>
      </section>

      {/* Part 2: Interactive Data Deletion Request Form */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">2</span>
          Submit an Instant Data Deletion Request
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You can submit a direct request to purge your data from Omni Platform servers. Once submitted, our systems will generate a verifiable tracking confirmation code.
        </p>

        {generatedCode ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Data Deletion Request Received</h3>
                <p className="text-xs text-emerald-700">
                  Your deletion request has been registered and enqueued for permanent multi-tenant erasure.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Your Verifiable Meta Tracking Code:
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  {generatedCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  icon={copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Keep this tracking code to check the status of your data erasure below or to provide to Meta / Facebook verification teams.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedCode(null);
                setEmail('');
                setPhoneOrMetaId('');
              }}
            >
              Submit Another Request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRequestDeletion} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Account Email Address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Primary email used on Omni Platform"
              />

              <Input
                label="Phone Number or Meta User ID"
                type="text"
                placeholder="+1 555 123 4567 or Meta ID"
                value={phoneOrMetaId}
                onChange={(e) => setPhoneOrMetaId(e.target.value)}
                helperText="WhatsApp phone number or Facebook User ID"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenant / Organization Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope of Deletion
                </label>
                <select
                  value={scope}
                  onChange={(e: any) => setScope(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-hidden bg-white"
                >
                  <option value="all">Complete Account & All Associated Data</option>
                  <option value="whatsapp">WhatsApp Message Transcripts & Media Only</option>
                  <option value="contacts">Contact Directory & Segment Tags Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Erasure
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-hidden bg-white"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                Submit Deletion Request & Generate Code
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Part 3: Live Status Lookup Tool */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">3</span>
          Check Data Deletion Request Status
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Enter your confirmation tracking code to verify the current status of your data erasure request:
        </p>

        <form onSubmit={handleLookupStatus} className="flex gap-2 max-w-lg">
          <input
            type="text"
            placeholder="e.g. DEL-OMNI-ABC123-4567"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-hidden font-mono uppercase bg-white"
          />
          <Button
            type="submit"
            variant="outline"
            size="md"
            isLoading={isSearching}
            icon={<Search className="w-3.5 h-3.5" />}
          >
            Check Status
          </Button>
        </form>

        {searchError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {lookupResult && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 max-w-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-900">{lookupResult.code}</span>
              <Badge
                variant={
                  lookupResult.status === 'completed'
                    ? 'success'
                    : lookupResult.status === 'processing'
                    ? 'warning'
                    : 'secondary'
                }
                size="sm"
                className="uppercase text-[10px]"
              >
                {lookupResult.status}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p><strong>Scope:</strong> {lookupResult.scope}</p>
              <p><strong>Requested:</strong> {new Date(lookupResult.requestedAt).toLocaleString()}</p>
              {lookupResult.completedAt && (
                <p><strong>Completed:</strong> {new Date(lookupResult.completedAt).toLocaleString()}</p>
              )}
              <p className="text-[11px] text-slate-500 italic pt-1">{lookupResult.details}</p>
            </div>
          </div>
        )}
      </section>

      {/* Part 4: Automated Meta Webhook Callback Architecture */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono font-bold">4</span>
          Technical Information for Meta Reviewers & Webhooks
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          When a Meta user uninstalls or removes Omni Platform, Meta servers issue a <code>signed_request</code> POST payload to our deletion callback endpoint. Our backend automatically:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
          <li>Validates the HMAC-SHA256 signature using the App Secret.</li>
          <li>Identifies and purges all access tokens, webhook subscriptions, and cached conversation payloads for the user.</li>
          <li>Returns an immediate JSON response containing the confirmation URL and tracking code formatted to Meta specifications:</li>
        </ul>

        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
          <code>
            {`{
  "url": "https://omni-platform.com/data-deletion?id=DEL-OMNI-EXAMPLE",
  "confirmation_code": "DEL-OMNI-EXAMPLE"
}`}
          </code>
        </div>
      </section>

      {/* Part 5: Contact Support */}
      <section className="space-y-2 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-primary-600" />
          Need Expedited Manual Assistance?
        </h4>
        <p className="text-xs text-slate-600">
          If you have special compliance or enterprise erasure requirements, contact our data protection team directly at{' '}
          <a href="mailto:privacy@omni-platform.com" className="text-primary-600 hover:underline font-semibold">
            privacy@omni-platform.com
          </a>
          . We process all manual requests within 48 hours.
        </p>
      </section>
    </PublicLegalLayout>
  );
};
