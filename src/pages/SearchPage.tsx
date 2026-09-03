import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Users,
  Calendar,
  ArrowRight,
  Radio,
  Tag,
  Phone,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { searchApi } from '../api';
import type { SearchResults } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'contacts'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchApi.search(searchTerm.trim());
      setResults(data);
      setSearchParams({ q: searchTerm.trim() });
    } catch (err) {
      showToast('Search failed or Elasticsearch unavailable', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      handleSearch(queryParam);
    }
  }, [queryParam]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const totalMessages = results?.messages?.length || 0;
  const totalContacts = results?.contacts?.length || 0;
  const totalResults = totalMessages + totalContacts;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto pt-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-600" />
          Global Omnichannel Search
        </h1>
        <p className="text-xs text-gray-500">
          Search across chat transcripts, customer profiles, and contact details powered by Elasticsearch
        </p>
      </div>

      {/* Main Search Input */}
      <Card className="p-2 shadow-md">
        <form onSubmit={onFormSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords, messages, phone number, or contact name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border-0 focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading} icon={<Search className="w-4 h-4" />}>
            Search
          </Button>
        </form>
      </Card>

      {/* Tabs */}
      {results && (
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                activeTab === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All Results ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                activeTab === 'messages'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Messages ({totalMessages})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                activeTab === 'contacts'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Contacts ({totalContacts})
            </button>
          </div>

          <span className="text-xs text-gray-400">
            Showing results for <b>"{query}"</b>
          </span>
        </div>
      )}

      {/* Results Feed */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : !results ? (
        <div className="py-20 text-center text-gray-400 text-xs space-y-3">
          <Search className="w-12 h-12 mx-auto opacity-20 text-gray-500" />
          <p>Enter a query above to start searching messages and customer contacts.</p>
        </div>
      ) : totalResults === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Inbox className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="text-base font-bold text-gray-900">No matching results found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We couldn't find any messages or contacts matching "{query}". Try searching for different keywords.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Messages Section */}
          {(activeTab === 'all' || activeTab === 'messages') && totalMessages > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                Matching Messages ({totalMessages})
              </h2>

              <div className="space-y-3">
                {results.messages.map((msg, index) => (
                  <Card key={msg.id || index} hover className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={msg.direction === 'inbound' ? 'primary' : 'purple'} size="sm">
                          {msg.direction}
                        </Badge>
                        <span className="text-xs font-mono text-gray-400">ID: {msg.conversationId}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {msg.text}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <Link to={`/inbox?id=${msg.conversationId}`}>
                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Open in Inbox
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Contacts Section */}
          {(activeTab === 'all' || activeTab === 'contacts') && totalContacts > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                Matching Contacts ({totalContacts})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.contacts.map((contact, index) => (
                  <Card key={contact.id || index} hover className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs uppercase">
                        {contact.name ? contact.name.substring(0, 2) : 'CT'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{contact.name || 'Unnamed'}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{contact.externalId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <Badge variant="success" size="sm" className="capitalize">
                        {contact.channel || 'whatsapp'}
                      </Badge>

                      <Link to="/contacts">
                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-3 h-3" />}>
                          View Contact
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
