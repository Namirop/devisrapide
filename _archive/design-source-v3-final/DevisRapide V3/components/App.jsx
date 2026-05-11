// App composition

const App = () => (
  <div className="bg-white">
    <Header />
    <Hero />
    <Stats />
    <HowItWorks />
    <WalloniaBanner />
    <Categories />
    <B2BSection />
    <Testimonials />
    <Footer />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
