import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-700 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
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
                        <h3 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Welcome to Klint Studios, operated by <strong>Growth Pathmapper Limited</strong>, a company registered in India 
                            ("Company," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of our platform, 
                            services, and products (collectively, the "Services"). By creating an account, accessing, or using our Services, 
                            you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately 
                            discontinue use of the Services. We reserve the right to modify these Terms at any time, and your continued use 
                            constitutes acceptance of such changes.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">2. Eligibility</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            You must be at least 18 years of age to use our Services. By using the Services, you represent and warrant that you 
                            have the legal capacity to enter into a binding agreement. If you are using the Services on behalf of an organization, 
                            you represent that you have the authority to bind that organization to these Terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">3. Service Description and Pricing</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            Klint Studios provides AI-powered image generation and editing tools. We offer multiple subscription plans:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li><strong>Free Plan:</strong> Limited features with usage restrictions (10 generations per day).</li>
                            <li><strong>Solo Plan:</strong> Enhanced features for individual creators.</li>
                            <li><strong>Studio Plan:</strong> Advanced tools for professional studios.</li>
                            <li><strong>Brand Plan:</strong> Enterprise-grade features for brands.</li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed mt-3">
                            <strong>Pricing and Promotions:</strong> All subscription plans (yearly and lifetime) include full access to the 
                            software features during the subscription period. However, certain advanced features rely on third-party APIs 
                            (e.g., Google Gemini, image generation models) which may incur additional costs. During promotional periods, 
                            API usage may be provided at no extra charge. Once promotional periods end, API usage costs will be charged 
                            separately based on actual consumption. You will be notified in advance of any changes to API pricing. 
                            All prices are listed in Indian Rupees (INR) and include applicable GST (18%). We reserve the right to modify 
                            pricing at any time with prior notice.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">4. Payment and Billing</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            Payment processing is handled securely by <strong>Razorpay</strong>, our authorized payment partner. By subscribing 
                            to a paid plan, you authorize us to charge your payment method for the selected subscription. Payments are non-refundable 
                            unless otherwise required by law. You are responsible for providing accurate billing information and promptly updating 
                            your payment details if they change. Failure to pay may result in suspension or termination of your account.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            <strong>Recurring Billing:</strong> Annual subscriptions will automatically renew unless you cancel before the renewal date. 
                            You may cancel your subscription at any time through your account settings, but no refunds will be provided for partial periods.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">5. User Accounts and Responsibilities</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            To access certain features, you must create an account using Google OAuth or other supported authentication methods. 
                            You are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li>Maintaining the confidentiality of your account credentials.</li>
                            <li>All activities that occur under your account.</li>
                            <li>Notifying us immediately of any unauthorized access or security breach.</li>
                            <li>Ensuring that all information you provide is accurate, current, and complete.</li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed mt-3">
                            We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, 
                            abusive, or illegal activities.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">6. Acceptable Use Policy</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            You agree not to use the Services for any unlawful, harmful, or prohibited purpose, including but not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                            <li>Generating content that is illegal, defamatory, obscene, pornographic, harassing, or hateful.</li>
                            <li>Infringing on intellectual property rights of others.</li>
                            <li>Uploading malicious code, viruses, or any harmful software.</li>
                            <li>Attempting to reverse-engineer, decompile, or hack the Services.</li>
                            <li>Using the Services to spam, phish, or engage in fraudulent activities.</li>
                            <li>Violating any applicable laws or regulations.</li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed mt-3">
                            We reserve the right to remove any content that violates this policy and to suspend or terminate accounts 
                            of users who repeatedly violate these rules.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">7. Intellectual Property Rights</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            <strong>Our Content:</strong> All content, features, and functionality of the Services, including but not limited to 
                            text, graphics, logos, software, and design, are the exclusive property of Growth Pathmapper Limited and are protected 
                            by copyright, trademark, and other intellectual property laws. You may not copy, reproduce, distribute, modify, or 
                            create derivative works without our prior written consent.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            <strong>Your Content:</strong> You retain ownership of any content you upload or create using the Services. By using 
                            the Services, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content 
                            solely for the purpose of providing the Services. You represent that you have all necessary rights to the content you upload 
                            and that it does not violate any third-party rights.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">8. API Usage and Third-Party Services</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Our Services integrate with third-party APIs (e.g., Google Gemini for AI processing, Razorpay for payments). 
                            These third-party services have their own terms and privacy policies, which you agree to comply with. 
                            We are not responsible for the availability, performance, or content of third-party services. API usage costs 
                            (when applicable) are separate from subscription fees and will be billed based on actual consumption after promotional 
                            periods end. We will provide advance notice of any changes to API pricing or terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROWTH PATHMAPPER LIMITED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, 
                            ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF 
                            SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE AMOUNT 
                            YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                            INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT 
                            THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">10. Indemnification</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            You agree to indemnify, defend, and hold harmless Growth Pathmapper Limited, its officers, directors, employees, 
                            agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including 
                            reasonable attorneys' fees) arising out of or in connection with: (a) your use of the Services; (b) your violation 
                            of these Terms; (c) your violation of any third-party rights, including intellectual property or privacy rights; 
                            or (d) any content you upload or generate using the Services.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">11. Termination</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            We reserve the right to suspend or terminate your account and access to the Services at any time, with or without 
                            cause, and with or without notice. Upon termination, your right to use the Services will immediately cease, and 
                            any data associated with your account may be deleted. You may also terminate your account at any time by contacting 
                            us. Termination does not relieve you of any payment obligations incurred prior to termination.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">12. Governing Law and Dispute Resolution</h3>
                        <p className="text-zinc-400 leading-relaxed mb-3">
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict 
                            of law principles. Any dispute, controversy, or claim arising out of or relating to these Terms or the Services 
                            shall be subject to the exclusive jurisdiction of the courts located in <strong>Delhi, India</strong>. 
                            You irrevocably consent to the jurisdiction and venue of such courts and waive any objection to such jurisdiction or venue.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            Before filing any legal action, you agree to attempt to resolve disputes through good-faith negotiation. 
                            If a resolution cannot be reached within 30 days, either party may proceed with formal legal proceedings.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">13. Severability</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall 
                            continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make 
                            it valid and enforceable.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">14. Entire Agreement</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Growth Pathmapper Limited 
                            regarding the Services and supersede all prior agreements, understandings, or representations, whether written or oral.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-white mb-3">15. Contact Information</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            If you have any questions, concerns, or disputes regarding these Terms, please contact us at:
                        </p>
                        <div className="mt-3 text-zinc-400">
                            <p><strong>Growth Pathmapper Limited</strong></p>
                            <p>Email: legal@klintstudios.com</p>
                            <p>Registered Office: Delhi, India</p>
                        </div>
                    </section>

                    <div className="pt-6 border-t border-zinc-700 text-center text-zinc-500 text-xs">
                        By using Klint Studios, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                        Your continued use of the Services constitutes ongoing acceptance of these Terms and any future modifications.
                    </div>
                </div>
            </div>
        </div>
    );
};

