import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-700 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-zinc-300 space-y-6">
                    <p className="text-zinc-400 text-sm">
                        <strong>Effective Date:</strong> January 1, 2025
                    </p>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">1. Introduction</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Welcome to Klint Studios, a product operated by <strong>Growth Pathmapper Limited</strong> ("we," "our," or "us"). 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services. 
                            By accessing or using Klint Studios, you agree to the collection and use of information in accordance with this policy. 
                            If you do not agree with the terms of this Privacy Policy, please discontinue use of our services immediately.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            We may collect the following types of information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li><strong>Personal Information:</strong> Name, email address, billing information, and payment details (processed securely through Razorpay).</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our platform, including IP address, browser type, pages visited, and time spent on pages.</li>
                            <li><strong>Uploaded Content:</strong> Images, prompts, and any other content you upload to generate AI outputs.</li>
                            <li><strong>Device Information:</strong> Information about the device you use to access our services, including device type, operating system, and unique device identifiers.</li>
                            <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to enhance user experience and analyze usage patterns.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            The information we collect is used for the following purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li>To provide, operate, and maintain our services.</li>
                            <li>To process transactions and send related information, including purchase confirmations and invoices.</li>
                            <li>To improve, personalize, and expand our services.</li>
                            <li>To communicate with you, including customer service, updates, and marketing communications (you may opt out at any time).</li>
                            <li>To monitor and analyze usage and trends to improve user experience.</li>
                            <li>To detect, prevent, and address technical issues, fraud, and security incidents.</li>
                            <li>To comply with legal obligations and enforce our Terms of Service.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">4. Data Sharing and Disclosure</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            We do not sell, trade, or rent your personal information to third parties. However, we may share your information in the following circumstances:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li><strong>Service Providers:</strong> We may share data with third-party vendors (e.g., Razorpay for payment processing, Google Cloud for AI services) who perform services on our behalf.</li>
                            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</li>
                            <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given explicit consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">5. Data Security</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
                            alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, 
                            and we cannot guarantee absolute security. You acknowledge and accept the inherent security risks of providing information online.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">6. Data Retention</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, 
                            unless a longer retention period is required or permitted by law. When information is no longer needed, we will securely delete or anonymize it.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">7. Your Rights</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            Depending on your jurisdiction, you may have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li><strong>Access:</strong> Request access to the personal information we hold about you.</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal obligations.</li>
                            <li><strong>Objection:</strong> Object to the processing of your personal information for certain purposes.</li>
                            <li><strong>Data Portability:</strong> Request a copy of your data in a structured, commonly used format.</li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed mt-3">
                            To exercise these rights, please contact us at <strong>support@klintstudios.com</strong>.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">8. Third-Party Services</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Our services may contain links to third-party websites or integrate with third-party services (e.g., Razorpay, Google OAuth). 
                            We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. 
                            If you believe we have inadvertently collected information from a minor, please contact us immediately, and we will take steps to delete such information.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">10. International Data Transfers</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Your information may be transferred to and processed in countries other than your country of residence. 
                            These countries may have data protection laws that differ from those in your jurisdiction. By using our services, you consent to such transfers.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">11. Changes to This Privacy Policy</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated "Effective Date." 
                            Your continued use of our services after such changes constitutes acceptance of the revised policy. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">12. Contact Us</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:
                        </p>
                        <div className="mt-3 text-zinc-400">
                            <p><strong>Growth Pathmapper Limited</strong></p>
                            <p>Email: support@klintstudios.com</p>
                            <p>Registered Office: Delhi, India</p>
                        </div>
                    </section>

                    <div className="pt-6 border-t border-zinc-700 text-center text-zinc-500 text-xs">
                        By using Klint Studios, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
                    </div>
                </div>
            </div>
        </div>
    );
};

