export interface Review {
  id: string;
  user_id: string;
  cafe_id: number;
  rating: boolean; // true for positive, false for negative
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

// Interface for Supabase location JSON field
export interface CafeLocation {
  city: string;
  address: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Main Cafe interface matching Supabase structure
export interface Cafe {
  // Primary Supabase fields
  id: number;
  created_at: string;
  name: string;
  description: string;
  location: CafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  upvotes: number;
  downvotes: number;
  distance?: number; // Distance from user in kilometers
  
  // Legacy fields for backward compatibility
  imageUrls: string[]; // Array of image URLs for the cafe
  documentId?: string;
  Name?: string;  // For compatibility with existing code
  title?: string;  // For compatibility with existing code
  image?: string;  // For compatibility with existing code
  Description?: any[];  // For compatibility with existing code
  hasWifi?: boolean;  // For compatibility with existing code
  hasPower?: boolean;  // For compatibility with existing code
  createdAt?: string;  // For compatibility with existing code
  updatedAt?: string;  // For compatibility with existing code
  publishedAt?: string | null;
  Location?: {  // For compatibility with existing code
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  location_legacy?: {  // For compatibility with existing code
    address?: string;
    googleMapsUrl?: string;
  };
  amenities?: {
    openingHours?: string;
    seatingCapacity?: string;
    noiseLevel?: string; // "Quiet", "Moderate", "Lively"
  };
  gallery?: string[];
  reviews?: Review[];
}

// Sample cafes for testing - updated to match Supabase structure
export const cafes: Cafe[] = [
  {
    id: 1,
    created_at: "2025-05-26 08:46:17.754614+00",
    name: "Puku Cafe",
    imageUrls: [], // Add empty array as default for sample data
    description: "Puku Cafe and Sports Bar in Hanoi, Vietnam, is a popular 24/7 venue located in the heart of the Old Quarter on Hanoi's Food Street. It offers a cozy and lively atmosphere suitable for a variety of occasions, including casual hangouts, working, watching sports, and group events.",
    location: {
      city: "Hanoi", 
      address: "16-18 P. Tống Duy Tân, Hàng Bông, Hoàn Kiếm, Hà Nội", 
      country: "Vietnam", 
      latitude: 21.0293, 
      longitude: 105.8435
    },
    wifi: true,
    powerOutletAvailable: true,
    seatingCapacity: "",
    noiseLevel: "",
    priceRange: "",
    upvotes: 0,
    downvotes: 0,
    
    // Legacy fields for compatibility
    documentId: "puku-cafe",
    Name: "Puku Cafe",
    title: "Puku Cafe",
    image: "/images/cafes/puku-cafe.jpg",
    Description: [{ 
      type: "paragraph", 
      children: [{ 
        type: "text", 
        text: "Puku Cafe and Sports Bar in Hanoi, Vietnam, is a popular 24/7 venue located in the heart of the Old Quarter on Hanoi's Food Street. It offers a cozy and lively atmosphere suitable for a variety of occasions, including casual hangouts, working, watching sports, and group events." 
      }] 
    }],
    hasWifi: true,
    hasPower: true,
    createdAt: "2025-05-26 08:46:17.754614+00",
    updatedAt: "2025-05-26 08:46:17.754614+00",
    Location: {
      latitude: 21.0293,
      longitude: 105.8435,
      address: "16-18 P. Tống Duy Tân, Hàng Bông, Hoàn Kiếm, Hà Nội",
      city: "Hanoi",
      country: "Vietnam"
    }
  },
  {
    id: 2,
    created_at: "2025-05-26 08:47:24.293189+00",
    name: "The Note Coffee",
    imageUrls: [], // Add empty array as default for sample data
    description: "The Note Coffee is a charming, cozy cafe located near Hoan Kiem Lake, famous for its unique décor filled with colorful sticky notes left by visitors from around the world. It offers a warm and inviting atmosphere, perfect for working or relaxing. The cafe serves a variety of coffee drinks, teas, and light snacks. It has a quiet ambiance during weekdays, making it suitable for focused work or casual meetings.",
    location: {
      city: "Hanoi", 
      address: "64 Lương Văn Can, Hàng Trống, Hoàn Kiếm, Hà Nội, Vietnam", 
      country: "Vietnam", 
      latitude: 21.0285, 
      longitude: 105.854
    },
    wifi: true,
    powerOutletAvailable: true,
    seatingCapacity: "",
    noiseLevel: "",
    priceRange: "",
    upvotes: 0,
    downvotes: 0,
    
    // Legacy fields for compatibility
    documentId: "the-note-coffee",
    Name: "The Note Coffee",
    title: "The Note Coffee",
    image: "/images/cafes/note-coffee.jpg",
    Description: [{ 
      type: "paragraph", 
      children: [{ 
        type: "text", 
        text: "The Note Coffee is a charming, cozy cafe located near Hoan Kiem Lake, famous for its unique décor filled with colorful sticky notes left by visitors from around the world. It offers a warm and inviting atmosphere, perfect for working or relaxing. The cafe serves a variety of coffee drinks, teas, and light snacks. It has a quiet ambiance during weekdays, making it suitable for focused work or casual meetings." 
      }] 
    }],
    hasWifi: true,
    hasPower: true,
    createdAt: "2025-05-26 08:47:24.293189+00",
    updatedAt: "2025-05-26 08:47:24.293189+00"
  },
  {
    id: 3,
    created_at: "2025-05-26 08:48:05.623917+00",
    name: "Blackbird Coffee",
    imageUrls: [], // Add empty array as default for sample data
    description: "Blackbird Coffee is a specialty coffee shop in Hanoi dedicated to Vietnamese coffee and coffee enthusiasts. It features a cozy, quiet ambiance with a blend of classic and modern design elements highlighted by its signature orange color scheme. The café offers a variety of brewing methods including espresso, pour-over, and traditional Vietnamese drip coffee. It is praised for excellent coffee quality, including egg coffee, and a selection of sweets and light meals. The space includes two floors with distinct atmospheres and a balcony with a street view, making it suitable for work, casual meetings, or relaxing. The staff is friendly and attentive, and the café is popular among locals and travelers alike.",
    location: {
      city: "Hanoi", 
      address: "5 Chân Cầm, Hàng Trống, Hoàn Kiếm, Hà Nội, Vietnam", 
      country: "Vietnam", 
      latitude: 21.0289, 
      longitude: 105.852
    },
    wifi: true,
    powerOutletAvailable: true,
    seatingCapacity: "",
    noiseLevel: "",
    priceRange: "",
    upvotes: 0,
    downvotes: 0,
    
    // Legacy fields for compatibility
    documentId: "blackbird-coffee",
    Name: "Blackbird Coffee",
    title: "Blackbird Coffee",
    image: "/images/cafes/blackbird-coffee.jpg",
    Description: [{ 
      type: "paragraph", 
      children: [{ 
        type: "text", 
        text: "Blackbird Coffee is a specialty coffee shop in Hanoi dedicated to Vietnamese coffee and coffee enthusiasts. It features a cozy, quiet ambiance with a blend of classic and modern design elements highlighted by its signature orange color scheme. The café offers a variety of brewing methods including espresso, pour-over, and traditional Vietnamese drip coffee. It is praised for excellent coffee quality, including egg coffee, and a selection of sweets and light meals. The space includes two floors with distinct atmospheres and a balcony with a street view, making it suitable for work, casual meetings, or relaxing. The staff is friendly and attentive, and the café is popular among locals and travelers alike." 
      }] 
    }],
    hasWifi: true,
    hasPower: true,
    createdAt: "2025-05-26 08:48:05.623917+00",
    updatedAt: "2025-05-26 08:48:05.623917+00"
  },
  {
    id: 4,
    created_at: "2025-05-26 08:48:45.513252+00",
    name: "Ciara Terrace",
    imageUrls: [], // Add empty array as default for sample data
    description: "Located in Cầu Giấy District, Ciara Terrace Cafe is a coffee shop and coworking space in one. It offers a generous menu including hot and iced coffee, cold brew tea, fruit smoothies, and seasonal food specials. The café provides remote workers with office supplies like staplers, notepads, and power sockets everywhere, making it highly convenient for work.",
    location: {
      city: "Hanoi", 
      address: "342 Ba Trieu, Hanoi, Vietnam", 
      country: "Vietnam", 
      latitude: 21.025, 
      longitude: 105.843
    },
    wifi: true,
    powerOutletAvailable: true,
    seatingCapacity: "",
    noiseLevel: "",
    priceRange: "",
    upvotes: 0,
    downvotes: 0,
    
    // Legacy fields for compatibility
    documentId: "ciara-terrace",
    Name: "Ciara Terrace",
    title: "Ciara Terrace",
    image: "/images/cafes/ciara-terrace.jpg",
    Description: [{ 
      type: "paragraph", 
      children: [{ 
        type: "text", 
        text: "Located in Cầu Giấy District, Ciara Terrace Cafe is a coffee shop and coworking space in one. It offers a generous menu including hot and iced coffee, cold brew tea, fruit smoothies, and seasonal food specials. The café provides remote workers with office supplies like staplers, notepads, and power sockets everywhere, making it highly convenient for work." 
      }] 
    }],
    hasWifi: true,
    hasPower: true,
    createdAt: "2025-05-26 08:48:45.513252+00",
    updatedAt: "2025-05-26 08:48:45.513252+00"
  },
  {
    id: 5,
    created_at: "2025-05-26 08:51:54.282531+00",
    name: "HOON Cafe",
    imageUrls: [],
    description: "HOON Cafe is a tranquil coffee spot in Ba Dinh district with a small but peaceful space. It features simple wooden furniture, a small garden area, and a balcony with airy views. The café offers a focused atmosphere with strong coffee aroma, ideal for peaceful work or study sessions.",
    location: {
      city: "Hanoi", 
      address: "40 Alley 267 Hoang Hoa Tham, Ba Dinh, Hanoi, Vietnam", 
      country: "Vietnam", 
      latitude: 21.0425, 
      longitude: 105.812
    },
    wifi: true,
    powerOutletAvailable: true,
    seatingCapacity: "",
    noiseLevel: "",
    priceRange: "",
    upvotes: 0,
    downvotes: 0,
    
    // Legacy fields for compatibility
    documentId: "hoon-cafe",
    Name: "HOON Cafe",
    title: "HOON Cafe",
    image: "/images/cafes/hoon-cafe.jpg",
    Description: [{ 
      type: "paragraph", 
      children: [{ 
        type: "text", 
        text: "HOON Cafe is a tranquil coffee spot in Ba Dinh district with a small but peaceful space. It features simple wooden furniture, a small garden area, and a balcony with airy views. The café offers a focused atmosphere with strong coffee aroma, ideal for peaceful work or study sessions." 
      }] 
    }],
    hasWifi: true,
    hasPower: true,
    createdAt: "2025-05-26 08:51:54.282531+00",
    updatedAt: "2025-05-26 08:51:54.282531+00"
  }
]