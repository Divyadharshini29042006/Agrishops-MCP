// frontend/src/components/common/Footer.jsx
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">AgriShop</h3>
            <p className="text-sm mb-4">
              Your trusted agricultural marketplace specifically focused on high-quality Seeds and effective Pesticides for sustainable farming.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-green-500 transition">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="hover:text-green-500 transition">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="hover:text-green-500 transition">
                <FiInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-green-500 transition">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-green-500 transition">Products</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-green-500 transition">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-green-500 transition">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products?category=vegetable_seeds" className="hover:text-green-500 transition">Vegetable Seeds</Link>
              </li>
              <li>
                <Link to="/products?category=fruit_seeds" className="hover:text-green-500 transition">Fruit Seeds</Link>
              </li>
              <li>
                <Link to="/products?category=flower_seeds" className="hover:text-green-500 transition">Flower Seeds</Link>
              </li>
              <li>
                <Link to="/products?category=bio_pesticides" className="hover:text-green-500 transition">Bio Pesticides</Link>
              </li>
              <li>
                <Link to="/products?category=chemical_pesticides" className="hover:text-green-500 transition">Chemical Pesticides</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <FiMapPin className="mt-1 flex-shrink-0" />
                <span>123 Agriculture Street, Farming District, India</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail />
                <span>support@agrishop.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            © 2026 AgriShop. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-green-500 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-green-500 transition">Terms of Service</Link>
            <Link to="/refund" className="hover:text-green-500 transition">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;