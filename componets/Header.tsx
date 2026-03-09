export default function Header() {
  return (
    <header className="bg-blue-900 text-white py-4 sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gmalina Court</h1>
        <nav className="space-x-4 hidden md:block">
          <a href="#" className="hover:underline">Home</a>
          <a href="#facilities" className="hover:underline">Facilities</a>
          <a href="#about" className="hover:underline">About</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </nav>
        <button className="md:hidden">Menu</button> {/* Add mobile menu logic if needed */}
      </div>
    </header>
  );
}