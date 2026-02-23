import { Card } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-dark-400">Last updated: February 24, 2026</p>
        </div>

        <Card className="p-8 md:p-12 prose prose-invert prose-pink max-w-none">
          <h2 className="text-white">1. Acceptance of Terms</h2>
          <p className="text-dark-300">
            By accessing and using Wedding Bazaar, you accept and agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-white">2. Description of Service</h2>
          <p className="text-dark-300">
            Wedding Bazaar provides an online platform connecting couples with wedding service providers. 
            We facilitate bookings, payments, and communications between parties but are not responsible 
            for the actual wedding services provided by vendors.
          </p>

          <h2 className="text-white">3. User Accounts</h2>
          <p className="text-dark-300">
            You must create an account to use certain features. You are responsible for maintaining the 
            confidentiality of your account credentials and for all activities under your account.
          </p>

          <h2 className="text-white">4. Vendor Responsibilities</h2>
          <p className="text-dark-300">
            Vendors are independent contractors and not employees of Wedding Bazaar. Vendors are solely 
            responsible for their services, pricing, and compliance with local laws and regulations.
          </p>

          <h2 className="text-white">5. Payments and Refunds</h2>
          <p className="text-dark-300">
            Payments are processed securely through our payment partners. Refund policies are set by 
            individual vendors. Wedding Bazaar may charge service fees as disclosed during booking.
          </p>

          <h2 className="text-white">6. Prohibited Conduct</h2>
          <ul className="text-dark-300">
            <li>Fraudulent or misleading information</li>
            <li>Harassment or abuse of other users</li>
            <li>Circumventing platform fees</li>
            <li>Violating intellectual property rights</li>
          </ul>

          <h2 className="text-white">7. Limitation of Liability</h2>
          <p className="text-dark-300">
            Wedding Bazaar is not liable for any disputes between users and vendors, service quality, 
            or damages arising from the use of our platform beyond the fees paid to us.
          </p>

          <h2 className="text-white">8. Changes to Terms</h2>
          <p className="text-dark-300">
            We may update these terms at any time. Continued use of the platform after changes 
            constitutes acceptance of the new terms.
          </p>

          <h2 className="text-white">9. Contact</h2>
          <p className="text-dark-300">
            For questions about these Terms, contact us at legal@weddingbazaar.ph
          </p>
        </Card>
      </div>
    </div>
  );
}
