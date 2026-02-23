'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; faqs: FAQ[] }>('/public/faqs.php?limit=20');
        if (response.data?.faqs) {
          setFaqs(response.data.faqs);
        }
      } catch (err) {
        console.error('Failed to fetch FAQs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-dark-300">Find answers to common questions</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* FAQs */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
            </div>
          )}

          {/* FAQs List */}
          {!loading && (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div key={faq.id || index} className="border-b border-dark-700 last:border-0 pb-4 last:pb-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-white font-medium">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-pink-400 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dark-400 shrink-0 ml-4" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="mt-3">
                      {faq.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-pink-500/20 text-pink-300 rounded mb-2">
                          {faq.category}
                        </span>
                      )}
                      <p className="text-dark-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
              {filteredFaqs.length === 0 && !loading && (
                <p className="text-dark-400 text-center py-4">No results found. Try a different search term.</p>
              )}
            </div>
          )}
        </Card>

        {/* Contact Options */}
        <h2 className="text-xl font-semibold text-white mb-4">Still need help?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 text-center hover:border-pink-500/50 transition-colors cursor-pointer">
            <MessageCircle className="w-10 h-10 text-pink-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Live Chat</h3>
            <p className="text-dark-400 text-sm">Chat with our support team</p>
          </Card>
          <Card className="p-6 text-center hover:border-pink-500/50 transition-colors cursor-pointer">
            <Mail className="w-10 h-10 text-pink-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Email Us</h3>
            <p className="text-dark-400 text-sm">support@weddingbazaar.ph</p>
          </Card>
          <Card className="p-6 text-center hover:border-pink-500/50 transition-colors cursor-pointer">
            <Phone className="w-10 h-10 text-pink-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Call Us</h3>
            <p className="text-dark-400 text-sm">+63 917 123 4567</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
