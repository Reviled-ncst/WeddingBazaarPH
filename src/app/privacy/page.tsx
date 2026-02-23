import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-dark-400">Last updated: February 24, 2026</p>
        </div>

        <Card className="p-8 md:p-12 prose prose-invert prose-pink max-w-none">
          <h2 className="text-white">1. Information We Collect</h2>
          <p className="text-dark-300">We collect information you provide directly:</p>
          <ul className="text-dark-300">
            <li>Account information (name, email, phone)</li>
            <li>Profile information (wedding date, preferences)</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Communications with vendors and support</li>
          </ul>

          <h2 className="text-white">2. How We Use Your Information</h2>
          <p className="text-dark-300">We use your information to:</p>
          <ul className="text-dark-300">
            <li>Provide and improve our services</li>
            <li>Process bookings and payments</li>
            <li>Send relevant notifications and updates</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-white">3. Information Sharing</h2>
          <p className="text-dark-300">
            We share information with vendors when you make a booking. We do not sell your personal 
            information. We may share data with service providers who assist our operations.
          </p>

          <h2 className="text-white">4. Data Security</h2>
          <p className="text-dark-300">
            We implement industry-standard security measures to protect your data. However, no method 
            of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-white">5. Your Rights</h2>
          <p className="text-dark-300">You have the right to:</p>
          <ul className="text-dark-300">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2 className="text-white">6. Cookies</h2>
          <p className="text-dark-300">
            We use cookies to improve your experience, analyze usage, and provide personalized content. 
            You can control cookies through your browser settings.
          </p>

          <h2 className="text-white">7. Third-Party Links</h2>
          <p className="text-dark-300">
            Our platform may contain links to third-party websites. We are not responsible for their 
            privacy practices.
          </p>

          <h2 className="text-white">8. Children&apos;s Privacy</h2>
          <p className="text-dark-300">
            Our services are not intended for users under 18. We do not knowingly collect data from minors.
          </p>

          <h2 className="text-white">9. Contact Us</h2>
          <p className="text-dark-300">
            For privacy-related questions, contact us at privacy@weddingbazaar.ph
          </p>
        </Card>
      </div>
    </div>
  );
}
