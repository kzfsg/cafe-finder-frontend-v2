export interface Review {
  id: number;
  userName: string;
  userImage?: string;
  rating: number; // 1-5 stars
  comment: string;
  date: string;
}

export interface Cafe {
  id: number;
  title: string;
  image: string;
  description: string;
  hasWifi: boolean;
  hasPower: boolean;
  upvotes: number;
  location: {
    address: string;
    googleMapsUrl: string;
  };
  amenities: {
    openingHours: string;
    seatingCapacity: string;
    noiseLevel: string; // "Quiet", "Moderate", "Lively"
  };
  gallery: string[];
  reviews: Review[];
}

export const cafes: Cafe[] = [
  {
    id: 1,
    title: "Cozy Corner Cafe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "A warm and inviting cafe with vintage decor and artisanal coffee.",
    hasWifi: true,
    hasPower: true,
    upvotes: 42,
    location: {
      address: "123 Main Street, Downtown, City",
      googleMapsUrl: "https://maps.google.com/?q=CozyCornerCafe"
    },
    amenities: {
      openingHours: "Mon-Fri: 7:00 AM - 8:00 PM, Sat-Sun: 8:00 AM - 6:00 PM",
      seatingCapacity: "30 seats",
      noiseLevel: "Moderate"
    },
    gallery: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 101,
        userName: "Alex Johnson",
        userImage: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        comment: "This is my go-to spot for working remotely. The wifi is reliable, plenty of outlets, and the coffee is excellent. Staff is always friendly and the atmosphere is perfect for focusing.",
        date: "2025-04-15"
      },
      {
        id: 102,
        userName: "Sarah Miller",
        userImage: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 4,
        comment: "Great place to work from! The only reason I'm not giving 5 stars is because it can get a bit crowded during peak hours. Otherwise, excellent coffee and amenities.",
        date: "2025-03-22"
      },
      {
        id: 103,
        userName: "David Chen",
        rating: 5,
        comment: "Perfect ambiance for getting work done. Their pastries are amazing too - try the almond croissant!",
        date: "2025-05-01"
      }
    ]
  },
  {
    id: 2,
    title: "Urban Brew",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Modern minimalist cafe with specialty coffee and fresh pastries.",
    hasWifi: true,
    hasPower: false,
    upvotes: 27,
    location: {
      address: "456 Urban Street, Downtown, City",
      googleMapsUrl: "https://maps.google.com/?q=UrbanBrew"
    },
    amenities: {
      openingHours: "Mon-Fri: 6:30 AM - 7:00 PM, Sat-Sun: 7:30 AM - 5:00 PM",
      seatingCapacity: "25 seats",
      noiseLevel: "Lively"
    },
    gallery: [
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 201,
        userName: "Emily Parker",
        userImage: "https://randomuser.me/api/portraits/women/23.jpg",
        rating: 4,
        comment: "Love the minimalist design and the coffee is top-notch. It can get quite busy and noisy during peak hours though.",
        date: "2025-04-10"
      },
      {
        id: 202,
        userName: "Michael Wong",
        userImage: "https://randomuser.me/api/portraits/men/54.jpg",
        rating: 5,
        comment: "Their specialty lattes are amazing! The baristas are true artists and the atmosphere is perfect for catching up with friends.",
        date: "2025-03-15"
      },
      {
        id: 203,
        userName: "Jessica Taylor",
        rating: 3,
        comment: "Great coffee but limited seating and no power outlets was disappointing for someone looking to work.",
        date: "2025-05-05"
      }
    ]
  },
  {
    id: 3,
    title: "Green Leaf Cafe",
    image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Eco-friendly cafe with plant-based options and sustainable practices.",
    hasWifi: false,
    hasPower: true,
    upvotes: 18,
    location: {
      address: "789 Eco Avenue, Green District, City",
      googleMapsUrl: "https://maps.google.com/?q=GreenLeafCafe"
    },
    amenities: {
      openingHours: "Mon-Sun: 8:00 AM - 6:00 PM",
      seatingCapacity: "20 seats",
      noiseLevel: "Quiet"
    },
    gallery: [
      "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 301,
        userName: "Olivia Green",
        userImage: "https://randomuser.me/api/portraits/women/67.jpg",
        rating: 5,
        comment: "As a vegan, I appreciate their extensive plant-based menu. The atmosphere is so peaceful and their commitment to sustainability is impressive.",
        date: "2025-04-22"
      },
      {
        id: 302,
        userName: "Ryan Martinez",
        userImage: "https://randomuser.me/api/portraits/men/41.jpg",
        rating: 4,
        comment: "Great eco-friendly concept and delicious food. Would be perfect if they had wifi for working.",
        date: "2025-03-30"
      },
      {
        id: 303,
        userName: "Sophia Lee",
        rating: 5,
        comment: "The most peaceful cafe in the city! Their matcha latte is exceptional and I love their zero-waste approach.",
        date: "2025-05-12"
      }
    ]
  },
  {
    id: 4,
    title: "Book & Brew",
    image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "A quiet cafe with an extensive book collection and premium teas.",
    hasWifi: true,
    hasPower: true,
    upvotes: 35,
    location: {
      address: "321 Literary Lane, Cultural District, City",
      googleMapsUrl: "https://maps.google.com/?q=BookAndBrew"
    },
    amenities: {
      openingHours: "Mon-Fri: 8:00 AM - 9:00 PM, Sat-Sun: 9:00 AM - 10:00 PM",
      seatingCapacity: "40 seats",
      noiseLevel: "Quiet"
    },
    gallery: [
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 401,
        userName: "Benjamin Wright",
        userImage: "https://randomuser.me/api/portraits/men/76.jpg",
        rating: 5,
        comment: "Heaven for book lovers! I can spend hours here reading and sipping their excellent tea selection. The staff recommendations for books are always spot on.",
        date: "2025-04-05"
      },
      {
        id: 402,
        userName: "Hannah Kim",
        userImage: "https://randomuser.me/api/portraits/women/33.jpg",
        rating: 5,
        comment: "Perfect study spot with reliable wifi and plenty of outlets. The quiet atmosphere is exactly what I need to focus on my work.",
        date: "2025-03-18"
      },
      {
        id: 403,
        userName: "Thomas Brown",
        rating: 4,
        comment: "Great selection of books and teas. The only downside is that it can be hard to find seating on weekends because it's so popular.",
        date: "2025-05-08"
      }
    ]
  },
  {
    id: 5,
    title: "Seaside Sips",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Beachfront cafe offering refreshing drinks and ocean views.",
    hasWifi: false,
    hasPower: false,
    upvotes: 12,
    location: {
      address: "42 Beach Road, Coastal District, City",
      googleMapsUrl: "https://maps.google.com/?q=SeasideSips"
    },
    amenities: {
      openingHours: "Mon-Sun: 9:00 AM - 7:00 PM (Extended to 9:00 PM during summer)",
      seatingCapacity: "35 seats (plus 15 outdoor seats)",
      noiseLevel: "Moderate"
    },
    gallery: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 501,
        userName: "Mia Johnson",
        userImage: "https://randomuser.me/api/portraits/women/12.jpg",
        rating: 5,
        comment: "The view alone is worth 5 stars! Their fruit smoothies are incredible and there's nothing better than watching the sunset here with a drink in hand.",
        date: "2025-04-18"
      },
      {
        id: 502,
        userName: "James Wilson",
        userImage: "https://randomuser.me/api/portraits/men/22.jpg",
        rating: 3,
        comment: "Beautiful location but service can be slow during busy times. Also, no wifi or power makes it difficult for working.",
        date: "2025-03-25"
      },
      {
        id: 503,
        userName: "Lily Chen",
        rating: 4,
        comment: "Perfect spot for relaxation! Their signature coconut cold brew is amazing. Just wish they were open later in the evening.",
        date: "2025-05-10"
      }
    ]
  },
  {
    id: 6,
    title: "Artisan's Cup",
    image: "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Showcasing local art and serving handcrafted beverages.",
    hasWifi: true,
    hasPower: true,
    upvotes: 31,
    location: {
      address: "567 Gallery Street, Arts District, City",
      googleMapsUrl: "https://maps.google.com/?q=ArtisansCup"
    },
    amenities: {
      openingHours: "Tue-Sun: 10:00 AM - 8:00 PM, Closed on Mondays",
      seatingCapacity: "28 seats",
      noiseLevel: "Moderate"
    },
    gallery: [
      "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    reviews: [
      {
        id: 601,
        userName: "Noah Adams",
        userImage: "https://randomuser.me/api/portraits/men/65.jpg",
        rating: 5,
        comment: "Such a unique concept! I love how they feature a different local artist each month. The atmosphere is inspiring and their signature lavender latte is exceptional.",
        date: "2025-04-12"
      },
      {
        id: 602,
        userName: "Emma Rodriguez",
        userImage: "https://randomuser.me/api/portraits/women/89.jpg",
        rating: 4,
        comment: "Great spot for creative types. The art is always interesting and they host wonderful events. Wish they had more food options though.",
        date: "2025-03-20"
      },
      {
        id: 603,
        userName: "Lucas Thompson",
        rating: 5,
        comment: "Perfect blend of art and coffee culture. I come here whenever I need inspiration for my own work. The staff is knowledgeable about both coffee and art!",
        date: "2025-05-15"
      }
    ]
  }
];
