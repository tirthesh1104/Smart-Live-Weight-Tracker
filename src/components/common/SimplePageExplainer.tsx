import React, { useState } from 'react';
import { 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface SimplePageExplainerProps {
  pageKey: 'passenger' | 'simulator' | 'monitoring' | 'display' | 'admin' | 'reports' | 'feedback' | 'dashboard' | 'help';
  onOpenHowToUse?: () => void;
}

export const SimplePageExplainer: React.FC<SimplePageExplainerProps> = ({ pageKey, onOpenHowToUse }) => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showGlossary, setShowGlossary] = useState(false);

  // Dynamic guides based on language and pageKey
  const guides: Record<string, {
    title: { en: string; mr: string };
    whatIsThis: { en: string; mr: string };
    whatCanIDo: { en: string; mr: string };
    howToUse: { en: string; mr: string };
    quickTip: { en: string; mr: string };
  }> = {
    passenger: {
      title: { 
        en: "Simple Guide: Passenger Coach Status & Crowd Finder", 
        mr: "सोपे मार्गदर्शन: प्रवासी डब्याची गर्दी आणि उपलब्ध जागा तपासा" 
      },
      whatIsThis: { 
        en: "This page shows you how full each train coach is before you board, so you can find a comfortable seat.", 
        mr: "गाडीत चढण्यापूर्वी कोणता डबा किती भरला आहे हे हे पान दाखवते, जेणेकरून तुम्हाला बसायला मोकळी जागा मिळेल." 
      },
      whatCanIDo: { 
        en: "Search your train, see which coaches have available seats (green), and get smart recommendations.", 
        mr: "तुमची गाडी शोधा, कोणत्या डब्यात जागा शिल्लक आहे (हिरवा रंग) ते पहा आणि उत्तम डबा निवडा." 
      },
      howToUse: { 
        en: "1. Type your train number/name in the search box. 2. Look at the train coaches below. 3. Green = space available, Yellow = crowded, Red = very crowded.", 
        mr: "१. शोध पेटीत गाडी क्रमांक किंवा नाव टाका. २. खाली दिसणारे डबे पहा. ३. हिरवा = बसायला जागा आहे, पिवळा = मध्यम गर्दी, लाल = जास्त गर्दी." 
      },
      quickTip: {
        en: "Tip: Look for the 'Recommended Coach' card. It tells you the nearest coach with the most free space!",
        mr: "टीप: 'शिफारस केलेला डबा' कार्ड पहा. तो तुम्हाला सर्वात जास्त मोकळी जागा असलेला जवळचा डबा दाखवतो!"
      }
    },
    simulator: {
      title: { 
        en: "Simple Guide: Practice & Testing Sensor Simulator (Zero Hardware)", 
        mr: "सोपे मार्गदर्शन: सराव आणि चाचणी सिम्युलेटर (कोणतेही उपकरण विकत घेण्याची गरज नाही)" 
      },
      whatIsThis: { 
        en: "This is a safe practice sandbox. You can test coach weight and crowd scenarios without physical hardware.", 
        mr: "खरे उपकरण किंवा सेन्सर नसले तरी सराव करण्यासाठी ही चाचणी स्क्रीन आहे. येथे तुम्ही नमुना वजन टाकून पाहू शकता." 
      },
      whatCanIDo: { 
        en: "Click any sample scenario (like 'Normal Crowd' or 'Overloaded') or move the weight slider to see what happens.", 
        mr: "कोणतेही बटण दाबा (उदा. 'सामान्य गर्दी' किंवा 'ओव्हरलोड') किंवा स्लाइडर हलवून वजनाचा परिणाम पहा." 
      },
      howToUse: { 
        en: "1. Click a scenario button below. 2. Watch the coach weight change. 3. Open Passenger or Staff screen to see live updates.", 
        mr: "१. खालीलपैकी कोणतेही परिस्थिती बटण दाबा. २. डब्याचे वजन कसे बदलते ते पहा. ३. पॅसेंजर किंवा स्टाफ स्क्रीन उघडून बदल तपासा." 
      },
      quickTip: {
        en: "Every value here is clearly marked as 'SIMULATED DATA' for college and academic demonstration.",
        mr: "येथील सर्व आकडे 'सिम्युलेटेड डेटा' (नमुना माहिती) म्हणून स्पष्ट दाखवले जातात, जे शैक्षणिक प्रात्यक्षिकासाठी सुरक्षित आहे."
      }
    },
    monitoring: {
      title: { 
        en: "Simple Guide: Staff Coach Weight & Safety Desk", 
        mr: "सोपे मार्गदर्शन: कर्मचाऱ्यांसाठी डबा वजन आणि सुरक्षा तपासणी" 
      },
      whatIsThis: { 
        en: "This screen is designed for railway staff and ticket checkers to verify coach load and safety limits.", 
        mr: "रेल्वे कर्मचारी आणि टीटीई (TTE) साठी डब्याचे सुरक्षित वजन आणि गर्दी तपासण्यासाठी ही स्क्रीन आहे." 
      },
      whatCanIDo: { 
        en: "Check if coaches are within safe limits, see overload alarms if weight gets too high, and report incidents.", 
        mr: "डब्याचे वजन सुरक्षित मर्यादेत आहे का ते तपासा, जास्त वजन झाल्यास इशारा पहा आणि घटनेची नोंद करा." 
      },
      howToUse: { 
        en: "1. Pick your assigned train. 2. Check the weight meter. 3. If a coach turns red (>100%), take crowd management action.", 
        mr: "१. नेमून दिलेली गाडी निवडा. २. वजन काटा तपासा. ३. जर डबा लाल झाला (>१००%), तर गर्दी नियंत्रणाची कारवाई करा." 
      },
      quickTip: {
        en: "Staff can view the Tare Weight (empty coach) vs Gross Weight (total coach + passengers).",
        mr: "कर्मचारी डब्याचे मूळ वजन (रिकामे) आणि एकूण वजन (प्रवाशांसह) स्वतंत्रपणे पाहू शकतात."
      }
    },
    display: {
      title: { 
        en: "Simple Guide: Station Platform Big Screen Display", 
        mr: "सोपे मार्गदर्शन: स्थानकावरील डिजिटल माहिती फलक (टीव्ही स्क्रीन)" 
      },
      whatIsThis: { 
        en: "This view is designed for big digital LED/TV displays placed on railway platforms.", 
        mr: "रेल्वे स्थानकांवरील प्लॅटफॉर्मवर लावलेल्या मोठ्या एलईडी/टीव्ही स्क्रीनसारखा हा फलक आहे." 
      },
      whatCanIDo: { 
        en: "Show passengers standing on the platform which coach will stop in front of them and how crowded it is.", 
        mr: "प्लॅटफॉर्मवर थांबलेल्या प्रवाशांना कोणता डबा कुठे थांबणार आणि त्यात किती गर्दी आहे हे मोठ्या अक्षरांमध्ये दाखवा." 
      },
      howToUse: { 
        en: "Click 'Fullscreen' for big display mode. Green coaches mean space is available to sit comfortably.", 
        mr: "मोठ्या पडद्यावर दाखवण्यासाठी 'फुलस्क्रीन' दाबा. हिरव्या डब्यांमध्ये बसायला पुरेशी जागा उपलब्ध असते." 
      },
      quickTip: {
        en: "High-contrast colors make it easy to read from a distance even in bright sunlight.",
        mr: "उन्हात किंवा लांबूनही स्पष्ट दिसावे म्हणून उच्च कॉन्ट्रास्ट रंगांचा वापर केला आहे."
      }
    },
    admin: {
      title: { 
        en: "Simple Guide: Administrator Control & Management Center", 
        mr: "सोपे मार्गदर्शन: प्रशासक नियंत्रण आणि व्यवस्थापन केंद्र" 
      },
      whatIsThis: { 
        en: "The master control console for railway administrators to oversee all trains, users, and grievances.", 
        mr: "सर्व गाड्या, वापरकर्ते आणि तक्रारींवर नियंत्रण ठेवण्यासाठी हे प्रशासकीय मुख्य केंद्र आहे." 
      },
      whatCanIDo: { 
        en: "Manage train fleet records, view system security logs, and review or solve user complaints.", 
        mr: "गाड्यांची माहिती व्यवस्थापित करा, सुरक्षा लॉग तपासा आणि आलेल्या तक्रारी सोडवा." 
      },
      howToUse: { 
        en: "1. Login with Admin email and 6-digit PIN (123456). 2. Switch tabs above to manage Fleet, Users, or Feedback.", 
        mr: "१. ॲडमिन ईमेल आणि ६-अंकी पिन (123456) टाकून लॉग इन करा. २. गाड्या, युजर्स किंवा तक्रारी तपासण्यासाठी वरील टॅब वापरा." 
      },
      quickTip: {
        en: "Security note: Admin requires a 6-digit PIN in addition to the password for safety.",
        mr: "सुरक्षा सूचना: सुरक्षिततेसाठी पासवर्डसोबत ६-अंकी सुरक्षा पिन आवश्यक आहे."
      }
    },
    reports: {
      title: { 
        en: "Simple Guide: Reports & Viva Demonstration Data Export", 
        mr: "सोपे मार्गदर्शन: अहवाल आणि प्रात्यक्षिक माहिती डाऊनलोड" 
      },
      whatIsThis: { 
        en: "A reporting page where you can view data tables and download official CSV spreadsheets.", 
        mr: "माहितीचे तक्ते पाहण्यासाठी आणि अधिकृत सीएसव्ही (CSV) स्प्रेडशीट डाऊनलोड करण्यासाठी हे पान आहे." 
      },
      whatCanIDo: { 
        en: "Download train fleet records, incident logs, and AI forecast accuracy tables (MAE/RMSE) for viva evaluation.", 
        mr: "गाड्यांची यादी, सुरक्षेच्या नोंदी आणि AI अचूकता तपासणी तक्ता (MAE/RMSE) डाऊनलोड करा." 
      },
      howToUse: { 
        en: "1. Select the report type. 2. Click 'Download Report (CSV)' to save a spreadsheet or 'Print' for paper copy.", 
        mr: "१. अहवालाचा प्रकार निवडा. २. फाइल सेव्ह करण्यासाठी 'अहवाल डाऊनलोड करा (CSV)' किंवा 'प्रिंट' दाबा." 
      },
      quickTip: {
        en: "Teachers & Examiners: The AI Prediction Accuracy table proves the mathematical validity of the software.",
        mr: "परीक्षक व शिक्षकांसाठी: AI अचूकता तक्ता सॉफ्टवेअरची गणिती सत्यता सिद्ध करतो."
      }
    },
    feedback: {
      title: { 
        en: "Simple Guide: Feedback, Grievances & Improvement Suggestions", 
        mr: "सोपे मार्गदर्शन: अभिप्राय, अडचणी आणि सूचना निवारण कक्ष" 
      },
      whatIsThis: { 
        en: "A helpful desk where anyone—passengers, staff, or college guides—can share problems or suggestions.", 
        mr: "प्रवासी, रेल्वे कर्मचारी किंवा कॉलेज शिक्षक आपली अडचण किंवा सूचना मांडू शकतील असा हा मदत कक्ष आहे." 
      },
      whatCanIDo: { 
        en: "Submit a problem, receive an official tracking ticket (e.g. FB-2026-0004), and get administrator responses.", 
        mr: "तक्रार नोंदवा, अधिकृत तिकीट क्रमांक मिळवा (उदा. FB-2026-0004) आणि प्रशासनाचे उत्तर तपासा." 
      },
      howToUse: { 
        en: "1. Fill the simple form. 2. Click 'Submit Feedback'. 3. Track the status under 'My Submissions'.", 
        mr: "१. सोपा फॉर्म भरा. २. 'सूचना पाठवा' वर क्लिक करा. ३. 'माझ्या तक्रारी' टॅबमध्ये स्थिती तपासा." 
      },
      quickTip: {
        en: "Administrators can review tickets, update status to 'Under Review', and write official responses.",
        mr: "प्रशासक तिकीट तपासून स्थिती 'तपासणी सुरू' करू शकतात आणि अधिकृत उत्तर लिहू शकतात."
      }
    },
    dashboard: {
      title: { 
        en: "Simple Guide: Master Unified Dashboard", 
        mr: "सोपे मार्गदर्शन: एकत्रित मुख्य नियंत्रण फलक" 
      },
      whatIsThis: { 
        en: "A combined view that brings together all key information in one convenient place.", 
        mr: "सर्व महत्त्वाची माहिती एकाच सोप्या ठिकाणी दाखवणारा हा एकत्रित फलक आहे." 
      },
      whatCanIDo: { 
        en: "See how many trains are running, total coaches monitored, and live overload alerts.", 
        mr: "किती गाड्या सुरू आहेत, एकूण किती डबे तपासले जात आहेत आणि थेट इशारे एका दृष्टीक्षेपात पहा." 
      },
      howToUse: { 
        en: "Scan the quick numbers at the top, then click on any train to inspect detailed coach weights.", 
        mr: "वर दिलेले मुख्य आकडे पहा, त्यानंतर सविस्तर वजन तपासण्यासाठी कोणत्याही गाडीवर क्लिक करा." 
      },
      quickTip: {
        en: "Everything updates automatically every 3 seconds with zero manual refreshing needed.",
        mr: "कोणतेही बटण न दाबता प्रत्येक ३ सेकंदांनी माहिती आपोआप ताजी होते."
      }
    },
    help: {
      title: { 
        en: "Simple Guide: System Overview & Viva Presentation Explanations", 
        mr: "सोपे मार्गदर्शन: प्रकल्पाचे सोपे स्पष्टीकरण आणि प्रात्यक्षिक मार्गदर्शक" 
      },
      whatIsThis: { 
        en: "Everything you need to know about the Smart Live Weight Tracker explained in simple, everyday language.", 
        mr: "स्मार्ट लाईव्ह वजन ट्रॅकरबद्दल सर्व माहिती अत्यंत सोप्या आणि दैनंदिन भाषेत समजावून सांगणारे हे पान आहे." 
      },
      whatCanIDo: { 
        en: "Read first-time user guides, understand simple definitions, and use the 2-minute student speech script.", 
        mr: "वापरकर्ता मार्गदर्शक वाचा, सोप्या व्याख्या समजून घ्या आणि २ मिनिटांचे विद्यार्थी सादरीकरण भाषण पहा." 
      },
      howToUse: { 
        en: "Browse the tabs below or click 'How to Use This Website' anytime for a step-by-step walkthrough.", 
        mr: "खालील विभाग वाचा किंवा पायरी-दर-पायरी माहितीसाठी 'ही वेबसाइट कशी वापरायची' वर क्लिक करा." 
      },
      quickTip: {
        en: "You can explain this entire project in plain language without getting confused by technical jargon!",
        mr: "कठीण तांत्रिक शब्दांशिवाय तुम्ही हा संपूर्ण प्रकल्प कोणालाही अगदी सोप्या भाषेत समजावून सांगू शकता!"
      }
    }
  };

  const g = guides[pageKey] || guides.passenger;
  const isMr = language === 'mr';

  // Technical terms dictionary for quick lookup
  const glossaryItems = [
    { 
      term: isMr ? "डब्याची भरलेली क्षमता (Occupancy)" : "Coach Occupancy", 
      desc: isMr ? "डब्यात किती गर्दी आहे ते दाखवणारी टक्केवारी (उदा. ५०% म्हणजे अर्धा डबा भरला आहे)." : "Percentage showing how full the coach is (e.g. 50% means half full)." 
    },
    { 
      term: isMr ? "डब्याचे मूळ वजन (Tare Weight)" : "Tare Weight (Empty)", 
      desc: isMr ? "एकही प्रवासी नसताना डब्याचे मूळ लोखंडी वजन (उदा. स्लीपर डबा = ४०,५०० किलो)." : "Certified weight of the empty train coach without any passengers or bags." 
    },
    { 
      term: isMr ? "एकूण वजन (Gross Weight)" : "Gross Weight (Total)", 
      desc: isMr ? "डब्याचे मूळ वजन अधिक सर्व प्रवासी आणि त्यांच्या सामानाचे एकत्रित वजन." : "Total combined weight of empty coach plus all passengers and luggage." 
    },
    { 
      term: isMr ? "ओव्हरलोड (Overload)" : "Overload Alert", 
      desc: isMr ? "डब्यात प्रवाशांचे वजन सुरक्षित क्षमतेपेक्षा जास्त झाल्यास दिलेला सावधानतेचा इशारा." : "Warning triggered when total weight exceeds safe mechanical limits." 
    },
    { 
      term: isMr ? "सिम्युलेशन (Simulation)" : "Simulation (Sample Testing)", 
      desc: isMr ? "खरे सेन्सर न वापरता संगणकावर नमुना माहिती वापरून सुरक्षित सराव करण्याची सोय." : "Testing and practice using sample software data without requiring physical hardware." 
    },
    { 
      term: isMr ? "AI अंदाज (AI Prediction)" : "AI Crowd Prediction", 
      desc: isMr ? "पुढील १५, ३० किंवा ६० मिनिटांत डब्यात किती गर्दी होऊ शकते याचा गणिती अंदाज." : "Mathematical forecast estimating how crowded the coach may become in 15, 30 or 60 mins." 
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 rounded-md shadow-xs p-3.5 mb-4 transition-all">
      
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lightbulb className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {isMr ? "सोपे मार्गदर्शन" : "Simple Guide"}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isMr ? "पहिलीच वेळ? हे वाचा" : "First time here? Read this"}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {isMr ? g.title.mr : g.title.en}
            </h2>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenHowToUse && (
            <button
              onClick={onOpenHowToUse}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xs bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-xs transition"
              title={isMr ? "संपूर्ण वापर पुस्तिका उघडा" : "Open Step-by-Step User Guide"}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isMr ? "कशी वापरावी? (मार्गदर्शक)" : "How to Use (Guide)"}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xs cursor-pointer transition"
            aria-label="Toggle Guide Visibility"
          >
            <span>{isExpanded ? (isMr ? "लपवा" : "Hide") : (isMr ? "पहा" : "Show")}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-slate-700/80 space-y-3">
          
          {/* 3 Simple Column Questions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Box 1: What is this page? */}
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-sm border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center justify-center text-[10px] font-bold">१</span>
                <span>{isMr ? "ही स्क्रीन काय आहे?" : "What is this page?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr ? g.whatIsThis.mr : g.whatIsThis.en}
              </p>
            </div>

            {/* Box 2: What can I do here? */}
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-sm border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 flex items-center justify-center text-[10px] font-bold">२</span>
                <span>{isMr ? "येथे मी काय करू शकतो?" : "What can I do here?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr ? g.whatCanIDo.mr : g.whatCanIDo.en}
              </p>
            </div>

            {/* Box 3: How do I use it? */}
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-sm border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px] font-bold">३</span>
                <span>{isMr ? "हे कसे वापरावे?" : "How do I use it?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr ? g.howToUse.mr : g.howToUse.en}
              </p>
            </div>

          </div>

          {/* Quick Tip Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isMr ? g.quickTip.mr : g.quickTip.en}</span>
            </div>

            {/* Technical Terms Helper Toggle */}
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>
                {showGlossary 
                  ? (isMr ? "कठीण शब्दांचे अर्थ लपवा" : "Hide Word Explanations") 
                  : (isMr ? "कठीण शब्दांचे सोपे अर्थ पहा" : "Need help with words? (Tare, Gross, Occupancy)")}
              </span>
            </button>
          </div>

          {/* Collapsible Word Glossary */}
          {showGlossary && (
            <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-600 animate-fadeIn">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>{isMr ? "दैनंदिन भाषेतील सोपे शब्दकोश:" : "Everyday Explanations of Technical Words:"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {glossaryItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xs border border-slate-200 dark:border-slate-600 text-xs">
                    <span className="font-bold text-[#003366] dark:text-blue-300 block mb-0.5">
                      {item.term}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 leading-snug">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
