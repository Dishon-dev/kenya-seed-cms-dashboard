import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

interface HorticultureVariety {
  name: string;
  maturity?: string;
  yield?: string | null;
  attributes?: string[];
  seedRate?: string;
  spacing?: string;
  imagePath?: string; // optional explicit image path (e.g. /herbs/...)
}

interface ProductCategory {
  name: string;
  description?: string;
  imagePath?: string;
  slug?: string;
  varieties?: HorticultureVariety[];
}

interface HorticultureVarietyTablesProps {
  categories: ProductCategory[];
}

const slugify = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/\./g, "");

const HorticultureVarietyTables: React.FC<HorticultureVarietyTablesProps> = ({ categories }) => {
  const { product } = useParams<{ product?: string }>();
  const navigate = useNavigate();

  // Resolve selected category by slug or name (case-insensitive)
  const selectedCategory = useMemo(() => {
    if (!product) return undefined;
    const lowerParam = product.toLowerCase();
    return categories.find((cat) => {
      const catSlug = (cat as any).slug ?? slugify(cat.name);
      return catSlug.toLowerCase() === lowerParam || cat.name.toLowerCase() === lowerParam;
    });
  }, [product, categories]);

  // Redirect to 404 if invalid product slug
  useEffect(() => {
    if (product && !selectedCategory) {
      navigate("/404", { replace: true });
    }
  }, [product, selectedCategory, navigate]);

  // Handle empty categories
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 text-center text-gray-500">
          <h1 className="text-3xl font-bold mb-4">Horticulture Varieties</h1>
          <p className="text-lg">No categories available</p>
          <p>No product categories found.</p>
        </div>
      </div>
    );
  }

  // If no product param, render category selection UI
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-4">Horticulture Varieties</h1>
          <p className="text-lg mb-6">Select a product to view varieties and specifications</p>
          <p className="mb-6 text-lg">Select a product to view its varieties and specifications.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const slug = (cat as any).slug ?? slugify(cat.name);
              return (
                <Link
                  to={`/products/product-info/horticulture-variety-tables/${slug}`}
                  key={slug}
                  className="block p-4 border rounded-lg hover:shadow-md transition bg-white"
                >
                  {cat.imagePath && (
                    <img
                      src={cat.imagePath}
                      alt={cat.name}
                      className="w-full h-40 object-cover rounded-md mb-3"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Failed to load category image: ${cat.imagePath}`);
                        e.currentTarget.src = "/horticulture/default-category.jpg";
                      }}
                    />
                  )}
                  <h2 className="text-xl font-semibold">{cat.name}</h2>
                  <p className="text-sm text-gray-600 mt-2">{cat.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If no selected category, return null (effect will redirect)
  if (!selectedCategory) return null;

  const varieties = (selectedCategory as any).varieties ?? [];

  // ===== UPDATED: strict slug -> filename map, no fuzzy includes =====
  const getImagePath = (varietyName: string) => {
    const slug = slugify(varietyName);

    const imageFilenames = [
      "Beetroot Detroit Dark Red.jpeg",
      "Bombay Red.jpg",
      "Broccoli Calabrese.webp",
      "Carrot Nantes.png",
      "Cauliflower Smilla F1.jpg",
      "Cauliflower Snowball.webp",
      "Chairman F1.png",
      "Chinese Cabbage (Michilili).jpg",
      "Collards Simlaw Select.png",
      "Common Amaranth - Dubious.jpg",
      "Common Night Shade (Managu).jpg",
      "Cowpeas Kunde Mboga.jpg",
      "Crimson Globe.png",
      "Crotolaria Miro.jpg",
      "Crown F1.png",
      "Cucumber Ashley.jpeg",
      "Cucurbits.jpg",
      "Curly Kale.jpg",
      "Ethiopian Kale (Kanzera).jpeg",
      "Giant Night Shade (Managu).jpg",
      "Grain Amaranth.jpg",
      "Imani F1.png",
      "Improved Red Creole.png",
      "Julie F1.jpg",
      "Kibo Star F1.png",
      "Leeks Carentan.webp",
      "Long Red Cayenne.jpg",
      "Malenge Gabbar F1.jpg",
      "Maya F1.png",
      "Nyota F1.png",
      "Pak Choi Green.webp",
      "Princess F1.jpeg",
      "proved Jute Mallow Improved Jute Mallow.jpg",
      "Pruktor F1.jpg",
      "Pumpkin Elgon.jpg",
      "Queen F1.png",
      "Radish Cherry belle.webp",
      "Red Summit.jpeg",
      "Spider Plant (Saga, Saget).jpg",
      "Spring Bunching Onion.jpg",
      "Squash Ambassador.jpg",
      "Super Rio.png",
      "Super Wonder.jpg",
      "Sweet Melon Galia F1.jpeg",
      "Sweetrose F1.jpg",
      "Turnip Early Purple.webp",
      "Victory F1 (Red).jpg",
      "Victory F1 (Yellow).png",
    ];

    // Build slug -> path map (trim filename base to avoid stray spaces)
    const imageMap: Record<string, string> = Object.fromEntries(
      imageFilenames.map((fn) => {
        const base = fn.replace(/\.[^/.]+$/, "").trim();
        return [slugify(base), `/horticulture/subhorticulture/${fn.trim()}`];
      })
    );

    // Exact lookup only — no includes/fuzzy matching
    if (imageMap[slug]) return imageMap[slug];

    // Not found -> fallback default
    console.warn(`No exact image match for "${varietyName}" (slug: "${slug}"). Using default image.`);
    return "/horticulture/default-variety.jpg";
  };
  // =================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-blue-600 mb-6">{selectedCategory.name} Varieties</h1>
        <p className="text-lg text-gray-600 mb-8">{selectedCategory.description}</p>

        {varieties.length === 0 ? (
          <div className="text-center text-gray-500 py-6">No varieties available for this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(varieties as HorticultureVariety[]).map((variety, idx) => {
              const chosenPath = variety.imagePath ?? getImagePath(variety.name);
              return (
                <div key={idx} className="border rounded-lg shadow-lg overflow-hidden bg-white">
                  <img
                    src={chosenPath}
                    alt={variety.name}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Failed to load variety image: ${chosenPath}`);
                      e.currentTarget.src = "/horticulture/default-variety.jpg";
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-600 mb-4">{variety.name}</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Maturity:</strong> {variety.maturity ?? "N/A"}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Yield:</strong> {variety.yield ?? "N/A"}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Seed Rate:</strong> {variety.seedRate ?? "N/A"}
                    </p>
                    <p className="text-sm text-gray-700 mb-4">
                      <strong>Spacing:</strong> {variety.spacing ?? "N/A"}
                    </p>
                    {variety.attributes?.length ? (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {variety.attributes.map((attr, attrIdx) => (
                          <li key={attrIdx}>{attr}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-700">No attributes listed.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorticultureVarietyTables;