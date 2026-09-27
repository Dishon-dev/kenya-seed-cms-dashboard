import { useState, useEffect } from "react";
import { getCustomerServices, CustomerService } from "../utils/customerServicesApi";

const CustomerServiceDesk = () => {
  const [activeService, setActiveService] = useState<number | null>(null);
  const [services, setServices] = useState<CustomerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await getCustomerServices();
        setServices(data);
      } catch (err) {
        console.error('Error loading customer services:', err);
        setError('Failed to load customer services');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading customer services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-accent/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
            CUSTOMER SERVICE DESK
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Dedicated support and services designed to meet all your agricultural needs
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group relative bg-green-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] h-80 cursor-pointer"
            >
              <div
                className="absolute top-0 left-0 w-full overflow-hidden rounded-b-lg"
                style={{ bottom: "21%" }}
              >
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              <div
                className="absolute w-[94%] right-0 bg-white text-left py-4 pl-4 rounded-l-lg shadow-md z-10"
                style={{ bottom: "19%", height: "4rem" }}
              >
                <h3 className="text-lg font-bold text-black uppercase tracking-wide truncate">
                  {service.title}
                </h3>
              </div>

              <div className="relative text-white text-right py-3 mt-auto z-10 hover:text-yellow-400 transition-colors duration-300 cursor-pointer">
                <a
                  href={service.link || "#"}
                  className="flex items-center justify-center gap-2 text-sm font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveService(index);
                  }}
                >
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                  {service.link}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Popup */}
        {activeService !== null && services[activeService] && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 relative animate-fadeIn">
              <button
                className="absolute top-4 right-6 text-gray-600 hover:text-green-800 text-2xl font-bold"
                onClick={() => setActiveService(null)}
              >
                ×
              </button>
              <h3 className="text-xl font-bold text-green-900 mb-6">{services[activeService].title}</h3>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {services[activeService].description}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerServiceDesk;
