// frontend/src/pages/FaqPage.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, Award, Ticket, ShoppingBag } from "lucide-react";

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      icon: <HelpCircle className="text-indigo-600" size={24} />,
      question: "What is Job Design?",
      answer: "Job Design is a professional online platform for hosting award events, selling tickets, enabling secure voting, and purchasing award materials like plaques and trophies. Organizers, voters, and affiliates all have dedicated tools."
    },
    {
      icon: <Ticket className="text-green-600" size={24} />,
      question: "How do I buy event tickets?",
      answer: "Browse events on the Events page, select your event, choose ticket type (Free, Regular, VIP), and complete payment via Hubtel. Your e-ticket with QR code will be emailed instantly."
    },
    {
      icon: <Award className="text-amber-600" size={24} />,
      question: "How does voting work?",
      answer: "Each user gets one vote per category. Log in, go to the event’s voting page, select your nominee, and confirm. Votes are tracked securely with IP and user verification to prevent fraud."
    },
    {
      icon: <ShoppingBag className="text-purple-600" size={24} />,
      question: "Can I order plaques or trophies?",
      answer: "Yes! Visit the Shop section, browse award materials, select quantity, and checkout. Admin manages inventory and delivery. Perfect for event winners!"
    },
    {
      icon: <MessageSquare className="text-blue-600" size={24} />,
      question: "How do I become an affiliate?",
      answer: "Register as an affiliate, get your unique referral link, and share it. Earn 10–20% commission when referred users create paid events. Withdraw earnings via admin approval."
    },
    {
      icon: <Award className="text-red-600" size={24} />,
      question: "How do I host an event?",
      answer: "Register as an Organizer, submit your application with proof, and wait for admin approval. Once approved, create events, add nominees, set ticket prices, and go live!"
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about hosting, voting, shopping, and earning on Job Design.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left group focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{faq.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                    {faq.question}
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="text-indigo-600" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 group-hover:text-indigo-600" size={20} />
                  )}
                </div>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <p className="text-gray-600 leading-relaxed mt-3">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help? */}
        <div className="mt-12 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="mb-6 opacity-90">
            Our support team is here to help you 24/7.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            <MessageSquare size={20} />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;