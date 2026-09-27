import { useState, useEffect } from "react";
import { 
  Facebook as FaFacebookF, 
  LinkedIn as FaLinkedinIn, 
  Twitter as FaTwitter, 
  Instagram as FaInstagram, 
  WhatsApp as FaWhatsapp 
} from "@mui/icons-material";
import { getSocialBar, SocialLink } from "../utils/socialBarApi";

const SocialBar = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadSocialBar = async () => {
      try {
        setLoading(true);
        const data = await getSocialBar();
        if (isMounted) {
          setSocialLinks(data.socials || []);
        }
      } catch (err) {
        console.error('Error loading social bar:', err);
        if (isMounted) {
          setError('Failed to load social links');
          // Fallback to default social links
          setSocialLinks([
            {
              id: "facebook",
              name: "Facebook",
              url: "https://www.facebook.com/kseed",
              icon: "FaFacebookF",
              color: "#1877F2",
              hoverColor: "#166FE5",
              order: 1,
              isActive: true
            },
            {
              id: "linkedin",
              name: "LinkedIn",
              url: "https://www.linkedin.com/company/84069730/admin/",
              icon: "FaLinkedinIn",
              color: "#0077B5",
              hoverColor: "#005885",
              order: 2,
              isActive: true
            },
            {
              id: "twitter",
              name: "Twitter",
              url: "https://twitter.com/kenyaseedltd",
              icon: "FaTwitter",
              color: "#1DA1F2",
              hoverColor: "#0D8BD9",
              order: 3,
              isActive: true
            },
            {
              id: "instagram",
              name: "Instagram",
              url: "https://www.instagram.com/",
              icon: "FaInstagram",
              color: "#E4405F",
              hoverColor: "#D62976",
              order: 4,
              isActive: true
            },
            {
              id: "whatsapp",
              name: "WhatsApp",
              url: "https://wa.me/254791315075",
              icon: "FaWhatsapp",
              color: "#25D366",
              hoverColor: "#128C7E",
              order: 5,
              isActive: true
            }
          ]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSocialBar();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FaFacebookF':
        return FaFacebookF;
      case 'FaLinkedinIn':
        return FaLinkedinIn;
      case 'FaTwitter':
        return FaTwitter;
      case 'FaInstagram':
        return FaInstagram;
      case 'FaWhatsapp':
        return FaWhatsapp;
      default:
        return FaFacebookF;
    }
  };

  if (loading) {
    return (
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-4 z-50">
        <div className="animate-pulse p-2 rounded-full bg-gray-300 w-10 h-10"></div>
        <div className="animate-pulse p-2 rounded-full bg-gray-300 w-10 h-10"></div>
        <div className="animate-pulse p-2 rounded-full bg-gray-300 w-10 h-10"></div>
        <div className="animate-pulse p-2 rounded-full bg-gray-300 w-10 h-10"></div>
        <div className="animate-pulse p-2 rounded-full bg-gray-300 w-10 h-10"></div>
      </div>
    );
  }

  if (error) {
    console.warn('Social bar error:', error);
  }

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-4 z-50">
      {socialLinks
        .filter(link => link.isActive)
        .sort((a, b) => a.order - b.order)
        .map((link) => {
          const IconComponent = getIconComponent(link.icon);
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-transparent hover:bg-opacity-20 transition-colors"
              style={{
                color: link.color,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = link.hoverColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = link.color;
              }}
              title={link.name}
            >
              <IconComponent sx={{ fontSize: 20 }} />
            </a>
          );
        })}
    </div>
  );
};

export default SocialBar;
