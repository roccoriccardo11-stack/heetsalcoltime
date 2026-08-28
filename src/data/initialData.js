// Initial default dataset for Heets Alcol Time (editable via Admin CMS)

export const INITIAL_SITE_CONTENT = {
  hero: {
    backgroundImage: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=85",
    badge: "ALPS · SKI · NIGHTS · PARTY",
    title: "HEETS ALCOL TIME",
    claim: "PINZOLO · MADONNA DI CAMPIGLIO · TUTTO L'ANNO",
    subtitle: "L'energia della montagna, le migliori feste in quota e il gruppo di riferimento per chi vuole vivere davvero Pinzolo e Campiglio.",
    ctaPrimary: "Prossimi Eventi",
    ctaSecondary: "Guarda i Momenti",
    locationTag: "Pinzolo & Madonna di Campiglio · Val Rendena",
  },
  about: {
    tag: "CHI SIAMO",
    title: "NON SOLO AMICI, UNA SECONDA FAMIGLIA",
    text: "Siamo Heets Alcol Time: un gruppo di ragazzi che passa il tempo insieme in montagna, tra camminate di giorno e serate la notte. Non siamo solo amici, siamo una seconda famiglia. Se vieni a Pinzolo o a Madonna di Campiglio e vuoi divertirti sul serio, sei nel posto giusto: qui trovi le nostre feste, i nostri eventi e i momenti più belli vissuti negli anni.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
    imageCaption: "La Montagna che Unisce",
    imageSubcaption: "Dalle cime innevate ai ritrovi estivi",
    features: [
      {
        id: "feat-1",
        number: "01",
        title: "In Quota",
        description: "Escursioni & Baite",
        icon: "Mountain"
      },
      {
        id: "feat-2",
        number: "02",
        title: "Après-Ski",
        description: "Dj set & Drink",
        icon: "GlassWater"
      },
      {
        id: "feat-3",
        number: "03",
        title: "Community",
        description: "Accoglienza pura",
        icon: "Users"
      }
    ],
    stats: [
      { label: "Anni di Feste", value: "6+" },
      { label: "Eventi Organizzati", value: "80+" },
      { label: "Momenti in Quota", value: "1000+" },
      { label: "Community & Amici", value: "5000+" }
    ]
  },
  categories: [
    {
      id: "feste",
      title: "Feste & Collette",
      slug: "feste-collette",
      shortDesc: "Raduni e serate organizzate insieme, tra musica e amici, per far conoscere le persone che vengono in vacanza.",
      longDesc: "Le nostre leggendarie serate e collette: musica, dj set, divertimento senza filtri e la voglia di accogliere chiunque sia in vacanza per farlo sentire a casa. Da serate improvvisate in baita a party a tema indimenticabili.",
      coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      accentColor: "from-cyan-400 to-blue-600",
      badge: "NIGHTLIFE",
      link: "",
      buttonText: "Scopri",
      order: 1,
      isActive: true
    },
    {
      id: "apres-ski",
      title: "Après-Ski",
      slug: "apres-ski",
      shortDesc: "I momenti migliori appena scesi dalle piste, tra baite, musica e brindisi.",
      longDesc: "Gli scarponi ancora ai piedi, il tramonto sulle Dolomiti di Brenta, le canzoni cantate a squarciagola e i brindisi caldi. L'après-ski a Campiglio e Pinzolo come non l'avete mai vissuto, dai rifugi fino a valle.",
      coverImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
      accentColor: "from-sky-400 to-cyan-600",
      badge: "WINTER VIBES",
      link: "",
      buttonText: "Scopri",
      order: 2,
      isActive: true
    },
    {
      id: "capodanno",
      title: "Capodanno",
      slug: "capodanno",
      shortDesc: "La notte più speciale dell'anno, in quota, tra luci e festa fino all'alba.",
      longDesc: "Il Capodanno sulle nevi di Pinzolo e Madonna di Campiglio: brindisi di mezzanotte sotto le stelle, fuochi d'artificio riflessi sulla neve e musica che non si ferma fino al sorgere del sole del nuovo anno.",
      coverImage: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1200&q=80",
      accentColor: "from-blue-400 to-indigo-600",
      badge: "SPECIAL NIGHT",
      link: "",
      buttonText: "Scopri",
      order: 3,
      isActive: true
    },
    {
      id: "ferragosto",
      title: "Ferragosto",
      slug: "ferragosto",
      shortDesc: "Il cuore dell'estate in montagna, giornate di sole e serate senza fine.",
      longDesc: "L'apice dell'estate tra grigliate epiche in quota, fiumi di birra fresca, sole splendente e nottate intorno al falò con chitarre, casse e cielo limpido sopra le nostre valli.",
      coverImage: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
      accentColor: "from-teal-400 to-cyan-600",
      badge: "SUMMER PEAK",
      link: "",
      buttonText: "Scopri",
      order: 4,
      isActive: true
    },
    {
      id: "montagna",
      title: "Montagna",
      slug: "montagna",
      shortDesc: "Camminate, escursioni e giornate immerse nella natura, prima ancora che nella festa.",
      longDesc: "La nostra passione radicata: sentieri, vette delle Dolomiti di Brenta, rifugi nascosti, laghi alpini e albe mozzafiato. Perché prima di fare festa, amiamo e rispettiamo la nostra terra meravigliosa.",
      coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      accentColor: "from-cyan-500 to-teal-700",
      badge: "NATURE & HIKING",
      link: "",
      buttonText: "Scopri",
      order: 5,
      isActive: true
    }
  ],
  contacts: {
    instagram: "https://instagram.com/heets.alcoltime",
    instagramHandle: "@heets.alcoltime",
    tiktok: "https://tiktok.com/@heets.alcoltime",
    tiktokHandle: "@heets.alcoltime",
    email: "info@heetsalcoltime.it",
    phone: "+39 345 000 0000",
    location: "Pinzolo & Madonna di Campiglio (TN), Dolomiti di Brenta",
    whatsappNumber: "393450000000",
    whatsappText: "Ciao Heets Alcol Time! Vorrei info sulle vostre prossime feste e liste eventi a Pinzolo/Campiglio 🏔️🍸"
  }
};

export const INITIAL_EVENTS = [
  {
    id: "evt-1",
    title: "ALPEN GLOW · APRES-SKI SUNSET PARTY",
    category: "apres-ski",
    date: "2026-03-07",
    time: "16:30 - 21:00",
    location: "Baita del Sole · Spinale, Madonna di Campiglio",
    shortDesc: "Il ritrovo perfetto dopo l'ultima discesa: DJ Set in terrazza panoramica, bombardini caldi e aperitivo a ritmo serrato.",
    description: "Preparatevi a ballare con gli scarponi ai piedi! DJ Set live con musica house ed evergreen, cocktail speciali Heets e un tramonto infuocato sulle cime di Brenta. Liste aperte per accesso agevolato e consumazioni incluse.",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    isUpcoming: true,
    badge: "SOLD OUT IN ARRIVO",
    spotsLeft: 35
  },
  {
    id: "evt-2",
    title: "HEETS PRIVATE BAVARIAN & NIGHT PARTY",
    category: "feste",
    date: "2026-03-14",
    time: "22:00 - Late",
    location: "Chalet Segreto · Pinzolo Val Rendena",
    shortDesc: "La festa colletta più attesa della stagione con open bar, laser show e resident DJs.",
    description: "Una serata privata per veri amanti della festa. Musica no-stop fino a tarda notte, navette dedicate da Pinzolo e Campiglio centro, colletta gestita e drink inclusi. Accesso rigorosamente su lista nominativa!",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    isUpcoming: true,
    badge: "EVENTO EXCLUSIVE",
    spotsLeft: 20
  },
  {
    id: "evt-3",
    title: "SUNRISE PEAK HIKE & BAITA BRUNCH",
    category: "montagna",
    date: "2026-03-22",
    time: "06:00 - 13:00",
    location: "Ritrovo Funivie Pinzolo → Doss del Sabion",
    shortDesc: "Escursione mattutina per ammirare l'alba sulle vette con colazione calda e grappino in rifugio.",
    description: "Perché chi fa festa sa anche svegliarsi presto per vivere la montagna al 100%. Salita al Doss del Sabion con le prime luci, foto epiche della cordigliera e super brunch alpino con prodotti tipici locali.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    isUpcoming: true,
    badge: "ESCURSIONE",
    spotsLeft: 15
  },
  {
    id: "evt-4",
    title: "CAPODANNO IN QUOTA 2026 · THE ALPS MIDNIGHT",
    category: "capodanno",
    date: "2025-12-31",
    time: "20:30 - 05:00",
    location: "Chalet Grostè · 2500m Quota",
    shortDesc: "La notte di San Silvestro più calda delle Alpi. Cenone, fuochi e party infinito tra le nuvole.",
    description: "L'evento leggendario che ha unito oltre 400 persone per salutare l'anno nuovo a 2500 metri di quota. Gatti delle nevi per la risalita, champagne glacé e DJ set memorabile fino al mattino.",
    image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=800&q=80",
    isUpcoming: false,
    badge: "PASSATO · ICONIC",
    spotsLeft: 0
  },
  {
    id: "evt-5",
    title: "FERRAGOSTO FIRE & GRILL FESTIVAL",
    category: "ferragosto",
    date: "2025-08-15",
    time: "12:00 - 02:00",
    location: "Prati di Vallesinella · Madonna di Campiglio",
    shortDesc: "Grigliata gigante, giochi a squadre, musica acustica e falò notturno sotto le stelle.",
    description: "Una giornata intera di pura allegria estiva: grigliata montana a oltranza, tornei di birra pong, tuffo al torrente per i più coraggiosi e grande falò notturno con canti e dj set all'aperto.",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
    isUpcoming: false,
    badge: "PASSATO · ICONIC",
    spotsLeft: 0
  }
];

export const INITIAL_PHOTOS = [
  // Approved photos (live in gallery)
  {
    id: "ph-1",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80",
    title: "Tramonto Spinale con DJ Set",
    category: "apres-ski",
    author: "Marco R.",
    uploadedAt: "2026-02-20",
    status: "approved",
    likes: 42
  },
  {
    id: "ph-2",
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80",
    title: "Festa in baita notte fonda",
    category: "feste",
    author: "Heets Crew",
    uploadedAt: "2026-02-18",
    status: "approved",
    likes: 68
  },
  {
    id: "ph-3",
    url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1000&q=80",
    title: "Brindisi di Mezzanotte Capodanno Grostè",
    category: "capodanno",
    author: "Giulia & Sara",
    uploadedAt: "2026-01-01",
    status: "approved",
    likes: 120
  },
  {
    id: "ph-4",
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80",
    title: "Falò e chitarre a Ferragosto",
    category: "ferragosto",
    author: "Matteo B.",
    uploadedAt: "2025-08-16",
    status: "approved",
    likes: 85
  },
  {
    id: "ph-5",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
    title: "In cima al Brenta all'alba",
    category: "montagna",
    author: "Simone T.",
    uploadedAt: "2025-09-10",
    status: "approved",
    likes: 94
  },
  {
    id: "ph-6",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
    title: "Laser show e bollicine in quota",
    category: "feste",
    author: "Elena P.",
    uploadedAt: "2026-02-12",
    status: "approved",
    likes: 53
  },
  {
    id: "ph-7",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    title: "Aperitivo neve e sole con gli amici",
    category: "apres-ski",
    author: "Luca G.",
    uploadedAt: "2026-02-05",
    status: "approved",
    likes: 39
  },
  {
    id: "ph-8",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    title: "Lago Ritorto al mattino",
    category: "montagna",
    author: "Heets Crew",
    uploadedAt: "2025-07-28",
    status: "approved",
    likes: 77
  },

  // Pending moderation queue
  {
    id: "ph-pending-1",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80",
    title: "DJ Set a Campiglio sabato sera",
    category: "feste",
    author: "Alessandro Turista",
    uploadedAt: "2026-02-25",
    status: "pending",
    likes: 0
  },
  {
    id: "ph-pending-2",
    url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1000&q=80",
    title: "Bombardino time al tramonto",
    category: "apres-ski",
    author: "Martina da Milano",
    uploadedAt: "2026-02-26",
    status: "pending",
    likes: 0
  },
  {
    id: "ph-pending-3",
    url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1000&q=80",
    title: "Giro ai 5 Laghi prima della festa",
    category: "montagna",
    author: "Davide Vacanze",
    uploadedAt: "2026-02-26",
    status: "pending",
    likes: 0
  }
];

export const INITIAL_MESSAGES = [
  {
    id: "msg-1",
    name: "Federico Rossi",
    email: "federico.r@gmail.com",
    phone: "+39 333 1234567",
    subject: "Lista per la festa del 14 Marzo a Pinzolo",
    message: "Ciao ragazzi! Siamo un gruppo di 6 persone che salgono per il weekend. Come possiamo metterci in lista per la festa privata?",
    category: "Liste & Tavoli",
    createdAt: "2026-02-25T14:30:00Z",
    read: false
  },
  {
    id: "msg-2",
    name: "Giulia Bianchi",
    email: "giulia.b@libero.it",
    phone: "+39 347 9876543",
    subject: "Info evento di Capodanno e navette",
    message: "Ciao! Volevamo sapere a che ora partono le prime navette per rientrare a Pinzolo.",
    category: "Info Serate & Liste",
    createdAt: "2026-02-24T18:15:00Z",
    read: true
  }
];

// Initial Core Users: Starts EMPTY (0 Owners) so that the project owner can perform the INITIAL OWNER SETUP.
// No one can become a moderator without an invite issued by the registered OWNER.
export const INITIAL_USERS = [];

// Backward-compatibility alias
export const DEMO_USERS = INITIAL_USERS;

