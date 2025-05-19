export interface Cafe {
  id: number;
  title: string;
  image: string;
  description: string;
  hasWifi: boolean;
  hasPower: boolean;
  upvotes: number;
}

export const cafes: Cafe[] = [
  {
    id: 1,
    title: "Cozy Corner Cafe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "A warm and inviting cafe with vintage decor and artisanal coffee.",
    hasWifi: true,
    hasPower: true,
    upvotes: 42
  },
  {
    id: 2,
    title: "Urban Brew",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Modern minimalist cafe with specialty coffee and fresh pastries.",
    hasWifi: true,
    hasPower: false,
    upvotes: 27
  },
  {
    id: 3,
    title: "Green Leaf Cafe",
    image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Eco-friendly cafe with plant-based options and sustainable practices.",
    hasWifi: false,
    hasPower: true,
    upvotes: 18
  },
  {
    id: 4,
    title: "Book & Brew",
    image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "A quiet cafe with an extensive book collection and premium teas.",
    hasWifi: true,
    hasPower: true,
    upvotes: 35
  },
  {
    id: 5,
    title: "Seaside Sips",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Beachfront cafe offering refreshing drinks and ocean views.",
    hasWifi: false,
    hasPower: false,
    upvotes: 12
  },
  {
    id: 6,
    title: "Artisan's Cup",
    image: "https://images.unsplash.com/photo-1513267048331-5611cad62e41?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    description: "Showcasing local art and serving handcrafted beverages.",
    hasWifi: true,
    hasPower: true,
    upvotes: 31
  }
];
