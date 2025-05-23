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
  documentId?: string;
  Name: string;  // From the data structure
  title?: string;  // For compatibility with existing code
  image?: string;  // For compatibility with existing code
  Description?: any[];  // From the data structure
  description?: string;  // For compatibility with existing code
  hasWifi?: boolean;
  hasPower?: boolean;
  upvotes?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  Location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  location?: {  // For compatibility with existing code
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

// Sample cafes for testing
export const cafes: Cafe[] = [
  {
    id: 41,
    documentId: "c1aqxne1sopus0a2b1330xlg",
    Name: "Blackbird Coffee",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Blackbird Coffee is a specialty coffee shop in Hanoi dedicated to Vietnamese coffee and coffee enthusiasts. It features a cozy, quiet ambiance with a blend of classic and modern design elements highlighted by its signature orange color scheme. The café offers a variety of brewing methods including espresso, pour-over, and traditional Vietnamese drip coffee. It is praised for excellent coffee quality, including egg coffee, and a selection of sweets and light meals. The space includes two floors with distinct atmospheres and a balcony with a street view, making it suitable for work, casual meetings, or relaxing. The staff is friendly and attentive, and the café is popular among locals and travelers alike."
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": ""
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": ""
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-21T07:03:17.084Z",
            "updatedAt": "2025-05-23T08:04:50.209Z",
            "publishedAt": "2025-05-23T08:04:50.220Z",
            "Location": {
                "latitude": 21.0289,
                "longitude": 105.852,
                "address": "5 Chân Cầm, Hàng Trống, Hoàn Kiếm, Hà Nội, Vietnam",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 4
        },
        {
            "id": 42,
            "documentId": "pq6o9ioduy1mh978abjckou5",
            "Name": "Puku Cafe",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Puku Cafe and Sports Bar in Hanoi, Vietnam, is a popular 24/7 venue located in the heart of the Old Quarter on Hanoi's Food Street. It offers a cozy and lively atmosphere suitable for a variety of occasions, including casual hangouts, working, watching sports, and group events."
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-13T10:12:18.368Z",
            "updatedAt": "2025-05-23T08:12:19.292Z",
            "publishedAt": "2025-05-23T08:12:19.325Z",
            "Location": {
                "latitude": 21.0293,
                "longitude": 105.8435,
                "address": "16-18 P. Tống Duy Tân, Hàng Bông, Hoàn Kiếm, Hà Nội",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 0
        },
        {
            "id": 43,
            "documentId": "okgah3bt5xbkutwf4g7m18gq",
            "Name": "Ciara Terrace",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Located in Cầu Giấy District, Ciara Terrace Cafe is a coffee shop and coworking space in one. It offers a generous menu including hot and iced coffee, cold brew tea, fruit smoothies, and seasonal food specials. The café provides remote workers with office supplies like staplers, notepads, and power sockets everywhere, making it highly convenient for work."
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-22T02:58:01.273Z",
            "updatedAt": "2025-05-23T08:20:10.898Z",
            "publishedAt": "2025-05-23T08:20:10.922Z",
            "Location": {
                "latitude": 21.025,
                "longitude": 105.843,
                "address": "342 Ba Trieu, Hanoi, Vietnam",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 4
        },
        {
            "id": 44,
            "documentId": "viscpvtvf2sbe8rc04aedjcz",
            "Name": "HOON Cafe",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "HOON Cafe is a tranquil coffee spot in Ba Dinh district with a small but peaceful space. It features simple wooden furniture, a small garden area, and a balcony with airy views. The café offers a focused atmosphere with strong coffee aroma, ideal for peaceful work or study sessions."
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-22T03:01:58.366Z",
            "updatedAt": "2025-05-23T08:23:07.945Z",
            "publishedAt": "2025-05-23T08:23:07.953Z",
            "Location": {
                "latitude": 21.0425,
                "longitude": 105.812,
                "address": "40 Alley 267 Hoang Hoa Tham, Ba Dinh, Hanoi, Vietnam",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 4
        },
        {
            "id": 45,
            "documentId": "ilwut94x44ppewkwtsyr2xje",
            "Name": "The Note Coffee",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "The Note Coffee is a charming, cozy cafe located near Hoan Kiem Lake, famous for its unique décor filled with colorful sticky notes left by visitors from around the world. It offers a warm and inviting atmosphere, perfect for working or relaxing. The cafe serves a variety of coffee drinks, teas, and light snacks. It has a quiet ambiance during weekdays, making it suitable for focused work or casual meetings."
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-22T03:06:24.103Z",
            "updatedAt": "2025-05-23T08:26:58.056Z",
            "publishedAt": "2025-05-23T08:26:58.070Z",
            "Location": {
                "latitude": 21.0285,
                "longitude": 105.854,
                "address": "64 Lương Văn Can, Hàng Trống, Hoàn Kiếm, Hà Nội, Vietnam",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 4
        },
        {
            "id": 46,
            "documentId": "tqmngkx13jgoj17yt07wp4ao",
            "Name": "La Cherie Tây Hồ Tây",
            "Description": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "La Cherie Tea & Coffee is known for its cozy and cute design, ideal for enjoying tea and coffee. It offers a spacious and comfortable space with various seating options suitable for groups and individuals working alone. The menu is rich with a variety of teas, coffee, and creative drinks, with high-quality beverages especially noted for flower teas and special coffee blends. The café features a sound system that helps customers and their pets relax. Staff are friendly and attentive, and prices are reasonable given the quality and service. It is located in an urban area, easily accessible, especially for residents of Hà Đông, making it a perfect spot for those seeking a quiet atmosphere and quality drinks."
                        }
                    ]
                }
            ],
            "createdAt": "2025-05-21T06:37:39.581Z",
            "updatedAt": "2025-05-23T08:37:32.761Z",
            "publishedAt": "2025-05-23T08:37:32.776Z",
            "Location": {
                "latitude": 20.9831,
                "longitude": 105.7645,
                "address": "46 TT4A Khu Đô Thị Văn Quán, Hà Đông, Hà Nội",
                "city": "Hanoi",
                "country": "Vietnam"
            },
            "upvotes": 5
        }
    ]