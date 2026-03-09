export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Gmalina Court</h3>
            <p>P.O. Box 6, Liwonde, Machinga, Malawi</p>
            <p className="mt-2">M5 Road Next to Fcapital Bank</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul>
              <li><a href="#" className="hover:underline">Home</a></li>
              <li><a href="#" className="hover:underline">Facilities</a></li>
              <li><a href="#" className="hover:underline">Book Now</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <ul>
              <li className="mb-2"><strong>What facilities do you offer?</strong> Conference, accommodation, bar/restaurant, gym, pool.</li>
              <li className="mb-2"><strong>How to book?</strong> Contact us via phone or email.</li>
              <li><strong>Is it family-friendly?</strong> Yes, with spacious rooms and amenities.</li>
            </ul>
          </div>
        </div>
        <p className="text-center mt-8 text-sm opacity-80">&copy; 2026 Gmalina Court. All rights reserved.</p>
      </div>
    </footer>
  );
}