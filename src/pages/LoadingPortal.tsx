import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  History,
  User,
  LogOut,
  Bell,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  X,
  ChevronDown,
  Save,
  Lock,
  Search,
  Filter,
  Warehouse,
  Coins,
  Info,
  ArrowLeft,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import { type Finish, type StoneLine, type WorkerPayment, type LoadingParty, type Trip, type Order } from '../data/types';
import { loadingPartiesApi, authApi } from '../api/index';

interface DraftLoadLine {
  key: string;
  tripId: string; // Target trip for this spec line in combined loading
  loadingPartyId: string; // Dynamic shop selector for split loading
  size: string;
  thickness: string;
  finish: Finish;
  pieces: number;
  ratePerSqft: number;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incoming', label: 'Incoming Feed', icon: ShoppingBag },
  { id: 'quarries', label: 'Quarries', icon: Layers },
  { id: 'history', label: 'Loading History', icon: History },
  { id: 'profile', label: 'Profile', icon: User }
] as const;

type TabType = typeof menuItems[number]['id'];

// Safe helper for dates
const safeDateLocaleString = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    incoming: "Incoming Feed",
    quarries: "Quarries",
    history: "Loading History",
    profile: "Profile",
    exitPortal: "Exit Portal",
    loadingPortal: "Loading Portal",
    opsSupervisor: "Operations Supervisor",
    supervisedQuarries: "Supervised Quarries",
    activeLorries: "Active Lorries",
    incomingOrders: "Incoming Orders",
    selectLorry: "Select Dispatch Lorry",
    lorryChooseDesc: "Choose an active stop lorry assigned to Ramapuram quarry loading:",
    lorryTrip: "-- Choose Lorry/Trip --",
    lorryAssigned: "Lorry Assigned Profile",
    driver: "Driver",
    stopsSummary: "Shop Stops Summary",
    totalVolumeLoaded: "Total Volume Loaded:",
    overloadLimit: "Lorry specifications maximum overload limit exceeded!",
    loadStonesSplit: "Load Stones from Ramapuram Quarries (Split-Stops Builder)",
    quarryStop: "Loading Quarry Stop",
    forBuyerOrderStop: "For Buyer Order stop",
    size: "Size",
    thickness: "Thickness",
    finish: "Finish",
    rate: "Rate (₹/sqft)",
    pieces: "Pieces",
    addStopSpec: "Add Stop spec",
    wagesPayout: "Wages Payout allocation for Stop",
    chargeQuarry: "Charge Quarry Shop",
    wagesAmount: "Wages Amount (₹)",
    opNote: "Operation Note",
    accumulatedValue: "Accumulated Load Stone Value",
    recordSplitLoads: "Record split-loads",
    dispatchLorry: "Dispatch Lorry",
    awaitingLoad: "Awaiting Load Specs",
    noLorrySelected: "No Lorry Selected for Loading",
    noLorryDesc: "Choose an active stop lorry assigned to Ramapuram quarry split-loading on the select dropdown above to begin loading logs.",
    activeLorryStops: "Active Lorry Stops Logs",
    noLoadsRecorded: "No loads recorded on this lorry stop yet.",
    sourcingBaseRates: "Sourcing Base Rates",
    ratesDesc: "Standard Ramapuram base sourcing purchase rates per sqft:",
    buyerOrdersSourcing: "Buyer Orders & Sourcing Requirements",
    incomingDesc: "Track requirements checklists placed by Kerala buyers. Pre-fill any specification load to the active stop lorry by clicking the Quick Load action.",
    noPendingOrders: "No pending buyer orders require split stop loading in Ramapuram.",
    quarriesDesc: "Manage standard split-loading quarries located around Ramapuram, check outstanding purchase balances, and register new loading accounts.",
    addLoadingQuarry: "Add Loading Quarry",
    outstandingBilled: "Total Sourced Billed",
    settledCleared: "Settled Cleared",
    outstandingBalance: "Outstanding Balance",
    wagesDispatchStatement: "Loading & Wages Dispatch Statement",
    historyDesc: "Chronological records of loaded stop trips dispatched from Ramapuram, showing loaded shops, detailed specs volumes, totals billed, and crew wages.",
    dispatchDate: "Dispatch Date",
    tripCode: "Trip Code",
    lorryPlate: "Lorry Plate",
    loadedShops: "Loaded Shops Stops",
    sourcedDetails: "Sourced Details",
    totalAmount: "Total Amount",
    workerWages: "Worker Wages",
    editSupervisor: "Operations Supervisor Profile",
    manageSupervisor: "Manage supervisor contact details and operational parameters.",
    username: "Username / Login Email",
    fullName: "Full Name",
    phone: "Phone Number",
    saveChanges: "Save Profile Changes",
    updatePassword: "Update Portal Password",
    changeDesc: "Change the secure credentials used to log into this supervisor portal.",
    currentPassword: "Current Account Password",
    newPassword: "New Portal Password",
    confirmNewPassword: "Confirm New Password",
    changePass: "Change Password",
    addQuarryTitle: "Add New Loading Quarry",
    quarryName: "Quarry Name",
    location: "Location",
    totalPurchased: "Total Purchased (₹)",
    paidAmount: "Paid Amount (₹)",
    cancel: "Cancel",
    saveQuarry: "Save Quarry"
  },
  ml: {
    dashboard: "ഡാഷ്‌ബോർഡ്",
    incoming: "ഇൻകമിംഗ് ഫീഡ്",
    quarries: "ക്വാറികൾ",
    history: "ലോഡിംഗ് ചരിത്രം",
    profile: "പ്രൊഫൈൽ",
    exitPortal: "പോർട്ടലിൽ നിന്ന് പുറത്തുകടക്കുക",
    loadingPortal: "ലോഡിംഗ് പോർട്ടൽ",
    opsSupervisor: "ഓപ്പറേഷൻസ് സൂപ്പർവൈസർ",
    supervisedQuarries: "ക്വാറികൾ",
    activeLorries: "സജീവ ലോറികൾ",
    incomingOrders: "ഇൻകമിംഗ് ഓർഡറുകൾ",
    selectLorry: "ലോറി തിരഞ്ഞെടുക്കുക",
    lorryChooseDesc: "രാമപുരം ക്വാറി ലോഡിംഗിനായി അനുവദിച്ച സജീവ ലോറി തിരഞ്ഞെടുക്കുക:",
    lorryTrip: "-- ലോറി/ട്രിപ്പ് തിരഞ്ഞെടുക്കുക --",
    lorryAssigned: "അനുവദിച്ച ലോറി പ്രൊഫൈൽ",
    driver: "ഡ്രൈവർ",
    stopsSummary: "ഷോപ്പ് സ്റ്റോപ്പ് വിവരങ്ങൾ",
    totalVolumeLoaded: "ലോഡ് ചെയ്ത ആകെ അളവ്:",
    overloadLimit: "ലോറിയുടെ പരമാവധി ലോഡിംഗ് പരിധി കഴിഞ്ഞു!",
    loadStonesSplit: "രാമപുരം ക്വാറികളിൽ നിന്ന് ലോഡ് ചെയ്യുക (സ്പ്ലിറ്റ്-സ്റ്റോപ്പ് ബിൽഡർ)",
    quarryStop: "ക്വാറി സ്റ്റോപ്പ്",
    forBuyerOrderStop: "ഓർഡർ സ്റ്റോപ്പ്",
    size: "അളവ്",
    thickness: "കനം",
    finish: "ഫിനിഷ്",
    rate: "നിരക്ക് (₹/ചതുരശ്ര അടി)",
    pieces: "കഷണങ്ങൾ",
    addStopSpec: "സ്റ്റോപ്പ് സ്പെക്ക് ചേർക്കുക",
    wagesPayout: "കൂലി വിതരണം",
    chargeQuarry: "ക്വാറി ഈടാക്കുക",
    wagesAmount: "കൂലി തുക (₹)",
    opNote: "പ്രവർത്തന കുറിപ്പ്",
    accumulatedValue: "ലോഡ് ചെയ്ത കല്ലിന്റെ ആകെ മൂല്യം",
    recordSplitLoads: "ലോഡിംഗ് രേഖപ്പെടുത്തുക",
    dispatchLorry: "ലോറി അയക്കുക",
    awaitingLoad: "കാത്തിരിക്കുന്നു",
    noLorrySelected: "ലോഡിംഗിനായി ലോറി തിരഞ്ഞെടുത്തിട്ടില്ല",
    noLorryDesc: "ലോഡിംഗ് വിവരങ്ങൾ ആരംഭിക്കുന്നതിനായി മുകളിലുള്ള ഡ്രോപ്പ്ഡൗണിൽ നിന്ന് രാമപുരം ക്വാറി സ്പ്ലിറ്റ്-ലോഡിംഗ് അനുവദിച്ച ലോറി തിരഞ്ഞെടുക്കുക.",
    activeLorryStops: "ലോറി സ്റ്റോപ്പ് ലോഗുകൾ",
    noLoadsRecorded: "ഈ ലോറിയിൽ ഇതുവരെ ലോഡുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല.",
    sourcingBaseRates: "അടിസ്ഥാന നിരക്കുകൾ",
    ratesDesc: "രാമപുരത്തെ അടിസ്ഥാന കല്ല് നിരക്കുകൾ (ചതുരശ്ര അടിക്ക്):",
    buyerOrdersSourcing: "ഓർഡറുകളും സোর্സിംഗ് ആവശ്യങ്ങളും",
    incomingDesc: "കേരളത്തിലെ ബയർമാരുടെ ഓർഡർ ആവശ്യങ്ങൾ പരിശോധിക്കുക. ദ്രുത ലോഡ് ബട്ടൺ ക്ലിക്കുചെയ്ത് ലോഡ് ബിൽഡറിലേക്ക് വിവരങ്ങൾ ചേർക്കുക.",
    noPendingOrders: "രാമപുരത്ത് ലോഡിംഗ് കാത്തിരിക്കുന്ന ഓർഡറുകൾ നിലവിൽ ഇല്ല.",
    quarriesDesc: "രാമപുരത്തിന് ചുറ്റുമുള്ള ക്വാറികൾ കൈകാര്യം ചെയ്യുക, വാങ്ങൽ കുടിശ്ശികകൾ പരിശോധിക്കുക, പുതിയ ക്വാറി രജിസ്റ്റർ ചെയ്യുക.",
    addLoadingQuarry: "പുതിയ ക്വാറി ചേർക്കുക",
    outstandingBilled: "ആകെ ബിൽ ചെയ്ത തുക",
    settledCleared: "തീർത്ത തുക",
    outstandingBalance: "ബാക്കി തുക",
    wagesDispatchStatement: "ലോഡിംഗ് & കൂലി വിവരങ്ങൾ",
    historyDesc: "രാമപുരത്ത് നിന്ന് അയച്ച ട്രിപ്പുകളുടെ തീയതി അടിസ്ഥാനമാക്കിയുള്ള വിവരങ്ങളും തൊഴിലാളികളുടെ കൂലിയും.",
    dispatchDate: "അയച്ച തീയതി",
    tripCode: "ട്രിപ്പ് കോഡ്",
    lorryPlate: "ലോറി നമ്പർ",
    loadedShops: "ലോഡ് ചെയ്ത ക്വാറികൾ",
    sourcedDetails: "കല്ലിന്റെ വിവരങ്ങൾ",
    totalAmount: "ആകെ തുക",
    workerWages: "തൊഴിലാളി കൂലി",
    editSupervisor: "ഓപ്പറേഷൻസ് സൂപ്പർവൈസർ പ്രൊഫൈൽ",
    manageSupervisor: "സൂപ്പർവൈസറുടെ ഫോൺ നമ്പറും പേരും മാറ്റുക.",
    username: "ഉപയോക്തൃനാമം / ലോഗിൻ ഇമെയിൽ",
    fullName: "പൂർണ്ണമായ പേര്",
    phone: "ഫോൺ നമ്പർ",
    saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
    updatePassword: "പോർട്ടൽ പാസ്‌വേഡ് പുതുക്കുക",
    changeDesc: "ഈ സൂപ്പർവൈസർ പോർട്ടലിൽ ലോഗിൻ ചെയ്യാൻ ഉപയോഗിക്കുന്ന പാസ്‌വേഡ് മാറ്റുക.",
    currentPassword: "നിലവിലെ പാസ്‌വേഡ്",
    newPassword: "പുതിയ പാസ്‌വേഡ്",
    confirmNewPassword: "പുതിയ പാസ്‌വേഡ് ഉറപ്പാക്കുക",
    changePass: "പാസ്‌വേഡ് മാറ്റുക",
    addQuarryTitle: "പുതിയ ക്വാറി ചേർക്കുക",
    quarryName: "ക്വാറിയുടെ പേര്",
    location: "സ്ഥലം",
    totalPurchased: "ആകെ വാങ്ങിയത് (₹)",
    paidAmount: "അടച്ച തുക (₹)",
    cancel: "റദ്ദാക്കുക",
    saveQuarry: "സൂക്ഷിക്കുക"
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    incoming: "ఇన్‌కమింగ్ ఫీడ్",
    quarries: "క్వారీలు",
    history: "లోడింగ్ చరిత్ర",
    profile: "ప్రొఫైల్",
    exitPortal: "పోర్టల్ నుండి నిష్క్రమించు",
    loadingPortal: "లోడింగ్ పోర్టల్",
    opsSupervisor: "ఆపరేషన్స్ సూపర్వైజర్",
    supervisedQuarries: "క్వారీలు",
    activeLorries: "యాక్టివ్ లారీలు",
    incomingOrders: "ఇన్‌కమింగ్ ఆర్డర్లు",
    selectLorry: "లారీని ఎంచుకోండి",
    lorryChooseDesc: "రామపురం క్వారీ లోడింగ్ కోసం కేటాయించిన యాక్టివ్ లారీని ఎంచుకోండి:",
    lorryTrip: "-- లారీ/ట్రిప్ ఎంచుకోండి --",
    lorryAssigned: "కేటాయించిన లారీ ప్రొఫైల్",
    driver: "డ్రైవర్",
    stopsSummary: "షాప్ స్టాప్ల సారాంశం",
    totalVolumeLoaded: "లోడ్ చేయబడిన మొత్తం పరిమాణం:",
    overloadLimit: "లారీ గరిష్ట లోడింగ్ పరిమితి దాటిపోయింది!",
    loadStonesSplit: "రామపురం క్వారీల నుండి లోడ్ చేయండి (స్ప్లిట్-స్టాప్ బిల్డర్)",
    quarryStop: "లోడింగ్ క్వారీ స్టాప్",
    forBuyerOrderStop: "బయ్యర్ ఆర్డర్ స్టాప్",
    size: "పరిమాణం",
    thickness: "మందం",
    finish: "ఫినిష్",
    rate: "ధర (₹/చదరపు అడుగు)",
    pieces: "ముక్కలు",
    addStopSpec: "స్టాప్ స్పెసిఫికేషన్ జోడించండి",
    wagesPayout: "కూలి చెల్లింపులు",
    chargeQuarry: "క్వారీ ఛార్జ్",
    wagesAmount: "కూలి మొత్తం (₹)",
    opNote: "ఆపరేషన్ నోట్",
    accumulatedValue: "లోడ్ చేయబడిన మొత్తం రాతి విలువ",
    recordSplitLoads: "లోడింగ్ నమోదు చేయండి",
    dispatchLorry: "లారీని పంపండి",
    awaitingLoad: "లోడ్ కోసం ఎదురుచూస్తోంది",
    noLorrySelected: "లోడింగ్ కోసం ఎటువంటి లారీ ఎంచుకోబడలేదు",
    noLorryDesc: "లోడింగ్ ప్రారంభించడానికి పైన ఉన్న డ్రాప్‌డౌన్ నుండి రామపురం క్వారీ స్ప్లిట్-లోడింగ్ కేటాయించిన లారీని ఎంచుకోండి.",
    activeLorryStops: "లారీ స్టాప్ల లాగ్‌లు",
    noLoadsRecorded: "ఈ లారీలో ఇంకా ఎటువంటి లోడ్‌లు నమోదు కాలేదు.",
    sourcingBaseRates: "బేస్ రేట్లు",
    ratesDesc: "రామపురం ప్రామాణిక బేస్ కొనుగోలు ధరలు (చదరపు అడుగుకి):",
    buyerOrdersSourcing: "బయ్యర్ ఆర్డర్లు & లోడింగ్ అవసరాలు",
    incomingDesc: "ఆదేశం లోడింగ్ అవసరాలను తనిఖీ చేయండి. ద్రుత లోడ్ బటన్ క్లిక్ చేసి లోడ్ బిల్డర్‌లోకి చేర్చండి.",
    noPendingOrders: "రామపురంలో ప్రస్తుతం పెండింగ్ లోడింగ్ ఆర్డర్లు లేవు.",
    quarriesDesc: "రామపురం చుట్టుపక్కల ఉన్న క్వారీలను నిర్వహించండి, కొనుగోలు బకాయిలను తనిఖీ చేయండి మరియు కొత్త క్వారీ నమోదు చేయండి.",
    addLoadingQuarry: "కొత్త క్వారీని జోడించండి",
    outstandingBilled: "Total Sourced Billed",
    settledCleared: "Settled Cleared",
    outstandingBalance: "Outstanding Balance",
    wagesDispatchStatement: "లోడింగ్ & కూలి వివరాల స్టేట్‌మెంట్",
    historyDesc: "రామపురం నుండి పంపబడిన ట్రిప్పుల తేదీల వారీ వివరాలు మరియు సిబ్బంది కూలి లాగ్‌లు.",
    dispatchDate: "పంపిన తేదీ",
    tripCode: "ట్రిప్ కోడ్",
    lorryPlate: "లారీ నంబర్",
    loadedShops: "లోడ్ చేసిన క్వారీలు",
    sourcedDetails: "రాతి వివరాలు",
    totalAmount: "మొత్తం విలువ",
    workerWages: "కూలి మొత్తం",
    editSupervisor: "ఆపరేషన్స్ సూపర్వైజర్ ప్రొఫైల్",
    manageSupervisor: "సూపర్వైజర్ సంప్రదింపు వివరాలు మరియు ఆపరేషన్ పారామితులను నిర్వహించండి.",
    username: "యూజర్ పేరు / ఈమెయిల్",
    fullName: "పూర్తి పేరు",
    phone: "ఫోన్ నంబర్",
    saveChanges: "మార్పులను సేవ్ చేయండి",
    updatePassword: "పోర్టల్ పాస్‌వర్డ్ నవీకరించండి",
    changeDesc: "ఈ సూపర్వైజర్ పోర్టల్‌లోకి లాగిన్ కావడానికి ఉపయోగించే పాస్‌వర్డ్‌ను మార్చండి.",
    currentPassword: "ప్రస్తుత పాస్‌వర్డ్",
    newPassword: "కొత్త పాస్‌వర్డ్",
    confirmNewPassword: "కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి",
    changePass: "పాస్‌వర్డ్ మార్చండి",
    addQuarryTitle: "కొత్త క్వారీని జోడించండి",
    quarryName: "క్వారీ పేరు",
    location: "చిరునామా",
    totalPurchased: "మొత్తం కొనుగోలు (₹)",
    paidAmount: "చెల్లించిన మొత్తం (₹)",
    cancel: "రద్దు చేయి",
    saveQuarry: "సేవ్ చేయి"
  }
};

export function LoadingPortal() {
  const { trips, lorries, orders, addLoadToTrip, dispatchTrip, stoneSpecs, unloadingParties, drivers } = useOrders();
  const lorryById = (id: string) => (lorries || []).find((l) => l.id === id);
  const unloadingPartyById = (id: string) => (unloadingParties || []).find((up) => up.id === id);
  const navigate = useNavigate();

  const [language, setLanguage] = useState<'en' | 'ml' | 'te'>(() => {
    return (localStorage.getItem('portal_language') as any) || 'en';
  });
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supervisor Form States
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('loading_supervisor');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Active trip selected for loading
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  
  // Supervised loading parties (quarries) state
  const [allLoadingParties, setAllLoadingParties] = useState<LoadingParty[]>([]);

  // Selected loading party for wages/notes input
  const [selectedWagesPartyId, setSelectedWagesPartyId] = useState('');
  const [workerPayment, setWorkerPayment] = useState<number>(7000);
  const [workerNote, setWorkerNote] = useState<string>('Loading charges');
  
  // Load form state
  const [loadLines, setLoadLines] = useState<DraftLoadLine[]>([]);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Modal State for Adding Quarry
  const [showAddQuarryModal, setShowAddQuarryModal] = useState(false);
  const [newQuarryName, setNewQuarryName] = useState('');
  const [newQuarryLocation, setNewQuarryLocation] = useState('Ramapuram');
  const [newQuarryPurchased, setNewQuarryPurchased] = useState<number>(0);
  const [newQuarryPaid, setNewQuarryPaid] = useState<number>(0);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const isOwner = localStorage.getItem('userRole') === 'owner';

  const handleLogout = () => {
    if (isOwner) {
      navigate('/');
      return;
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('buyerRef');
    localStorage.removeItem('driverRef');
    navigate('/login');
  };

  // Load Profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        if (res && res.success && res.user) {
          setUsername(res.user.username || '');
          setName(res.user.name || '');
          setPhone(res.user.phone || '');
          setUserRole(res.user.role || 'loading');
        }
      } catch {
        setUsername(localStorage.getItem('username') || '');
        setName(localStorage.getItem('name') || '');
        setPhone(localStorage.getItem('phone') || '');
        setUserRole(localStorage.getItem('userRole') || 'loading');
      }
    };
    fetchProfile();
  }, []);

  const displayName = useMemo(() => {
    return name || username || 'Loading Supervisor';
  }, [name, username]);

  const avatarInitials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }, [displayName]);

  // Fetch supervised quarries from backend on mount
  useEffect(() => {
    const fetchQuarries = async () => {
      try {
        const data = await loadingPartiesApi.getAll();
        if (data && Array.isArray(data) && data.length > 0) {
          setAllLoadingParties(data);
        }
      } catch (err) {
        console.error('[Loading Portal] Backend quarries fetch offline.');
      }
    };
    fetchQuarries();
  }, []);

  // Update defaults when allLoadingParties are loaded or selectedTripId changes
  useEffect(() => {
    if (allLoadingParties.length > 0) {
      setSelectedWagesPartyId(allLoadingParties[0].id);
      setLoadLines([
        { 
          key: `l-${Date.now()}`, 
          tripId: selectedTripId || '',
          loadingPartyId: allLoadingParties[0].id, 
          size: '2x2', 
          thickness: '50mm', 
          finish: 'polish', 
          pieces: 40, 
          ratePerSqft: 19 
        }
      ]);
      setWorkerPayment(7000);
      setWorkerNote('Loading charges');
    }
  }, [allLoadingParties, selectedTripId]);

  const handleAddQuarry = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess(false);

    if (!newQuarryName.trim() || !newQuarryLocation.trim()) {
      setModalError('Quarry name and location are required');
      return;
    }

    if (!newQuarryLocation.trim().toLowerCase().startsWith('ramapuram')) {
      setModalError('Quarry (Loading Party) must be located in Ramapuram only');
      return;
    }

    const quarryId = 'lp-' + Date.now();
    const payload = {
      id: quarryId,
      name: newQuarryName,
      location: newQuarryLocation,
      totalPurchased: newQuarryPurchased,
      paid: newQuarryPaid,
      pending: Math.max(0, newQuarryPurchased - newQuarryPaid)
    };

    try {
      const res = await loadingPartiesApi.create(payload);
      if (res && res.success) {
        setAllLoadingParties(prev => [...prev, res.data]);
        setModalSuccess(true);
        triggerToast('success', `Quarry ${newQuarryName} added successfully!`);
        setNewQuarryName('');
        setNewQuarryLocation('Ramapuram');
        setNewQuarryPurchased(0);
        setNewQuarryPaid(0);
        
        setTimeout(() => {
          setShowAddQuarryModal(false);
          setModalSuccess(false);
        }, 1500);
      } else {
        setModalError('Could not save quarry. Try again.');
      }
    } catch (err: any) {
      console.warn('[Loading Portal] Backend offline. Simulating registration locally.');
      const localNewQuarry = {
        ...payload,
        id: quarryId
      };
      setAllLoadingParties(prev => [...prev, localNewQuarry]);
      setModalSuccess(true);
      triggerToast('success', `Quarry ${newQuarryName} added locally!`);
      setNewQuarryName('');
      setNewQuarryLocation('Ramapuram');
      setNewQuarryPurchased(0);
      setNewQuarryPaid(0);

      setTimeout(() => {
        setShowAddQuarryModal(false);
        setModalSuccess(false);
      }, 1500);
    }
  };

  // Filter pending/active orders to show in "Incoming Orders Feed"
  const pendingOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      if (o.status === 'placed' || o.status === 'confirmed') return true;
      if (o.status === 'dispatched') {
        const orderTrips = (trips || []).filter((t) => t.orderId === o.id);
        const totalOrdered = (o.lines || []).reduce((sum, line) => sum + (line.pieces || 0), 0);
        const totalLoaded = orderTrips.reduce((sum, t) => {
          return sum + (t.stoneLines || []).reduce((s, line) => s + (line.pieces || 0), 0);
        }, 0);
        return totalLoaded < totalOrdered;
      }
      return false;
    });
  }, [orders, trips]);

  // Trips that are in 'loading' status
  const loadingTrips = useMemo(() => {
    return (trips || []).filter((t) => t.status === 'loading');
  }, [trips]);

  // Selected trip object
  const activeTrip = useMemo(() => {
    return (trips || []).find((t) => t.id === selectedTripId);
  }, [trips, selectedTripId]);

  // Selected order ID to display details
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Sync selectedOrderId with activeTrip when activeTrip changes
  useEffect(() => {
    if (activeTrip?.orderId) {
      setSelectedOrderId(activeTrip.orderId);
    }
  }, [activeTrip]);

  const activeLorry = useMemo(() => {
    if (!activeTrip) return null;
    return (lorries || []).find((l) => l.id === activeTrip.lorryId);
  }, [activeTrip, lorries]);

  const activeDriver = useMemo(() => {
    if (!activeTrip) return null;
    return (drivers || []).find((d) => d.id === activeTrip.driverId);
  }, [activeTrip, drivers]);

  // Find all active trips currently loaded/loading on this lorry
  const activeLorryTrips = useMemo(() => {
    if (!activeTrip) return [];
    return (trips || []).filter(t => t.lorryId === activeTrip.lorryId && t.status === 'loading');
  }, [trips, activeTrip]);

  const activeLorryOrders = useMemo(() => {
    return activeLorryTrips
      .map(t => (orders || []).find(o => o.id === t.orderId))
      .filter((o): o is NonNullable<typeof o> => !!o);
  }, [activeLorryTrips, orders]);

  // Lorry capacity calculations
  const capacityStats = useMemo(() => {
    if (activeLorryTrips.length === 0 || !activeLorry) return { loadedSqft: 0, percentage: 0, isOverloaded: false };

    const alreadyLoadedSqft = activeLorryTrips.reduce((total, trip) => {
      const tripSqft = (trip.stoneLines || []).reduce((acc, line) => {
        return acc + ((line.sqftPerPiece || 0) * (line.pieces || 0));
      }, 0);
      return total + tripSqft;
    }, 0);

    const draftLoadedSqft = loadLines.reduce((acc, line) => {
      const factor = line.size === '3x3' ? 9 : 4;
      return acc + (factor * (line.pieces || 0));
    }, 0);

    const totalLoadedSqft = alreadyLoadedSqft + draftLoadedSqft;
    const percentage = Math.min(100, Math.round((totalLoadedSqft / activeLorry.capacitySqft) * 100));
    const isOverloaded = totalLoadedSqft > activeLorry.capacitySqft;

    return {
      alreadyLoadedSqft,
      draftLoadedSqft,
      loadedSqft: totalLoadedSqft,
      percentage,
      isOverloaded
    };
  }, [activeLorryTrips, activeLorry, loadLines]);

  // Helper to check load count for a spec already loaded + draft
  const getFulfillmentStats = (size: string, thickness: string, finish: string, orderId: string) => {
    // Count pieces already loaded across all trips for this order
    const orderTrips = (trips || []).filter((t) => t.orderId === orderId);
    const loaded = orderTrips.reduce((acc, t) => {
      const tripLoaded = (t.stoneLines || [])
        .filter((line) => line.size === size && line.thickness === thickness && line.finish === finish)
        .reduce((sum, line) => sum + (line.pieces || 0), 0);
      return acc + tripLoaded;
    }, 0);

    // Count pieces in current draft load matching this order's trips
    const orderTripIds = orderTrips.map(t => t.id);
    const draft = loadLines
      .filter((line) => 
        line.size === size && 
        line.thickness === thickness && 
        line.finish === finish &&
        orderTripIds.includes(line.tripId)
      )
      .reduce((sum, line) => sum + (line.pieces || 0), 0);

    return {
      loaded: loaded + draft
    };
  };

  const addDraftLine = () => {
    setLoadLines((prev) => [
      ...prev,
      {
        key: `k-${Date.now()}`,
        tripId: selectedTripId,
        loadingPartyId: allLoadingParties[0]?.id || 'lp1',
        size: '2x2',
        thickness: '40mm',
        finish: 'polish',
        pieces: 20,
        ratePerSqft: 19
      }
    ]);
  };

  // Quick fill from order specifications list
  const handleQuickFillSpec = (size: string, thickness: string, finish: Finish, neededPieces: number, targetTripId: string) => {
    if (!activeLorry) return;
    const remainingCapacitySqft = activeLorry.capacitySqft - capacityStats.loadedSqft;
    const sqftPerPc = size === '3x3' ? 9 : 4;
    const maxFitPieces = Math.max(0, Math.floor(remainingCapacitySqft / sqftPerPc));

    if (maxFitPieces <= 0) {
      triggerToast('error', "This lorry is already fully loaded! Assign another lorry to load the remaining pieces.");
      return;
    }

    const piecesToLoad = Math.min(neededPieces, maxFitPieces);

    setLoadLines((prev) => [
      ...prev,
      {
        key: `k-${Date.now()}`,
        tripId: targetTripId,
        loadingPartyId: allLoadingParties[0]?.id || 'lp1',
        size,
        thickness,
        finish,
        pieces: piecesToLoad,
        ratePerSqft: 19 // Default owner loading rate
      }
    ]);
    setActiveTab('dashboard');
    triggerToast('success', `Pre-filled ${piecesToLoad} pieces of ${size} in Load Builder!`);
  };

  const removeDraftLine = (key: string) => {
    setLoadLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const updateDraftLine = (key: string, patch: Partial<DraftLoadLine>) => {
    setLoadLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  };

  const sqftPerPiece = (size: string): number => {
    return size === '3x3' ? 9 : 4;
  };

  const computedLines = useMemo(() => {
    return loadLines.map((line) => {
      const sqftFactor = sqftPerPiece(line.size);
      const totalSqft = sqftFactor * (line.pieces || 0);
      const amount = totalSqft * (line.ratePerSqft || 0);
      return {
        ...line,
        sqftFactor,
        totalSqft,
        amount
      };
    });
  }, [loadLines]);

  const totalLoadAmount = computedLines.reduce((sum, l) => sum + l.amount, 0);

  const handleAddLoadSubmit = () => {
    if (activeLorryTrips.length === 0) return;

    // Group computed lines by tripId
    const linesByTrip: Record<string, typeof computedLines> = {};
    for (const line of computedLines) {
      const tId = line.tripId || activeLorryTrips[0].id;
      if (!linesByTrip[tId]) linesByTrip[tId] = [];
      linesByTrip[tId].push(line);
    }

    // Find the target trip that loaded from selectedWagesPartyId to assign wages to
    let wagesTargetTripId = computedLines.find(l => l.loadingPartyId === selectedWagesPartyId)?.tripId;
    if (!wagesTargetTripId) {
      wagesTargetTripId = activeLorryTrips.find(t => 
        (t.stoneLines || []).some(sl => sl.loadingPartyId === selectedWagesPartyId)
      )?.id;
    }
    if (!wagesTargetTripId) {
      wagesTargetTripId = activeLorryTrips[0]?.id;
    }

    // Ensure the wages target trip is in linesByTrip so it gets processed even if it has no new stone lines
    if (wagesTargetTripId && !linesByTrip[wagesTargetTripId]) {
      linesByTrip[wagesTargetTripId] = [];
    }

    // Call addLoadToTrip for each trip that has loaded lines
    for (const [tripId, lines] of Object.entries(linesByTrip)) {
      const stoneLines: Omit<StoneLine, 'id'>[] = lines.map((line) => ({
        loadingPartyId: line.loadingPartyId,
        size: line.size,
        thickness: line.thickness,
        finish: line.finish,
        sqftPerPiece: line.sqftFactor,
        pieces: line.pieces || 0,
        ratePerSqft: line.ratePerSqft || 0
      }));

      const workerPayments: Omit<WorkerPayment, 'id'>[] = [];
      // Assign wages to selected wages trip or fallback to the first trip
      if (tripId === wagesTargetTripId && workerPayment > 0) {
        workerPayments.push({
          loadingPartyId: selectedWagesPartyId,
          amount: workerPayment,
          note: workerNote
        });
      }

      addLoadToTrip(tripId, selectedWagesPartyId, stoneLines, workerPayments);
    }
    
    setLoadLines([
      { 
        key: `k-${Date.now()}`, 
        tripId: selectedTripId || activeLorryTrips[0].id, 
        loadingPartyId: allLoadingParties[0]?.id || 'lp1', 
        size: '2x2', 
        thickness: '50mm', 
        finish: 'polish', 
        pieces: 40, 
        ratePerSqft: 19 
      }
    ]);
    setWorkerPayment(7000);
    setWorkerNote('Loading charges');
    
    setShowSuccess(true);
    triggerToast('success', 'Split-loads logged successfully!');
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast('error', 'Name is required.');
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (res && res.success) {
        localStorage.setItem('name', res.user.name);
        localStorage.setItem('phone', res.user.phone || '');
        triggerToast('success', 'Profile updated successfully!');
      } else {
        triggerToast('error', 'Failed to update profile.');
      }
    } catch (err: any) {
      triggerToast('error', err.message || 'Error updating profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('error', 'All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('error', 'Passwords do not match.');
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res && res.success) {
        triggerToast('success', 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        triggerToast('error', res.message || 'Incorrect current password.');
      }
    } catch (err: any) {
      triggerToast('error', err.message || 'Error updating password.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Loading History
  const loadingHistory = useMemo(() => {
    return (trips || []).filter((t) => t.status !== 'loading');
  }, [trips]);

  return (
    <div className="flex h-screen w-full bg-transparent text-neutral-200 overflow-hidden font-sans">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-4 shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toastMsg.type === 'success'
                ? 'bg-green-950/80 border-green-500/30 text-green-300'
                : 'bg-red-950/80 border-red-500/30 text-red-300'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold">{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-ink-950 border-r border-ink-700 flex flex-col justify-between h-full flex-shrink-0 z-30">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-6 border-b border-ink-700 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold font-extrabold text-ink-950 text-lg shadow-md shadow-gold/20">
              YS
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-wider text-white">
                TRANS IA
              </p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                {t.loadingPortal}
              </p>
            </div>
          </div>
 
          {/* Menu Navigation */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gold/10 text-gold shadow-inner border border-gold/20'
                      : 'text-neutral-400 hover:text-white hover:bg-ink-800'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-gold' : 'text-neutral-400'}`} />
                  {t[item.id] || item.label}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* Language Shifting Toggle Bar */}
        <div className="p-4 border-t border-ink-700 flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 pl-2">
            Language / ഭാഷ / భాష
          </span>
          <div className="grid grid-cols-3 gap-1 bg-ink-900 rounded-xl p-1 border border-ink-700">
            {(['en', 'ml', 'te'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  localStorage.setItem('portal_language', lang);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === lang
                    ? 'bg-gold text-ink-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'ml' ? 'ML' : 'TE'}
              </button>
            ))}
          </div>
        </div>
 
        {/* Exit Portal / Return to Owner Dashboard */}
        <div className="p-4 border-t border-ink-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-neutral-400 hover:text-white hover:bg-gold/10 hover:border-gold/30 border border-transparent transition-all"
          >
            <LogOut className="h-5 w-5" />
            {isOwner ? '← Owner Dashboard' : t.exitPortal}
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-20 bg-ink-950/80 backdrop-blur-md border-b border-ink-700 px-6 sm:px-8 flex items-center justify-between z-20 flex-shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-white capitalize">
              {activeTab === 'incoming' ? 'Incoming Feed' : activeTab === 'quarries' ? 'Supervised Quarries' : activeTab === 'history' ? 'Loading History' : activeTab}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isOwner && (
              <Link
                to="/"
                className="flex items-center gap-2 rounded-lg bg-gold/15 border border-gold/40 px-3.5 py-1.5 text-xs text-gold font-bold hover:bg-gold hover:text-ink-950 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Owner Dashboard
              </Link>
            )}
            <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs text-gold font-bold shadow-sm shadow-gold/5">
              {isOwner ? 'Owner Mode' : 'Operations Supervisor'}
            </div>

            {/* Notification Bell */}
            <button 
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/40 hover:bg-neutral-800/70 transition-all relative"
              aria-label="Notifications"
              onClick={() => {
                triggerToast('success', 'No new notifications');
              }}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-gold rounded-full" />
            </button>

            {/* User Initials & Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-ink-700">
              <div className="h-9 w-9 rounded-full bg-gold text-ink-950 font-extrabold flex items-center justify-center text-xs shadow-sm shadow-gold/25">
                {avatarInitials}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-neutral-200">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel Tab views */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-transparent relative">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-ink-700 bg-ink-950 p-5 flex items-center justify-between shadow-lg relative group">
                  <div>
                    <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-0.5">Supervised Quarries</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-black text-white font-mono">{allLoadingParties.length} Shops</span>
                      <button
                        onClick={() => setShowAddQuarryModal(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gold/10 px-2.5 py-1 text-[10px] font-extrabold text-gold border border-gold/25 hover:bg-gold hover:text-ink-950 transition-all active:scale-95 shadow-sm shadow-gold/5"
                      >
                        <Plus className="h-3 w-3" /> Add Quarry
                      </button>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center shadow-sm shadow-gold/5">
                    <Warehouse className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-700 bg-ink-950 p-5 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-0.5">Active Lorries</span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono">
                      {(lorries || []).filter(l => l.status === 'active' || l.status === 'idle').length} Plates
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center shadow-sm shadow-gold/5">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-700 bg-ink-950 p-5 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-0.5">Incoming Orders</span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono">{pendingOrders.length} Pending</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center shadow-sm shadow-gold/5">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Operations Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Dashboard forms builder */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Select Lorry */}
                  <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 space-y-4 shadow-lg">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2">
                      <Truck className="h-4.5 w-4.5 text-gold" />
                      Select Dispatch Lorry
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Choose an active stop lorry assigned to Ramapuram quarry loading:
                    </p>
                    
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-xs font-bold text-white focus:border-gold focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Lorry/Trip --</option>
                      {loadingTrips.filter((t, idx, self) => 
                        self.findIndex((ot) => ot.lorryId === t.lorryId) === idx
                      ).map((t) => {
                        const lorry = lorryById(t.lorryId);
                        const siblingTrips = loadingTrips.filter(st => st.lorryId === t.lorryId);
                        const buyerNames = siblingTrips.map(st => {
                           const dest = unloadingPartyById(st.unloadingPartyId);
                           return dest?.name || 'Unknown';
                        }).join(' & ');

                        return (
                          <option key={t.id} value={t.id} className="bg-ink-900 text-white">
                            {lorry?.plate || 'Unknown Lorry'} - For {buyerNames} ({t.code})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTrip ? (
                      <motion.div
                        key={activeTrip.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        {/* Active Lorry capacity specifications indicator */}
                        <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 space-y-4 shadow-lg">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700 pb-4">
                            <div>
                              <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-500">Lorry Assigned Profile</span>
                              <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                                <Truck className="h-4.5 w-4.5 text-gold" />
                                {activeLorry?.plate} · Driver: {activeDriver?.name || 'Awaiting Driver'}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-500">Shop Stops Summary</span>
                              <p className="text-xs text-neutral-350 font-bold mt-0.5">
                                {Array.from(new Set((activeTrip.stoneLines || []).map(l => l.loadingPartyId))).length} stops active
                              </p>
                            </div>
                          </div>

                          {/* Capacity indicators */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-neutral-400">Total Volume Loaded:</span>
                              <span className={`font-mono ${capacityStats.isOverloaded ? 'text-red-400' : 'text-gold'}`}>
                                {capacityStats.loadedSqft} / {activeLorry?.capacitySqft} sqft ({capacityStats.percentage}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-[#1a1a1f]">
                              <div
                                style={{ width: `${capacityStats.percentage}%` }}
                                className={`h-full transition-all duration-300 rounded-full ${
                                  capacityStats.isOverloaded ? 'bg-red-500' : 'bg-gold'
                                }`}
                              />
                            </div>
                            {capacityStats.isOverloaded && (
                              <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                                <Info className="h-3.5 w-3.5" /> Lorry specifications maximum overload limit exceeded!
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick Load Sourcing Checklist */}
                        <div className="rounded-2xl border border-ink-700 bg-ink-950 p-5 space-y-3.5 shadow-lg">
                          <div className="flex items-center justify-between border-b border-ink-800 pb-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-gold" />
                              Quick Load Sourcing Checklist
                            </h3>
                            <span className="text-[10px] text-neutral-500 font-medium">Click to fill builder below</span>
                          </div>
                          
                          <div className="space-y-2">
                            {(() => {
                              const pendingLines = activeLorryOrders.flatMap(order => {
                                const targetTrip = activeLorryTrips.find(t => t.orderId === order.id);
                                if (!targetTrip) return [];
                                return (order.lines || []).map(line => {
                                  const stats = getFulfillmentStats(line.size, line.thickness, line.finish, order.id);
                                  const pending = Math.max(0, line.pieces - stats.loaded);
                                  return { order, line, stats, pending, targetTrip };
                                });
                              }).filter(item => item.pending > 0);

                              if (pendingLines.length === 0) {
                                return (
                                  <p className="text-xs text-neutral-500 italic py-2 text-center font-medium">
                                    All stone requirements for these orders have been loaded/scheduled.
                                  </p>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {pendingLines.map(({ order, line, stats, pending, targetTrip }) => (
                                    <div 
                                      key={`${order.id}-${line.id}`}
                                      className="bg-ink-900 border border-ink-800 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-gold/20 transition-all"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-extrabold text-[11px] text-white">
                                            {line.size} · {line.thickness}
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.5 bg-ink-800 text-neutral-400 rounded capitalize font-mono">
                                            {line.finish}
                                          </span>
                                        </div>
                                        <p className="text-[9.5px] text-neutral-500">
                                          For: <strong className="text-neutral-400 font-medium">{order.code}</strong> · {pending} left of {line.pieces}
                                        </p>
                                      </div>

                                      <button
                                        onClick={() => handleQuickFillSpec(line.size, line.thickness, line.finish as Finish, pending, targetTrip.id)}
                                        className="inline-flex items-center gap-1 rounded bg-gold/10 border border-gold/30 hover:bg-gold hover:text-ink-950 px-2.5 py-1 text-[10px] font-bold text-gold transition-all"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Load
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Split Load Spec Builder form */}
                        <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 space-y-4 shadow-lg">
                          <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2 border-b border-[#1a1a1f] pb-3">
                            <Layers className="h-4.5 w-4.5 text-gold" />
                            Load Stones from Ramapuram Quarries (Split-Stops Builder)
                          </h3>

                          <div className="space-y-4">
                            {computedLines.map((l) => (
                              <div key={l.key} className="rounded-xl border border-ink-800 bg-ink-900 p-5 hover:border-gold/25 transition-all duration-300 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Loading Quarry Stop</span>
                                    <select
                                      value={l.loadingPartyId}
                                      onChange={(e) => updateDraftLine(l.key, { loadingPartyId: e.target.value })}
                                      className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                                    >
                                      {allLoadingParties.map((lp) => (
                                        <option key={lp.id} value={lp.id} className="bg-ink-900 text-white">
                                          {lp.name} ({lp.location})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">For Buyer Order stop</span>
                                    <select
                                      value={l.tripId}
                                      onChange={(e) => updateDraftLine(l.key, { tripId: e.target.value })}
                                      className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                                    >
                                      {activeLorryTrips.map((t) => {
                                        const dest = unloadingPartyById(t.unloadingPartyId);
                                        return (
                                          <option key={t.id} value={t.id} className="bg-ink-900 text-white">
                                            {dest?.name || 'Buyer'} ({t.code})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Size</span>
                                    <select
                                      value={l.size}
                                      onChange={(e) => updateDraftLine(l.key, { size: e.target.value })}
                                      className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                                    >
                                      <option value="2x2" className="bg-ink-900 text-white">2x2 (4 sqft)</option>
                                      <option value="3x3" className="bg-ink-900 text-white">3x3 (9 sqft)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Thickness</span>
                                    <select
                                      value={l.thickness}
                                      onChange={(e) => updateDraftLine(l.key, { thickness: e.target.value })}
                                      className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                                    >
                                      <option value="30mm" className="bg-ink-900 text-white">30mm</option>
                                      <option value="40mm" className="bg-ink-900 text-white">40mm</option>
                                      <option value="50mm" className="bg-ink-900 text-white">50mm</option>
                                    </select>
                                  </div>

                                  <div>
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Finish</span>
                                    <select
                                      value={l.finish}
                                      onChange={(e) => updateDraftLine(l.key, { finish: e.target.value as Finish })}
                                      className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                                    >
                                      <option value="polish" className="bg-ink-900 text-white">Polish</option>
                                      <option value="rough" className="bg-ink-900 text-white">Rough</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-ink-800 pt-4 mt-2">
                                  <div className="flex gap-4">
                                    <label className="w-24">
                                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Rate (₹/sqft)</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={l.ratePerSqft}
                                        onChange={(e) => updateDraftLine(l.key, { ratePerSqft: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                                      />
                                    </label>

                                    <label className="w-24">
                                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Pieces</span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={l.pieces}
                                        onChange={(e) => updateDraftLine(l.key, { pieces: Math.max(0, Number(e.target.value)) })}
                                        className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                                      />
                                    </label>
                                  </div>

                                  <div className="flex items-center gap-4 text-right">
                                    <div>
                                      <span className="block font-mono text-[10px] text-neutral-500">
                                        {l.sqftFactor} sqft × {l.pieces} pcs = {l.totalSqft} sqft
                                      </span>
                                      <span className="text-sm font-black text-gold font-mono">
                                        {formatINR(l.amount)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeDraftLine(l.key)}
                                      disabled={loadLines.length <= 1}
                                      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-ink-700 text-neutral-500 hover:text-red-400 bg-ink-900 hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                      aria-label="Remove load spec stop"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={addDraftLine}
                            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-ink-750 py-3 text-xs font-bold text-neutral-400 hover:text-white hover:border-neutral-500 transition-all bg-ink-950/25 hover:bg-ink-800/10"
                          >
                            <Plus className="h-4 w-4" /> Add Stop spec
                          </button>
                        </div>

                        {/* Wages Allocation form */}
                        <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 space-y-4 shadow-lg">
                          <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2 border-b border-ink-700 pb-3">
                            <Coins className="h-4.5 w-4.5 text-gold" />
                            Wages Payout allocation for Stop
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Charge Quarry Shop</span>
                              <select
                                value={selectedWagesPartyId}
                                onChange={(e) => setSelectedWagesPartyId(e.target.value)}
                                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                              >
                                {allLoadingParties.map((lp) => (
                                  <option key={lp.id} value={lp.id} className="bg-ink-900 text-white font-bold">
                                    {lp.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-neutral-400">Wages Amount (₹)</span>
                              <input
                                type="number"
                                min={0}
                                value={workerPayment}
                                onChange={(e) => setWorkerPayment(Math.max(0, Number(e.target.value)))}
                                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold"
                              />
                            </div>

                            <div>
                              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-neutral-400">Operation Note</span>
                              <input
                                type="text"
                                value={workerNote}
                                onChange={(e) => setWorkerNote(e.target.value)}
                                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dispatch cost summaries and actions */}
                        <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 flex flex-wrap items-center justify-between gap-6 shadow-xl">
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-500">Accumulated Load Stone Value</span>
                            <span className="text-2xl font-black text-gold font-mono">{formatINR(totalLoadAmount)}</span>
                            <span className="text-xs text-neutral-400 ml-2 font-medium">({capacityStats.loadedSqft} loaded sqft)</span>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={handleAddLoadSubmit}
                              disabled={totalLoadAmount <= 0 || capacityStats.isOverloaded}
                              className="rounded-xl bg-gold py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-ink-950 hover:bg-gold-400 shadow-md shadow-gold/10 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Record split-loads
                            </button>
                            
                            {activeLorryTrips.some(t => (t.stoneLines || []).length > 0) ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to dispatch lorry ${activeLorry?.plate} with ${activeLorryTrips.length} orders?`)) {
                                    activeLorryTrips.forEach(t => {
                                      if ((t.stoneLines || []).length > 0) {
                                        dispatchTrip(t.id);
                                      }
                                    });
                                    triggerToast('success', `Lorry ${activeLorry?.plate} dispatched successfully!`);
                                    setSelectedTripId('');
                                  }
                                }}
                                className="rounded-xl bg-green-500 py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-green-600 transition-all active:scale-[0.98] animate-pulse"
                              >
                                Dispatch Lorry
                              </button>
                            ) : (
                              <button
                                disabled
                                className="rounded-xl bg-neutral-800 px-5 py-3 text-xs font-bold text-neutral-500 cursor-not-allowed"
                              >
                                Awaiting Load Specs
                              </button>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#1a1a1f] bg-[#0d0d0f]/20 p-16 text-center space-y-4 shadow-inner">
                        <Truck className="h-16 w-16 text-neutral-600 mx-auto" />
                        <h3 className="text-base font-black text-white">No Lorry Selected for Loading</h3>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                          Choose an active stop lorry assigned to Ramapuram quarry split-loading on the select dropdown above to begin loading logs.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dashboard sidebar log info */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Current Lorry loaded stops log */}
                  {activeLorryTrips.length > 0 && (
                    <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-5 space-y-4 shadow-lg">
                      <h3 className="text-xs font-black uppercase tracking-wider text-gold border-b border-[#1a1a1f] pb-2">
                        Active Lorry Stops Logs
                      </h3>
                      
                      {activeLorryTrips.every(t => (t.stoneLines || []).length === 0) ? (
                        <p className="text-xs text-neutral-600 italic">No loads recorded on this lorry stop yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {activeLorryTrips.map((t) => {
                            const dest = unloadingPartyById(t.unloadingPartyId);
                            return (t.stoneLines || []).map((line, idx) => {
                              const shop = allLoadingParties.find((lp) => lp.id === line.loadingPartyId);
                              return (
                                <div key={`${t.id}-${idx}`} className="bg-[#121215] border border-neutral-900 p-3 rounded-lg flex justify-between items-center text-xs hover:border-[#1a1a1f] transition-all">
                                  <div className="space-y-1">
                                    <p className="font-bold text-white">{line.size} · {line.thickness} ({line.finish})</p>
                                    <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 flex-wrap">
                                      <span className="flex items-center gap-1 font-semibold text-neutral-400">Shop: {shop?.name || 'Ramapuram'}</span>
                                      <span className="h-2 w-px bg-[#1a1a1f]" />
                                      <span>For: {dest?.name} ({t.code})</span>
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-neutral-400">{line.sqftPerPiece * line.pieces} sqft</p>
                                    <p className="font-black text-gold">{formatINR(line.sqftPerPiece * line.pieces * line.ratePerSqft)}</p>
                                  </div>
                                </div>
                              );
                            });
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sourcing Purchase standard rates check */}
                  <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-5 space-y-4 shadow-lg">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2 border-b border-[#1a1a1f] pb-2.5">
                      <Coins className="h-4 w-4 text-gold" />
                      Sourcing Base Rates
                    </h3>
                    <p className="text-[10px] text-neutral-500">
                      Standard Ramapuram base sourcing purchase rates per sqft:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(stoneSpecs || []).map(spec => (
                        <div key={spec.id} className="bg-[#121215] border border-neutral-900 p-2.5 rounded-lg text-xs flex justify-between items-center hover:border-[#1a1a1f] transition-all">
                          <div>
                            <p className="font-bold text-white">{spec.size}</p>
                            <p className="text-[9px] text-neutral-500 font-semibold uppercase">{spec.thickness} · {spec.finish}</p>
                          </div>
                          <span className="text-xs font-black text-gold font-mono">₹{spec.ratePerSqft}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: INCOMING FEED */}
          {activeTab === 'incoming' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 shadow-lg">
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">Buyer Orders &amp; Sourcing Requirements</h3>
                <p className="text-xs text-neutral-500">
                  Track requirements checklists placed by Kerala buyers. Pre-fill any specification load to the active stop lorry by clicking the Quick Load action.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingOrders.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-12 text-center text-xs text-neutral-500 italic shadow-inner">
                    No pending buyer orders require split stop loading in Ramapuram.
                  </div>
                ) : (
                  pendingOrders.map((ord: Order) => {
                    const buyerDetails = unloadingPartyById(ord.unloadingPartyId);
                    const orderTrips = (trips || []).filter((t) => t.orderId === ord.id);
                    const activeLorryTrip = orderTrips.find(t => t.status === 'loading');

                    return (
                      <div 
                        key={ord.id}
                        className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 hover:border-neutral-800 transition-all duration-300 shadow-md flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-[#1a1a1f] pb-3">
                            <div>
                              <span className="text-sm font-black text-white">{ord.code}</span>
                              <span className="mx-2 text-neutral-700">|</span>
                              <span className="text-[10px] text-neutral-400 font-bold bg-[#121215] px-2 py-0.5 rounded border border-neutral-900">
                                {buyerDetails?.name || 'Buyer'} ({ord.district})
                              </span>
                            </div>
                            <span className="rounded-full bg-gold/10 text-gold px-2.5 py-0.5 text-[9px] font-black uppercase border border-gold/20 tracking-wider">
                              {ord.status}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {(ord.lines || []).map((line) => {
                              const stats = getFulfillmentStats(line.size, line.thickness, line.finish, ord.id);
                              const pending = Math.max(0, line.pieces - stats.loaded);
                              const isFulfilled = pending === 0;

                              return (
                                <div key={line.id} className={`p-3.5 rounded-xl border text-xs flex justify-between items-center transition-colors ${
                                  isFulfilled ? 'bg-green-500/5 border-green-500/10' : 'bg-[#121215] border-neutral-900'
                                }`}>
                                  <div className="space-y-1">
                                    <p className="font-bold text-white">{line.size} · {line.thickness} ({line.finish})</p>
                                    <p className="text-[10px] text-neutral-500">Ordered: {line.pieces} pcs | Loaded: {stats.loaded} pcs</p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isFulfilled ? 'text-green-400 bg-green-500/5' : 'text-amber-400 bg-amber-500/5'}`}>
                                      {isFulfilled ? 'Loaded' : `${pending} pieces left`}
                                    </span>
                                    {!isFulfilled && activeLorryTrip && (
                                      <button
                                        onClick={() => handleQuickFillSpec(line.size, line.thickness, line.finish as Finish, pending, activeLorryTrip.id)}
                                        className="flex h-8 items-center gap-1 rounded-lg border border-[#1a1a1f] hover:border-gold px-3 text-[10px] font-black uppercase text-neutral-400 hover:text-[#0d0d0f] hover:bg-gold transition-all"
                                      >
                                        <Sparkles className="h-3 w-3 shrink-0" />
                                        Load
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {activeLorryTrip && (
                          <div className="mt-6 pt-4 border-t border-[#1a1a1f] flex items-center justify-between text-xs text-neutral-400 font-bold">
                            <span className="flex items-center gap-1.5 text-neutral-400">
                              <Truck className="h-4 w-4 text-gold" />
                              Lorry Assigned: {lorryById(activeLorryTrip.lorryId)?.plate || 'Loading'}
                            </span>
                            <span className="font-mono text-gold">{activeLorryTrip.code}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: QUARRIES */}
          {activeTab === 'quarries' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header section with add action */}
              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Supervised Granite Quarries</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Manage standard split-loading quarries located around Ramapuram, check outstanding purchase balances, and register new loading accounts.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddQuarryModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gold hover:bg-gold-400 py-3.5 px-6 font-extrabold text-xs uppercase tracking-wider text-[#0d0d0f] active:scale-[0.98] transition-all shadow-lg shadow-gold/15 whitespace-nowrap"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add Loading Quarry
                </button>
              </div>

              {/* Quarry Balances List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allLoadingParties.map((lp) => {
                  const pendingBalance = Math.max(0, (lp.totalPurchased || 0) - (lp.paid || 0));
                  return (
                    <div 
                      key={lp.id}
                      className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 flex flex-col justify-between hover:border-gold/30 transition-all duration-300 shadow-md group"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4 group-hover:scale-110 transition-transform">
                          <Warehouse className="h-5 w-5" />
                        </div>
                        <h4 className="text-base font-black text-white group-hover:text-gold transition-colors">
                          {lp.name}
                        </h4>
                        <div className="mt-2 text-xs text-neutral-400 font-bold flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span>{lp.location}</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#1a1a1f] space-y-3 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Total Sourced Billed</span>
                          <span className="font-bold text-white">{formatINR(lp.totalPurchased || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Settled Cleared</span>
                          <span className="font-bold text-green-400">{formatINR(lp.paid || 0)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[#1a1a1f]/30">
                          <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Outstanding Balance</span>
                          <span className={`font-bold ${pendingBalance > 0 ? 'text-gold' : 'text-neutral-500'}`}>{formatINR(pendingBalance)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB: LOADING HISTORY */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 shadow-lg">
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">Loading &amp; Wages Dispatch Statement</h3>
                <p className="text-xs text-neutral-500">
                  Chronological records of loaded stop trips dispatched from Ramapuram, showing loaded shops, detailed specs volumes, totals billed, and crew wages.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] overflow-hidden shadow-lg">
                {loadingHistory.length === 0 ? (
                  <div className="p-12 text-center text-xs text-neutral-500 italic shadow-inner">
                    No loading dispatches logged under this supervisor profile yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1a1a1f] bg-[#121215]/50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                          <th className="px-6 py-4">Dispatch Date</th>
                          <th className="px-6 py-4">Trip Code</th>
                          <th className="px-6 py-4">Lorry Plate</th>
                          <th className="px-6 py-4">Loaded Shops Stops</th>
                          <th className="px-6 py-4">Sourced Details</th>
                          <th className="px-6 py-4 text-right">Total Amount</th>
                          <th className="px-6 py-4 text-right">Worker Wages</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1f] text-xs">
                        {loadingHistory.map((t) => {
                          const lorry = lorryById(t.lorryId);
                          const totalWages = (t.workerPayments || []).reduce((s, w) => s + w.amount, 0);
                          const totalAmount = (t.stoneLines || []).reduce((s, line) => {
                            return s + ((line.sqftPerPiece || 0) * (line.pieces || 0) * (line.ratePerSqft || 0));
                          }, 0);
                          
                          const loadedShops = Array.from(new Set((t.stoneLines || []).map((line) => {
                            return allLoadingParties.find((lp) => lp.id === line.loadingPartyId)?.name || 'Ramapuram Shop';
                          }))).join(', ');

                          return (
                            <tr key={t.id} className="hover:bg-[#121215]/30 transition-colors">
                              <td className="px-6 py-4 text-neutral-400 font-medium">
                                {safeDateLocaleString(t.date)}
                              </td>
                              <td className="px-6 py-4 font-black text-white">{t.code}</td>
                              <td className="px-6 py-4 font-mono font-bold text-neutral-300">{lorry?.plate || 'Awaiting'}</td>
                              <td className="px-6 py-4 text-neutral-400 italic max-w-[150px] truncate" title={loadedShops}>
                                {loadedShops || 'Direct Load'}
                              </td>
                              <td className="px-6 py-4 max-w-[320px]">
                                {(t.stoneLines || []).length === 0 ? (
                                  <span className="text-[10px] text-neutral-600 italic">No stones loaded</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {(t.stoneLines || []).map((line, idx) => {
                                      const lineAmount = (line.sqftPerPiece || 0) * (line.pieces || 0) * (line.ratePerSqft || 0);
                                      return (
                                        <span key={idx} className="inline-flex items-center gap-1 bg-[#121215] px-2.5 py-0.5 rounded-lg text-[10px] border border-neutral-900 text-neutral-400 font-bold font-mono">
                                          <span>{line.size} ({line.pieces} pcs)</span>
                                          <span className="h-2 w-px bg-[#1a1a1f]" />
                                          <span className="text-gold">{formatINR(lineAmount)}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-white font-mono">{formatINR(totalAmount)}</td>
                              <td className="px-6 py-4 text-right font-black text-gold font-mono">{formatINR(totalWages)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-3xl"
            >
              {/* Profile Account Details form */}
              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 shadow-lg">
                <div className="border-b border-[#1a1a1f] pb-4 mb-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Operations Supervisor Profile</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Manage supervisor contact details and operational parameters.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Username / Login Email
                      </label>
                      <input
                        type="text"
                        disabled
                        value={username}
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0a0a0c] py-3 px-4 text-xs text-neutral-500 cursor-not-allowed outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Operations Role
                      </label>
                      <div className="w-full flex items-center justify-between rounded-xl border border-[#1a1a1f] bg-[#0a0a0c] py-3 px-4 text-xs font-bold font-mono">
                        <span className="text-neutral-300 uppercase">
                          {userRole}
                        </span>
                        <span className="rounded bg-gold/10 text-gold px-2.5 py-0.5 text-[9px] font-black uppercase border border-gold/25 tracking-wider">
                          Supervisor
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0c0c0e] py-3 px-4 text-xs font-bold text-white focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0c0c0e] py-3 px-4 text-xs font-bold text-white focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#1a1a1f] pt-4 mt-2">
                    <button
                      type="submit"
                      disabled={loadingProfile}
                      className="flex items-center gap-2 rounded-xl bg-gold hover:opacity-90 active:scale-[0.98] text-[#0d0d0f] py-3 px-5 text-xs font-extrabold transition-all disabled:opacity-50 shadow-md shadow-gold/10"
                    >
                      <Save className="h-4 w-4" />
                      {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password update form */}
              <div className="rounded-2xl border border-[#1a1a1f] bg-[#0d0d0f] p-6 shadow-lg">
                <div className="border-b border-[#1a1a1f] pb-4 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Update Portal Password</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Change the secure credentials used to log into this supervisor portal.
                    </p>
                  </div>
                  <Lock className="h-6 w-6 text-neutral-600 shrink-0" />
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Current Account Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0c0c0e] py-3 px-4 text-xs text-white focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        New Portal Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0c0c0e] py-3 px-4 text-xs text-white focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#1a1a1f] bg-[#0c0c0e] py-3 px-4 text-xs text-white focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#1a1a1f] pt-4 mt-2">
                    <button
                      type="submit"
                      disabled={loadingProfile}
                      className="flex items-center gap-2 rounded-xl border border-[#1a1a1f] hover:border-gold text-neutral-200 hover:text-[#0d0d0f] hover:bg-gold py-3 px-5 text-xs font-extrabold transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      <Lock className="h-4 w-4" />
                      {loadingProfile ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

        </main>

      </div>

      {/* Add Quarry Modal */}
      <AnimatePresence>
        {showAddQuarryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddQuarryModal(false)}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-[#0d0d0f] border border-[#1a1a1f] rounded-2xl p-6 shadow-2xl space-y-4 pointer-events-auto text-neutral-200"
              >
                <div className="flex justify-between items-center border-b border-[#1a1a1f] pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-gold" /> Add New Loading Quarry
                  </h3>
                  <button
                    onClick={() => setShowAddQuarryModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1a1a1f] text-neutral-400 hover:text-white bg-neutral-900/50 hover:bg-[#1a1a1f] transition-all"
                  >
                    ✕
                  </button>
                </div>

                {modalError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs text-red-300 font-bold">
                    {modalError}
                  </div>
                )}

                {modalSuccess && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/25 px-3.5 py-2.5 text-xs text-green-300 font-bold">
                    Quarry registered successfully!
                  </div>
                )}

                <form onSubmit={handleAddQuarry} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-neutral-500">Quarry Name</label>
                    <input
                      type="text"
                      required
                      value={newQuarryName}
                      onChange={(e) => setNewQuarryName(e.target.value)}
                      placeholder="e.g. Sri Balaji Quarry Unit 2"
                      className="w-full rounded-lg border border-[#1a1a1f] bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-neutral-500">Location</label>
                    <input
                      type="text"
                      required
                      value={newQuarryLocation}
                      onChange={(e) => setNewQuarryLocation(e.target.value)}
                      placeholder="e.g. Ramapuram East"
                      className="w-full rounded-lg border border-[#1a1a1f] bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-neutral-500">Total Purchased (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={newQuarryPurchased}
                        onChange={(e) => setNewQuarryPurchased(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#1a1a1f] bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-neutral-500">Paid Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={newQuarryPaid}
                        onChange={(e) => setNewQuarryPaid(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#1a1a1f] bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-[#1a1a1f]">
                    <button
                      type="button"
                      onClick={() => setShowAddQuarryModal(false)}
                      className="rounded-xl border border-[#1a1a1f] px-4 py-2 text-xs font-semibold hover:bg-neutral-900 transition-colors pointer-events-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 transition-colors pointer-events-auto"
                    >
                      Save Quarry
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
