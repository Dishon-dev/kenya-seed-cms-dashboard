// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { IconButton, Chip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, DragIndicator as DragIcon } from "@mui/icons-material";

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

interface Service {
  id?: number | string;
  title: string;
  description: string;
  image: string;
  link: string;
  order: number;
  isActive: boolean;
}

interface ServiceCardProps {
  service: Service;
  index: number;
  isSaving: boolean;
  servicesLength: number;
  onEdit: (service: Service) => void;
  onDelete: (id: number | string | null | undefined) => void;
  onMove: (from: number, to: number) => void;
  onModalOpen: (index: number) => void;
}

// const resolveImageUrl = (path?: string, fallback = "/images/placeholder-600x400.jpg") => {
//   if (!path) return fallback;
//   if (path.startsWith("http") || path.startsWith("//")) return path;
//   return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
// };

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  index,
  isSaving,
  servicesLength,
  onEdit,
  onDelete,
  onMove,
  onModalOpen,
}) => {
  const resolveImageUrl = (path?: string, fallback = "/images/placeholder-600x400.jpg") => {
    if (!path) return fallback;
    if (path.startsWith("http") || path.startsWith("//")) return path;
    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";
    return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  };

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      style={{ 
        width: '100%',
        height: '320px',
        minHeight: '320px',
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
      onClick={() => onModalOpen(index)}
    >
      {/* Active/Inactive Badge for CMS only - only visible on hover */}
      <div 
        className="absolute top-2 right-2 z-20 transition-all duration-300"
        style={{ opacity: 0 }}
      >
        <Chip
          label={service.isActive ? "Active" : "Inactive"}
          color={service.isActive ? "success" : "default"}
          size="small"
          sx={{ backgroundColor: service.isActive ? "#22c55e" : "#6b7280", color: "white" }}
        />
      </div>

      {/* CMS Controls: Edit and Delete - only visible on hover */}
      <div 
        className="absolute top-2 left-2 flex gap-1 transition-all duration-300 z-20"
        style={{ opacity: 0 }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(service);
          }}
          disabled={isSaving}
          sx={{ backgroundColor: "white", color: "black", width: 32, height: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          aria-label={`Edit ${service.title}`}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(service.id);
          }}
          disabled={isSaving || !service.id}
          sx={{ backgroundColor: "#dc2626", color: "white", width: 32, height: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          aria-label={`Delete ${service.title}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>

      {/* CMS Controls: Reorder - only visible on hover */}
      <div 
        className="absolute bottom-2 left-2 flex gap-1 transition-all duration-300 z-20"
        style={{ opacity: 0 }}
      >
        {index > 0 && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMove(index, index - 1);
            }}
            disabled={isSaving}
            sx={{ backgroundColor: "white", color: "black", width: 28, height: 28, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            aria-label={`Move ${service.title} up`}
          >
            <DragIcon fontSize="small" />
          </IconButton>
        )}
        {index < servicesLength - 1 && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMove(index, index + 1);
            }}
            disabled={isSaving}
            sx={{ backgroundColor: "white", color: "black", width: 28, height: 28, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            aria-label={`Move ${service.title} down`}
          >
            <DragIcon fontSize="small" />
          </IconButton>
        )}
      </div>

      {/* Image Container - fills the entire card */}
      <div 
        className="relative w-full h-full"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        <img
          src={resolveImageUrl(service.image)}
          alt={service.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-600x400.jpg';
          }}
        />
        
        {/* Green overlay at bottom of image - exactly like main website */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '110px',
            backgroundColor: '#16a34a',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}
        >
          <h3 
            className="text-white font-bold leading-tight"
            style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              lineHeight: '1.2',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}
          >
            {service.title}
          </h3>
          <button
            className="text-white font-medium hover:underline transition-colors duration-200 flex items-center"
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              margin: 0,
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onModalOpen(index);
            }}
            aria-label={`Learn more about ${service.title}`}
          >
            <span style={{ marginRight: '0.25rem' }}>→</span>
            <span>{service.link || "Learn more"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;