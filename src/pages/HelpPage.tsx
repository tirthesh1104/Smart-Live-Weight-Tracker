import React, { useState } from 'react';
import { 
  HelpCircle, 
  Info, 
  Scale, 
  Radio, 
  ShieldAlert, 
  CheckCircle, 
  BookOpen, 
  ExternalLink,
  Layers,
  Cpu,
  Sparkles,
  Volume2,
  Award,
  ArrowRight,
  Train as TrainIcon,
  Users,
  Sliders,
  FileText,
  Key,
  TrendingUp,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { SimplePageExplainer } from '../components/common/SimplePageExplainer';

export const HelpPage: React.FC = () => {
  const { language } = useLanguage();
  const isMr = language === 'mr';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'plain' | 'speech' | 'steps' | 'technical'>('plain');
  const [copiedSpeech, setCopiedSpeech] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSpeech(id);
    setTimeout(() => setCopiedSpeech(null), 2500);
  };

  const englishSpeech = `Respected Teachers & Examiners,
Today I am presenting the Smart Live Weight Tracker. In Indian Railways, train coaches like General and Sleeper get heavily overcrowded, and commuters crowd near the foot-over bridges while end coaches stay half-empty.

How our software solves this:
By measuring the weight on the coach suspension, our software automatically calculates how full the coach is and estimates the passenger count. If a coach exceeds safe weight, a red overload alarm alerts the staff.

Key Features:
1. Passenger Guidance: Shows green for empty coaches so passengers know where to stand before the train arrives.
2. Zero-Hardware Simulator: We built a 10-scenario testing simulator, so physical hardware purchases are not needed for demonstration.
3. AI Crowd Prediction: Estimates crowd levels 15, 30, and 60 minutes into the future with verified 1.48% error.
4. Feedback Desk: Passengers, staff, and faculty can submit issues and get official ticket resolutions.

In conclusion, this is a complete, working software solution for railway passenger safety and comfort. Thank you!`;

  const marathiSpeech = `आदरणीय शिक्षक आणि परीक्षक महोदय,
मी आज स्मार्ट लाईव्ह वजन ट्रॅकर प्रकल्प सादर करत आहे. भारतीय रेल्वेमध्ये जनरल आणि स्लीपर डब्यांमध्ये खूप गर्दी होते, आणि पुलाजवळचे डबे जास्त भरतात तर पुढचे-मागचे डबे रिकामे राहतात.

आमचे सॉफ्टवेअर कशी मदत करते:
डब्याच्या वजनावरून हे सॉफ्टवेअर डबा किती भरला आहे ते मोजते आणि प्रवाशांच्या संख्येचा अंदाज काढते. वजन जास्त झाल्यास कर्मचाऱ्यांना लाल रंगाचा ओव्हरलोड इशारा मिळतो.

मुख्य वैशिष्ट्ये:
१. प्रवासी मार्गदर्शन: हिरव्या रंगाने रिकामे डबे दाखवून प्रवाशांना योग्य डबा निवडण्यास मदत करते.
२. सॉफ्टवेअर सिम्युलेटर: कोणत्याही महागड्या उपकरणांशिवाय १० विविध गर्दीच्या परिस्थिती तपासता येतात.
३. AI गर्दी अंदाज: पुढील १५, ३० व ६० मिनिटांतील गर्दीचा आधीच अंदाज वर्तवते.
४. तक्रार निवारण कक्ष: प्रवासी व शिक्षकांना अडचणी मांडता येतात व ट्रॅकिंग नंबर मिळतो.

थोडक्यात सांगायचे तर, हा प्रकल्प रेल्वे प्रवास सुरक्षित आणि सुलभ करणारा एक परिपूर्ण सॉफ्टवेअर प्रोटोटाइप आहे. धन्यवाद!`;

  return (
    <div className="space-y-5 py-4">
      
      {/* Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Indian Railways Portal Services &bull; Documentation &amp; User Manual
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          {isMr ? "प्रकल्प माहिती, सोपे मार्गदर्शन आणि सादरीकरण मदत" : "Portal User Guide, Simple Explanations & Viva Presentation Help"}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          {isMr 
            ? "सर्वसामान्य नागरिकांसाठी, विद्यार्थ्यांसाठी आणि परीक्षकांसाठी सोप्या दैनंदिन भाषेतील सर्वसमावेशक मार्गदर्शक."
            : "Everyday language explanations, student viva presentation speeches, and 10-step walkthroughs."}
        </p>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Simple Page Explainer for Help Page */}
      <SimplePageExplainer pageKey="help" />

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 rounded-t-md px-3 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('plain')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'plain'
              ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isMr ? "१. सोप्या भाषेत प्रकल्प समजून घ्या" : "1. Project in Plain Words"}
        </button>

        <button
          onClick={() => setActiveTab('speech')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'speech'
              ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>{isMr ? "२. विद्यार्थ्यांसाठी २ मिनिटांचे सादरीकरण भाषण" : "2. 2-Min Student Viva Speech"}</span>
        </button>

        <button
          onClick={() => setActiveTab('steps')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'steps'
              ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isMr ? "३. १० पायऱ्यांचे वापरकर्ता मार्गदर्शन" : "3. 10-Step How-To Guide"}
        </button>

        <button
          onClick={() => setActiveTab('technical')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'technical'
              ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isMr ? "४. तांत्रिक सूत्रे आणि मानके" : "4. Technical Formulas & Standards"}
        </button>
      </div>

      {/* TAB 1: PROJECT IN PLAIN WORDS */}
      {activeTab === 'plain' && (
        <div className="space-y-4">
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md">
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isMr ? "प्रकल्पाचे सोपे आणि दैनंदिन भाषेतील स्वरूप" : "Project Overview in Simple Everyday Language"}</span>
            </h2>
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              {isMr 
                ? "हा प्रकल्प कोणत्याही सामान्य नागरिकाला, नवशिक्याला किंवा शिक्षकांना सहज समजावून सांगता यावा म्हणून येथे ७ प्रमुख प्रश्नांची उत्तरे अगदी सोप्या शब्दांत दिली आहेत."
                : "Even a first-time user or person without a computer background can understand what this software does by reading these 7 simple questions and answers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Q1 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">१</span>
                <span>{isMr ? "आम्ही कोणती समस्या सोडवण्याचा प्रयत्न करत आहोत?" : "What problem are we trying to solve?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "भारतीय रेल्वेमध्ये जनरल आणि स्लीपर डब्यांमध्ये खूप भयानक गर्दी होते. पुलाजवळचे डबे प्रवाशांनी तुडुंब भरतात, तर पुढचे आणि मागचे डबे रिकामे राहतात. स्थानक प्रमुखांकडे डब्यात किती वजन किंवा गर्दी आहे हे पाहण्याची कोणतीही सोय नसते."
                  : "Train coaches often suffer from dangerous overcrowding. Passengers crowd near station foot-over bridges while forward and rear coaches remain half-empty. Station managers have zero real-time visibility into actual coach occupancy."}
              </p>
            </div>

            {/* Q2 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">२</span>
                <span>{isMr ? "हे सॉफ्टवेअर कशी मदत करते?" : "How does this software help?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "डब्याच्या स्प्रिंगवर पडणाऱ्या वजनावरून हे सॉफ्टवेअर प्रवासी किती भरले आहेत याचा अचूक अंदाज काढते. गाडी स्थानकात येण्यापूर्वीच प्रवाशांना स्क्रीनवर हिरवा रंग दाखवून मोकळ्या डब्याकडे जाण्यास सांगते आणि डबा ओव्हरलोड झाल्यास इशारा देते."
                  : "By measuring load on the coach suspension, this software calculates how full the coach is and estimates passenger count. It guides commuters to less crowded coaches (green) before the train docks and flags overload hazards."}
              </p>
            </div>

            {/* Q3 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">३</span>
                <span>{isMr ? "स्वतः वजन टाकून तपासण्याची पद्धत (Manual Weight) कशी चालते?" : "How does manual weight entry work?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "सिम्युलेटर पानावर जाऊन तुम्ही स्लाइडर हलवून किंवा स्वतः वजन टाईप करून पाहू शकता. तुम्ही वजन वाढवले की प्रवासी संख्या वाढते आणि डब्याचा रंग हिरवा ➔ पिवळा ➔ लाल होतो."
                  : "On the Simulator page, you can drag a weight slider or type any test weight. As weight changes, the passenger headcount and color indicator (Green ➔ Yellow ➔ Red) update immediately in real time."}
              </p>
            </div>

            {/* Q4 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">४</span>
                <span>{isMr ? "सिम्युलेटर कशाचे प्रात्यक्षिक दाखवतो?" : "What does the simulator demonstrate?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "खरे सेन्सर विकत न घेता १० वेगवेगळ्या वास्तववादी परिस्थिती (उदा. रिकामी गाडी, सामान्य गर्दी, सणासुदीची गर्दी, ओव्हरलोड) एका क्लिकवर तपासून पाहता येतात."
                  : "It demonstrates 10 realistic situations (Empty Train, Normal Load, Festival Rush, Overloaded Coach) with one click—allowing full testing without purchasing expensive physical sensors."}
              </p>
            </div>

            {/* Q5 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">५</span>
                <span>{isMr ? "पुढील गर्दीचा AI अंदाज कसा काम करतो?" : "How does AI prediction work?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "स्थानकांवर प्रवासी कसे चढतात-उतरतात याचा कल पाहून सॉफ्टवेअर गणिती सूत्रांद्वारे पुढील १५, ३० आणि ६० मिनिटांनंतर डब्यात किती गर्दी होईल याचा आधीच अंदाज लावते."
                  : "The AI observes recent passenger boarding trends and calculates a mathematical forecast showing estimated crowd levels for the next 15, 30, and 60 minutes with a verified 1.48% error rate."}
              </p>
            </div>

            {/* Q6 */}
            <div className="gov-card p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">६</span>
                <span>{isMr ? "प्रशासक आणि कर्मचारी काय करू शकतात?" : "What can Admin and Staff do?"}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isMr 
                  ? "कर्मचारी डब्याचे वजन आणि सुरक्षेचे इशारे पाहू शकतात. प्रशासक संपूर्ण गाड्यांचे नेटवर्क तपासू शकतात, युजर्स मॅनेज करू शकतात आणि आलेल्या सर्व तक्रारी सोडवून उत्तरे पाठवू शकतात."
                  : "Staff monitor live weights and respond to overload alarms. Administrators oversee all trains, inspect security audit logs, and resolve user complaints through the Feedback Desk."}
              </p>
            </div>

          </div>

          {/* Q7: Limitations */}
          <div className="gov-card p-4 border-l-4 border-l-amber-500 space-y-1.5">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center text-xs font-bold">७</span>
              <span>{isMr ? "प्रकल्पाच्या मर्यादा काय आहेत?" : "What are the limitations?"}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {isMr 
                ? "हा एक स्वतंत्र शैक्षणिक व तंत्रज्ञान प्रोटोटाइप आहे. सध्या हा प्रत्यक्ष धावणाऱ्या भारतीय रेल्वेच्या ट्रॅकशी किंवा CRIS सर्व्हरशी जोडलेला नाही. सर्व वजन आणि आकडे सिम्युलेटरद्वारे अभ्यास आणि चाचणीसाठी तयार केले आहेत."
                : "This is an independent academic engineering prototype. It is not currently connected to live physical train bogies or official CRIS/IRCTC servers. All telemetry is generated via the software simulator for demonstration."}
            </p>
          </div>

        </div>
      )}

      {/* TAB 2: 2-MINUTE STUDENT VIVA SPEECH */}
      {activeTab === 'speech' && (
        <div className="space-y-4">
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-md">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 mb-1">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold">
                {isMr ? "विद्यार्थ्यांसाठी परीक्षकांसमोर २ मिनिटांचे सादरीकरण भाषण" : "2-Minute Word-for-Word Viva Presentation Speech"}
              </h2>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {isMr 
                ? "परीक्षकांनी 'तुमचा प्रकल्प काय आहे?' असे विचारल्यास तुम्ही न घाबरता खालील भाषण जसेच्या तसे बोलू शकता. इंग्रजी आणि मराठी दोन्ही पर्याय खाली उपलब्ध आहेत."
                : "When your external examiner or teacher says 'Explain your project in 2 minutes', you can speak these exact structured points with total confidence."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* English Speech Card */}
            <div className="gov-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#003366] dark:text-blue-300">
                    English Speech (For External Viva)
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(englishSpeech, 'en')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition border border-slate-300 dark:border-slate-700"
                >
                  {copiedSpeech === 'en' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSpeech === 'en' ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {englishSpeech}
              </div>
            </div>

            {/* Marathi Speech Card */}
            <div className="gov-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#003366] dark:text-blue-300">
                    मराठी सादरीकरण भाषण (सोप्या भाषेत)
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(marathiSpeech, 'mr')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition border border-slate-300 dark:border-slate-700"
                >
                  {copiedSpeech === 'mr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSpeech === 'mr' ? "कॉपी झाले!" : "मजकूर कॉपी करा"}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {marathiSpeech}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: 10-STEP HOW-TO GUIDE */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-md">
            <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mb-1">
              {isMr ? "१० सोप्या पायऱ्यांमध्ये संपूर्ण वेबसाइटचा वापर शिका" : "Learn to Use the Entire Website in 10 Easy Steps"}
            </h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              {isMr 
                ? "खालील पायऱ्या एकामागून एक वाचा आणि कोणत्याही बटणावर क्लिक करून थेट त्या पानावर जा."
                : "Read the steps below in sequence and click the direct action buttons to try them live."}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                num: 1,
                title: isMr ? "१. वेबसाइट उघडा" : "1. Open the Website",
                desc: isMr ? "कोणत्याही संगणक किंवा मोबाईलवर वेबसाइट उघडा. वरच्या पट्टीवरून भाषा (मराठी/English) किंवा अक्षर आकार (A-, A, A+) बदला." : "Open the portal in any browser. Use top controls for language (English/मराठी) and font sizing (A-, A, A+).",
                route: "/",
                btn: isMr ? "मुख्य पानावर जा" : "Go to Home"
              },
              {
                num: 2,
                title: isMr ? "२. लॉगिन करा (तयार डेमो खाती)" : "2. How to Sign In (Demo Profiles)",
                desc: isMr ? "वर 'साइन इन' दाबा. प्रवासी, कर्मचारी, शिक्षक किंवा ॲडमिन निवडून तयार पासवर्ड (Demo@123) ने लॉग इन करा." : "Click 'Sign In'. Select role tab (Passenger, Staff, Faculty, or Admin) and use pre-filled Demo@123 passwords.",
                route: "/login",
                btn: isMr ? "लॉगिन पेज उघडा" : "Open Login"
              },
              {
                num: 3,
                title: isMr ? "३. गाडी शोधा आणि निवडा" : "3. Search & Select a Train",
                desc: isMr ? "प्रवासी पानावर शोध पेटीत १२१०१ किंवा स्थानक नाव टाईप करा. गाडीची संपूर्ण रचना व वेळापत्रक दिसेल." : "Type train number (e.g. 12101) or station name. Train route and coach formation will load.",
                route: "/passenger",
                btn: isMr ? "प्रवासी कक्ष उघडा" : "Open Passenger"
              },
              {
                num: 4,
                title: isMr ? "४. डबा निवडा आणि गर्दी पहा" : "4. Select a Coach & Check Crowd",
                desc: isMr ? "गाडीच्या रांगेत कोणत्याही डब्यावर (S1, S2, B1) क्लिक करा. डब्यातील प्रवासी संख्या आणि रिकामी जागा दिसेल." : "Click any coach icon (S1, S2, B1) to view estimated passenger headcount and available seats.",
                route: "/passenger",
                btn: isMr ? "डबे पहा" : "View Coaches"
              },
              {
                num: 5,
                title: isMr ? "५. स्वतः वजन टाकून चाचणी घ्या" : "5. Enter Weight Manually (Slider)",
                desc: isMr ? "सिम्युलेटरमध्ये जाऊन वजनाचा स्लाइडर हलवा. वजन वाढताच प्रवासी संख्या वाढते आणि गर्दीचा रंग बदलतो." : "In the Simulator, move the weight slider. Watch passenger count and occupancy update instantly.",
                route: "/simulator",
                btn: isMr ? "सिम्युलेटर उघडा" : "Open Simulator"
              },
              {
                num: 6,
                title: isMr ? "६. सराव परिस्थिती निवडा" : "6. Run Practice Scenarios (10 Presets)",
                desc: isMr ? "'रिकामी गाडी', 'सामान्य गर्दी' किंवा 'ओव्हरलोड' यांसारखी १-क्लिक बटणे दाबा आणि परिणाम पहा." : "Click 1-click buttons like 'Empty Coach', 'Normal Crowd', or 'Overloaded Example' to see live telemetry.",
                route: "/simulator",
                btn: isMr ? "परिस्थिती चाचणी" : "Try Scenarios"
              },
              {
                num: 7,
                title: isMr ? "७. रंगांचे अर्थ समजून घ्या" : "7. Understand Occupancy Colors",
                desc: isMr ? "हिरवा = बसायला भरपूर जागा, पिवळा = मध्यम गर्दी, लाल = जास्त गर्दी किंवा ओव्हरलोड इशारा." : "Green = seats available, Yellow = moderate crowd, Red = critical overload safety warning.",
                route: "/passenger",
                btn: isMr ? "तक्ता पहा" : "Check Heatmap"
              },
              {
                num: 8,
                title: isMr ? "८. पुढील गर्दीचा AI अंदाज पहा" : "8. View AI Crowd Predictions",
                desc: isMr ? "पुढील १५, ३० आणि ६० मिनिटांतील अंदाजित गर्दीचा तक्ता पहा. गाडी गर्दीच्या स्थानकाकडे जाताना अंदाज वर्तवला जातो." : "Inspect 15, 30, and 60-minute future forecasts showing predicted passenger surge.",
                route: "/passenger",
                btn: isMr ? "अंदाज पहा" : "View Forecast"
              },
              {
                num: 9,
                title: isMr ? "९. तक्रार किंवा सूचना पाठवा" : "9. Submit Feedback & Grievances",
                desc: isMr ? "'अभिप्राय आणि मदत' पानावर जाऊन अडचण नोंदवा. तुम्हाला FB-2026-XXXX असा तिकीट क्रमांक मिळेल." : "Open Feedback Desk to submit complaints or ideas. Receive trackable ticket ID like FB-2026-0004.",
                route: "/feedback",
                btn: isMr ? "तक्रार कक्ष उघडा" : "Open Feedback"
              },
              {
                num: 10,
                title: isMr ? "१०. अहवाल आणि माहिती डाऊनलोड करा" : "10. Download Operational Reports",
                desc: isMr ? "अहवाल पानावर जाऊन अधिकृत CSV स्प्रेडशीट किंवा AI अचूकता तक्ता (MAE: १.४८%) डाऊनलोड करा." : "Download official CSV reports and AI accuracy tables (MAE: 1.48% / RMSE: 2.12%) for evaluation.",
                route: "/reports",
                btn: isMr ? "अहवाल डाऊनलोड करा" : "Download Reports"
              }
            ].map(s => (
              <div key={s.num} className="gov-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-[#002244] dark:text-blue-300">
                    {s.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <button
                  onClick={() => navigate(s.route)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs bg-[#003366] text-white hover:bg-blue-900 cursor-pointer shrink-0 transition shadow-xs self-start sm:self-auto"
                >
                  <span>{s.btn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: TECHNICAL FORMULAS & STANDARDS */}
      {activeTab === 'technical' && (
        <div className="space-y-4">
          
          {/* Section 1: System Purpose & Architecture */}
          <div className="gov-card p-5 space-y-3">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                1. System Overview &amp; Operational Purpose
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              The <strong>Smart Live Weight Tracker</strong> is an engineering prototype designed to address platform crowd management, train coach load balancing, and commuter safety across passenger train rakes. By monitoring weight changes across individual coach bogies, the system computes real-time crowd distribution, warns railway safety personnel against structural overload, and directs boarding passengers to less-crowded coaches.
            </p>
          </div>

          {/* Section 2: Clarification of Telemetry Data Sources */}
          <div className="gov-card p-5 space-y-3">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                2. Telemetry Classification &amp; Data Source Taxonomy
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xs">
                  REAL DATA
                </span>
                <h3 className="font-bold text-[#002244] dark:text-blue-300">Physical Sensor Telemetry</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Live bogie strain gauge telemetry streamed from physical load cells installed on rolling stock. <em>Currently pending formal integration with CRIS / Railway Board databases.</em>
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-xs">
                  SIMULATED DATA
                </span>
                <h3 className="font-bold text-[#002244] dark:text-blue-300">Software Sensor Simulator</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Generated in real time via the isolated Software Bogie Simulator for engineering validation, load testing, and edge-case overload verification.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xs">
                  MANUAL ENTRY
                </span>
                <h3 className="font-bold text-[#002244] dark:text-blue-300">Station Supervisor Manual Registry</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Locally registered train rakes and coaches created by station superintendents or administrators for operational tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Weight and Occupancy Formulas */}
          <div className="gov-card p-5 space-y-3">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                3. Weight &amp; Capacity Evaluation Mathematics
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Coach occupancy percentage is computed using the official passenger payload formula:
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-[#002244] dark:text-blue-300 rounded-sm text-center">
              Occupancy % = ((Weight<sub>current</sub> &minus; Weight<sub>tare</sub>) / (Weight<sub>gross_max</sub> &minus; Weight<sub>tare</sub>)) &times; 100
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="p-2 border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">0% – 40%</span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Space Available</span>
              </div>
              <div className="p-2 border-l-4 border-amber-600 bg-amber-50 dark:bg-amber-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">41% – 75%</span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">Moderate Load</span>
              </div>
              <div className="p-2 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-orange-900 dark:text-orange-200 block">76% – 100%</span>
                <span className="text-[11px] text-orange-800 dark:text-orange-300">Full / Heavy</span>
              </div>
              <div className="p-2 border-l-4 border-rose-700 bg-rose-50 dark:bg-rose-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-rose-900 dark:text-rose-200 block">&gt; 100%</span>
                <span className="text-[11px] text-rose-800 dark:text-rose-300">Critical Overload</span>
              </div>
            </div>
          </div>

          {/* Section 4: GIGW 3.0 Accessibility Statement */}
          <div className="gov-card p-5 space-y-3">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                4. Accessibility &amp; Standards Compliance (GIGW 3.0)
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              This portal has been developed in accordance with the <strong>Guidelines for Indian Government Websites (GIGW 3.0)</strong> and WCAG 2.1 AA recommendations:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Keyboard Navigation:</strong> All interactive elements, buttons, and form inputs are navigable using standard keyboard TAB and ENTER controls.</li>
              <li><strong>Skip to Main Content:</strong> Direct anchor mechanism at the top of every screen to bypass repetitive navigation links.</li>
              <li><strong>Adjustable Font Scaling:</strong> Triple font-size switcher (A-, A, A+) provided in top bar.</li>
              <li><strong>Bilingual Support:</strong> Complete portal localization available in English and Marathi (मराठी).</li>
              <li><strong>Color Contrast Ratios:</strong> Text elements maintain a minimum 4.5:1 contrast ratio against background surfaces in both Light and Dark themes.</li>
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};
