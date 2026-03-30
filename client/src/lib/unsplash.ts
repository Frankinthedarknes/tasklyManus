// Unsplash API utility for fetching service images
const UNSPLASH_ACCESS_KEY = "demo"; // Using demo mode for now

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    thumb: string;
  };
  user: {
    name: string;
  };
  links: {
    html: string;
  };
}

// Map service categories to Unsplash search queries
const categoryImageMap: Record<string, string> = {
  electricidad: "electrical work professional",
  plomería: "plumbing professional",
  limpieza: "professional cleaning service",
  diseño: "graphic design creative",
  tecnología: "technology computer repair",
  fitness: "personal trainer fitness",
  educación: "online education tutor",
  reparación: "repair maintenance professional",
};

// Cache for images to avoid repeated API calls
const imageCache: Record<string, string> = {};

/**
 * Fetch a random image from Unsplash for a given service category
 * Falls back to a gradient color if API fails
 */
export async function getServiceImage(category: string): Promise<string> {
  // Check cache first
  if (imageCache[category]) {
    return imageCache[category];
  }

  try {
    const query = categoryImageMap[category] || category;

    // Using Unsplash Source API for simpler integration (no auth needed)
    const imageUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}`;

    // Cache the URL
    imageCache[category] = imageUrl;

    return imageUrl;
  } catch (error) {
    console.error("Failed to fetch image from Unsplash:", error);
    // Return a gradient fallback
    return getGradientFallback(category);
  }
}

/**
 * Get a gradient fallback based on category
 */
function getGradientFallback(category: string): string {
  const gradients: Record<string, string> = {
    electricidad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    plomería: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    limpieza: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    diseño: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    tecnología: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    fitness: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    educación: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
    reparación: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  };

  return gradients[category] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
}

/**
 * Preload images for better performance
 */
export function preloadImages(categories: string[]): void {
  categories.forEach(async (category) => {
    const img = new Image();
    img.src = await getServiceImage(category);
  });
}

/**
 * Get emoji for category (fallback)
 */
export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    electricidad: "⚡",
    plomería: "🔧",
    limpieza: "🧹",
    diseño: "🎨",
    tecnología: "💻",
    fitness: "💪",
    educación: "📚",
    reparación: "🔩",
  };

  return emojis[category] || "✨";
}
