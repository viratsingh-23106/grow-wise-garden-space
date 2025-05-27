
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const IoTKitPromotion = () => {
  return (
    <div className="mt-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          Complete IoT Sensor Kit
        </h2>
        <p className="text-xl mb-6 text-green-100">
          Monitor soil moisture, temperature, humidity, light, pH, and nutrients with our comprehensive sensor package
        </p>
        <div className="flex justify-center">
          <Button asChild size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
            <Link to="/sensor-kit">
              View Sensor Kit Details <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IoTKitPromotion;
