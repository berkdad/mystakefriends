import React from 'react';
import { Heart, Shield, Lock, Eye, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
              <p className="text-sm text-gray-500">Privacy Policy</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md border border-rose-100 p-8">
          {/* Introduction */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-rose-500" />
              <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
            </div>
            <p className="text-gray-600 mb-2">
              <strong>Effective Date:</strong> October 19, 2025
            </p>
            <p className="text-gray-600">
              My Stake Friends ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our application.
            </p>
          </div>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">1. Information We Collect</h3>
            </div>

            <div className="ml-7 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
                <p className="text-gray-600 mb-2">
                  We collect information that you voluntarily provide to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Physical address</li>
                  <li>Date of birth</li>
                  <li>Marital status</li>
                  <li>Family information (number of children)</li>
                  <li>Cultural background</li>
                  <li>Profile pictures</li>
                  <li>Interests and hobbies</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Account Information</h4>
                <p className="text-gray-600">
                  When you create an account, we collect your email address and encrypted password.
                  We also track login activity and account status.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Usage Information</h4>
                <p className="text-gray-600">
                  We automatically collect certain information about your device and how you
                  interact with our application, including access times and feature usage.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">2. How We Use Your Information</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600 mb-2">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Facilitate community connections within your religious organization</li>
                <li>Create and manage friendship circles</li>
                <li>Enable members to find and connect with others who share similar interests</li>
                <li>Send account-related notifications and invitations</li>
                <li>Provide administrative tools for stake and ward leaders</li>
                <li>Maintain and improve our application</li>
                <li>Ensure the security and integrity of our services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">3. Information Sharing and Disclosure</h3>
            </div>

            <div className="ml-7 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Within Your Organization</h4>
                <p className="text-gray-600">
                  Your profile information is visible to other members within your stake and ward
                  to facilitate meaningful connections. Administrators (stake and ward leaders)
                  have access to member information for organizational purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Service Providers</h4>
                <p className="text-gray-600">
                  We use Firebase (Google Cloud Platform) to host our application and store data.
                  These service providers are bound by confidentiality obligations and may only
                  use your information to provide services to us.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Legal Requirements</h4>
                <p className="text-gray-600">
                  We may disclose your information if required by law or in response to valid
                  legal requests from public authorities.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">What We Don't Do</h4>
                <p className="text-gray-600">
                  We do not sell, rent, or trade your personal information to third parties for
                  marketing purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">4. Data Security</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600 mb-2">
                We implement appropriate technical and organizational measures to protect your
                personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication using Firebase Authentication</li>
                <li>Regular security assessments</li>
                <li>Access controls limiting who can view your information</li>
              </ul>
              <p className="text-gray-600 mt-2">
                However, no method of transmission over the internet or electronic storage is
                100% secure. While we strive to protect your information, we cannot guarantee
                absolute security.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">5. Your Rights and Choices</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600 mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Access and update your personal information through your account settings</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent where we rely on consent as our legal basis for processing</li>
              </ul>
              <p className="text-gray-600 mt-2">
                To exercise these rights, please contact your ward or stake administrator, or
                reach out to us directly at the contact information below.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">6. Data Retention</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600">
                We retain your personal information for as long as your account is active or as
                needed to provide you services. If you request account deletion, we will delete
                your information within 30 days, except where we are required to retain it for
                legal or legitimate business purposes.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">7. Children's Privacy</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600">
                Our application is intended for use by adults (18 years and older). We do not
                knowingly collect personal information from children under 18. If we become aware
                that we have collected information from a child under 18, we will take steps to
                delete that information.
              </p>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">8. Changes to This Privacy Policy</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Effective
                Date" at the top. You are advised to review this Privacy Policy periodically for
                any changes.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-gray-800">9. Contact Us</h3>
            </div>

            <div className="ml-7">
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices,
                please contact us at:
              </p>
              <div className="bg-rose-50 p-4 rounded-lg">
                <p className="text-gray-800 font-medium">My Stake Friends</p>
                <p className="text-gray-600">Email: privacy@mystakefriends.com</p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              By using My Stake Friends, you acknowledge that you have read and understood this
              Privacy Policy and agree to its terms.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
        <p>© 2025 My Stake Friends. All rights reserved.</p>
      </footer>
    </div>
  );
}