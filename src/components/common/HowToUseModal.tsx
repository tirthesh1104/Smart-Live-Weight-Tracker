import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Sliders, 
  Scale, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Key, 
  Train as TrainIcon, 
  Tv, 
  ShieldAlert, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Award,
  Volume2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate?: (route: string) => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose, navigate }) => {
  const { language } = useLanguage();
  const isMr = language === 'mr';
  const [activeTab, setActiveTab] = useState<'steps' | 'speech' | 'faq'>('steps');
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      icon: TrainIcon,
      title: { en: "1. Open the Website", mr: "१. वेबसाइट उघडा" },
      summary: { 
        en: "Visit the website in any browser (Chrome, Edge, Firefox, Mobile).", 
        mr: "कोणत्याही संगणक किंवा मोबाईल ब्राउझरमध्ये ही वेबसाइट उघडा." 
      },
      details: {
        en: "The website runs entirely in your web browser. You will see the main welcome screen with live train status, language toggle (English / मराठी), and text size controls (A-, A, A+).",
        mr: "ही वेबसाइट तुमच्या ब्राउझरमध्ये चालते. मुख्य पानावर तुम्हाला थेट गाड्यांची माहिती, भाषा बदलण्याची सोय (English / मराठी) आणि अक्षर आकार बदलणारी बटणे (A-, A, A+) दिसतील."
      },
      actionText: { en: "Go to Home Page", mr: "मुख्य पानावर जा" },
      route: "/"
    },
    {
      step: 2,
      icon: Key,
      title: { en: "2. How to Sign In (Roles)", mr: "२. लॉग इन कसे करावे" },
      summary: { 
        en: "Sign in using ready-made demo accounts for Passenger, Staff, Faculty, or Admin.", 
        mr: "प्रवासी, कर्मचारी, शिक्षक किंवा प्रशासक खात्यासाठी तयार डेमो पासवर्ड वापरा." 
      },
      details: {
        en: "Click 'Sign In' at the top right. Select your role tab:\n• Passenger: passenger@railway.gov.in (Pass: Demo@123)\n• Staff: staff@railway.gov.in (Pass: Demo@123)\n• Faculty: faculty@engg.edu (Pass: Demo@123)\n• Admin: admin@railway.gov.in (Pass: Admin@123 + PIN: 123456)",
        mr: "उजव्या कोपऱ्यातील 'साइन इन' बटण दाबा. तुमचा प्रकार निवडा:\n• प्रवासी: passenger@railway.gov.in (पासवर्ड: Demo@123)\n• कर्मचारी: staff@railway.gov.in (पासवर्ड: Demo@123)\n• शिक्षक: faculty@engg.edu (पासवर्ड: Demo@123)\n• ॲडमिन: admin@railway.gov.in (पासवर्ड: Admin@123 + पिन: 123456)"
      },
      actionText: { en: "Open Login Page", mr: "लॉगिन पेज उघडा" },
      route: "/login"
    },
    {
      step: 3,
      icon: TrainIcon,
      title: { en: "3. How to Select a Train", mr: "३. गाडी कशी निवडावी" },
      summary: { 
        en: "Search any train by its 5-digit number (e.g. 12101) or station name.", 
        mr: "गाडीच्या ५-अंकी क्रमांकाने (उदा. 12101) किंवा स्थानकाच्या नावाने गाडी शोधा." 
      },
      details: {
        en: "In the search bar on Passenger or Monitoring pages, enter train number (e.g. 12101 Jnaneswari Express or 12951 Rajdhani). The train schedule, stations, and full coach layout will immediately load.",
        mr: "शोध पेटीत गाडी क्रमांक टाका (उदा. 12101 ज्ञानेश्वरी एक्सप्रेस किंवा 12951 राजधानी). गाडीची वेळ, स्थानके आणि डब्यांची संपूर्ण रचना लगेच दिसेल."
      },
      actionText: { en: "Search Trains", mr: "गाड्या शोधा" },
      route: "/passenger"
    },
    {
      step: 4,
      icon: Users,
      title: { en: "4. How to Select a Coach", mr: "४. डबा कसा निवडावा" },
      summary: { 
        en: "Click on any coach icon (Engine, GS, S1, S2, B1, etc.) to see its details.", 
        mr: "तपशील पाहण्यासाठी कोणत्याही डब्यावर (GS, S1, S2, B1 इत्यादी) क्लिक करा." 
      },
      details: {
        en: "The horizontal train view shows all coaches in train formation order. Click any coach to see its current gross weight, passenger count, seating capacity, and bogie balance meter.",
        mr: "गाडीच्या डब्यांच्या रांगेत कोणताही डबा निवडा. डब्याचे एकूण वजन, प्रवाशांची संख्या, बसायची क्षमता आणि वजन समतोल लगेच उघडेल."
      },
      actionText: { en: "View Coach Layout", mr: "डब्यांची रचना पहा" },
      route: "/passenger"
    },
    {
      step: 5,
      icon: Sliders,
      title: { en: "5. How to Enter Weight Manually", mr: "५. स्वतः वजन कसे टाकावे" },
      summary: { 
        en: "Move the weight slider in the Simulator to test custom coach weights.", 
        mr: "सिम्युलेटरमध्ये वजन स्लाइडर हलवून तुम्हाला हवे ते वजन तपासून पहा." 
      },
      details: {
        en: "Go to 'Sensor Simulator'. Find the 'Individual Coach Gross Weight' slider. Drag it left or right. As weight increases, the passenger count and crowd level update in real time.",
        mr: "'सेन्सर सिम्युलेटर' पानावर जा. तेथे वजनाचा स्लाइडर डावीकडे किंवा उजवीकडे हलवा. वजन वाढताच प्रवासी संख्या आणि गर्दीचा रंग लगेच बदलतो."
      },
      actionText: { en: "Open Simulator", mr: "सिम्युलेटर उघडा" },
      route: "/simulator"
    },
    {
      step: 6,
      icon: Sparkles,
      title: { en: "6. How to Run Scenarios", mr: "६. सराव परिस्थिती कशी चालवावी" },
      summary: { 
        en: "Click 1-click preset buttons like 'Empty Coach', 'Normal Crowd', or 'Overload'.", 
        mr: "'रिकामी गाडी', 'सामान्य गर्दी' किंवा 'ओव्हरलोड' यांसारखी १-क्लिक बटणे दाबा." 
      },
      details: {
        en: "The simulator provides 10 pre-configured situations:\n• Empty Coach: baseline weight with 0 passengers\n• Normal Crowd: 50% comfortable seating\n• Festival Rush / Overload: >115% critical load\nEvery reading is watermarked as 'SIMULATED DATA'.",
        mr: "सिम्युलेटरमध्ये १० तयार परिस्थिती उपलब्ध आहेत:\n• रिकामी गाडी: ० प्रवासी असलेले मूळ वजन\n• सामान्य गर्दी: ५०% आरामदायक आसन व्यवस्था\n• सणासुदीची गर्दी / ओव्हरलोड: ११५% पेक्षा जास्त भार\nसर्व आकड्यांवर 'SIMULATED DATA' असा स्पष्ट शिक्का असतो."
      },
      actionText: { en: "Try Scenarios", mr: "परिस्थिती तपासा" },
      route: "/simulator"
    },
    {
      step: 7,
      icon: Scale,
      title: { en: "7. How to Understand Occupancy", mr: "७. गर्दीची टक्केवारी कशी ओळखावी" },
      summary: { 
        en: "Green = Plenty of space, Yellow = Moderate crowd, Red = Very crowded / Overloaded.", 
        mr: "हिरवा = पुरेशी मोकळी जागा, पिवळा = मध्यम गर्दी, लाल = जास्त गर्दी किंवा ओव्हरलोड." 
      },
      details: {
        en: "• Green (0% - 50%): Empty seats available. Recommended for comfortable travel.\n• Yellow (51% - 80%): Mostly full, some standing.\n• Red (> 100%): Structural safety warning. Board adjacent coaches instead.",
        mr: "• हिरवा (०% - ५०%): बसायला जागा उपलब्ध. प्रवासासाठी उत्तम.\n• पिवळा (५१% - ८०%): मध्यम गर्दी, काही प्रवासी उभे आहेत.\n• लाल (> १००%): सुरक्षिततेचा इशारा. शेजारचा मोकळा डबा निवडा."
      },
      actionText: { en: "Check Crowd Heatmap", mr: "गर्दीचा तक्ता पहा" },
      route: "/passenger"
    },
    {
      step: 8,
      icon: TrendingUp,
      title: { en: "8. How to View AI Predictions", mr: "८. पुढील गर्दीचा AI अंदाज कसा पहावा" },
      summary: { 
        en: "Look at the 15, 30, and 60-minute future crowd forecast cards.", 
        mr: "पुढील १५, ३० आणि ६० मिनिटांतील अंदाजित गर्दीचे तक्ते पहा." 
      },
      details: {
        en: "The AI uses Holt-Winters mathematical formula to analyze how passengers board at each station and predicts if your coach will become crowded before reaching the next major junction.",
        mr: "हे सॉफ्टवेअर गणिती सूत्रांचा वापर करून मागील स्थानकांवरील गर्दीवरून पुढील स्थानकावर डबा किती भरेल याचा १५, ३० व ६० मिनिटांतील अचूक अंदाज वर्तवते."
      },
      actionText: { en: "View AI Prediction", mr: "अंदाज तपासा" },
      route: "/passenger"
    },
    {
      step: 9,
      icon: MessageSquare,
      title: { en: "9. How to Submit Feedback", mr: "९. तक्रार किंवा सूचना कशी पाठवावी" },
      summary: { 
        en: "Open 'Feedback & Support' to log any complaint or suggestion.", 
        mr: "'अभिप्राय आणि मदत' पानावर जाऊन तुमची अडचण किंवा सूचना नोंदवा." 
      },
      details: {
        en: "Fill in the simple form, select category (e.g. Coach Monitoring or Suggestion), and click 'Submit Feedback'. You will receive a unique ticket ID like FB-2026-0004. Admins can update the status and reply directly.",
        mr: "सोपा फॉर्म भरा, प्रकार निवडा आणि 'सूचना पाठवा' दाबा. तुम्हाला FB-2026-0004 सारखा तिकीट क्रमांक मिळेल. प्रशासन त्याचे निवारण करून उत्तर देईल."
      },
      actionText: { en: "Open Feedback Desk", mr: "मदत कक्ष उघडा" },
      route: "/feedback"
    },
    {
      step: 10,
      icon: FileText,
      title: { en: "10. How to Download Reports", mr: "१०. अहवाल कसा डाऊनलोड करावा" },
      summary: { 
        en: "Go to Reports page to export official CSV spreadsheets for examination.", 
        mr: "अहवाल पानावर जाऊन परीक्षेसाठी अधिकृत सीएसव्ही (CSV) फाईल डाऊनलोड करा." 
      },
      details: {
        en: "Select between Train Fleet, Incident Logs, or AI Accuracy Table (MAE: 1.48% / RMSE: 2.12%). Click 'Download Report (CSV)' to save the file or click 'Print' for a physical paper copy.",
        mr: "गाड्यांची यादी किंवा AI अचूकता तक्ता (MAE: १.४८% / RMSE: २.१२%) निवडा. स्प्रेडशीट सेव्ह करण्यासाठी 'अहवाल डाऊनलोड करा (CSV)' दाबा."
      },
      actionText: { en: "Download Reports", mr: "अहवाल डाऊनलोड करा" },
      route: "/reports"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#003366] to-[#002244] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {isMr ? "वापरकर्ता मार्गदर्शक आणि सादरीकरण मदत" : "First-Time User Guide & Viva Help"}
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                {isMr ? "ही वेबसाइट कशी वापरायची? (१० सोप्या पायऱ्या)" : "How to Use This Website (10 Easy Steps)"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 px-5 shrink-0">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'steps'
                ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isMr ? "१० पायऱ्यांचे सोपे मार्गदर्शन" : "10-Step Interactive Guide"}
          </button>
          
          <button
            onClick={() => setActiveTab('speech')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'speech'
                ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isMr ? "विद्यार्थ्यांसाठी २ मिनिटांचे सादरीकरण भाषण" : "2-Minute Student Viva Speech"}
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'faq'
                ? 'border-[#003366] text-[#003366] dark:border-amber-400 dark:text-amber-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isMr ? "वारंवार विचारले जाणारे प्रश्न (FAQ)" : "Common Questions (FAQ)"}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: 10 STEPS GUIDE */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              
              {/* Step Selector Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                {steps.map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap cursor-pointer transition ${
                      activeStep === s.step
                        ? 'bg-[#003366] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isMr ? `पायरी ${s.step}` : `Step ${s.step}`}
                  </button>
                ))}
              </div>

              {/* Active Step Card */}
              {(() => {
                const cur = steps.find(s => s.step === activeStep) || steps[0];
                const IconComp = cur.icon;
                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            {isMr ? `१० पैकी पायरी ${cur.step}` : `Step ${cur.step} of 10`}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {isMr ? cur.title.mr : cur.title.en}
                          </h3>
                        </div>
                      </div>

                      {cur.route && navigate && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate(cur.route!);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs bg-[#003366] text-white hover:bg-blue-900 cursor-pointer shadow-xs transition"
                        >
                          <span>{isMr ? cur.actionText.mr : cur.actionText.en}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {isMr ? cur.details.mr : cur.details.en}
                    </div>

                    {/* Step Navigation Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                        disabled={activeStep === 1}
                        className="px-3 py-1 text-xs font-medium rounded-xs bg-slate-200 dark:bg-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        {isMr ? "मागील पायरी" : "Previous Step"}
                      </button>

                      <span className="text-xs text-slate-500 font-mono">
                        {activeStep} / 10
                      </span>

                      <button
                        onClick={() => setActiveStep(prev => Math.min(10, prev + 1))}
                        disabled={activeStep === 10}
                        className="px-3 py-1 text-xs font-bold rounded-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                      >
                        {isMr ? "पुढील पायरी" : "Next Step"}
                      </button>
                    </div>

                  </div>
                );
              })()}

              {/* All 10 Steps Summary Grid */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {isMr ? "सर्व १० पायऱ्यांचा संक्षिप्त तक्ता:" : "Quick Overview of All 10 Steps:"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {steps.map(s => (
                    <div 
                      key={s.step}
                      onClick={() => setActiveStep(s.step)}
                      className={`p-2 rounded-xs border cursor-pointer transition ${
                        activeStep === s.step 
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-[#003366] dark:text-blue-300 block">
                        {isMr ? s.title.mr : s.title.en}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {isMr ? s.summary.mr : s.summary.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: 2-MINUTE STUDENT VIVA SPEECH */}
          {activeTab === 'speech' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-md">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 mb-1">
                  <Award className="w-4 h-4" />
                  <span>{isMr ? "शिक्षकांना किंवा परीक्षकांना सांगण्यासाठी २ मिनिटांचे सोपे भाषण" : "2-Minute Simple Speech for Teachers & Viva Examiners"}</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  {isMr 
                    ? "तुम्हाला परीक्षक किंवा पाहुण्यांना प्रकल्प समजावून सांगायचा असेल, तर खालील सोप्या ओळी जशाच्या तशा वाचू किंवा बोलू शकता:"
                    : "When presenting your project in front of an examiner or visitor, you can speak or read these exact words effortlessly:"}
                </p>
              </div>

              {/* Speech in English */}
              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#003366] dark:text-blue-300 text-sm flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>English Viva Speech (2 Minutes)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-xs">
                    Memorize or Read
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                  <p>
                    <strong>"Respected Teachers &amp; Examiners,</strong>
                  </p>
                  <p>
                    Today I am presenting the <strong>Smart Live Weight Tracker</strong>. In Indian Railways, train coaches like General and Sleeper get heavily overcrowded, and commuters crowd near the foot-over bridges while end coaches stay half-empty.
                  </p>
                  <p>
                    <strong>How our software solves this:</strong> By measuring the weight on the coach suspension, our software automatically calculates how full the coach is and estimates the passenger count. If a coach exceeds safe weight, a red overload alarm alerts the staff.
                  </p>
                  <p>
                    <strong>Key Features:</strong>
                    <br />1. <strong>Passenger Guidance:</strong> Shows green for empty coaches so passengers know where to stand before the train arrives.
                    <br />2. <strong>Zero-Hardware Simulator:</strong> We built a 10-scenario testing simulator, so physical hardware purchases are not needed for demonstration.
                    <br />3. <strong>AI Crowd Prediction:</strong> Estimates crowd levels 15, 30, and 60 minutes into the future with verified 1.48% error.
                    <br />4. <strong>Feedback Desk:</strong> Passengers, staff, and faculty can submit issues and get official ticket resolutions.
                  </p>
                  <p>
                    In conclusion, this is a complete, working software solution for railway passenger safety and comfort. Thank you!"
                  </p>
                </div>
              </div>

              {/* Speech in Marathi */}
              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#003366] dark:text-blue-300 text-sm flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>मराठी सादरीकरण भाषण (२ मिनिटे)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xs">
                    परीक्षकांसमोर बोला
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                  <p>
                    <strong>"आदरणीय शिक्षक आणि परीक्षक महोदय,</strong>
                  </p>
                  <p>
                    मी आज <strong>स्मार्ट लाईव्ह वजन ट्रॅकर</strong> प्रकल्प सादर करत आहे. भारतीय रेल्वेमध्ये जनरल आणि स्लीपर डब्यांमध्ये खूप गर्दी होते, आणि पुलाजवळचे डबे जास्त भरतात तर पुढचे-मागचे डबे रिकामे राहतात.
                  </p>
                  <p>
                    <strong>आमचे सॉफ्टवेअर कशी मदत करते:</strong> डब्याच्या वजनावरून हे सॉफ्टवेअर डबा किती भरला आहे ते मोजते आणि प्रवाशांच्या संख्येचा अंदाज काढते. वजन जास्त झाल्यास कर्मचाऱ्यांना लाल रंगाचा ओव्हरलोड इशारा मिळतो.
                  </p>
                  <p>
                    <strong>मुख्य वैशिष्ट्ये:</strong>
                    <br />१. <strong>प्रवासी मार्गदर्शन:</strong> हिरव्या रंगाने रिकामे डबे दाखवून प्रवाशांना योग्य डबा निवडण्यास मदत करते.
                    <br />२. <strong>सॉफ्टवेअर सिम्युलेटर:</strong> कोणत्याही महागड्या उपकरणांशिवाय १० विविध गर्दीच्या परिस्थिती तपासता येतात.
                    <br />३. <strong>AI गर्दी अंदाज:</strong> पुढील १५, ३० व ६० मिनिटांतील गर्दीचा आधीच अंदाज वर्तवते.
                    <br />४. <strong>तक्रार निवारण कक्ष:</strong> प्रवासी व शिक्षकांना अडचणी मांडता येतात व ट्रॅकिंग नंबर मिळतो.
                  </p>
                  <p>
                    थोडक्यात सांगायचे तर, हा प्रकल्प रेल्वे प्रवास सुरक्षित आणि सुलभ करणारा एक परिपूर्ण सॉफ्टवेअर प्रोटोटाइप आहे. धन्यवाद!"
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMMON FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm space-y-1">
                <h4 className="font-bold text-[#003366] dark:text-blue-300">
                  {isMr ? "१. या प्रकल्पासाठी हार्डवेअर किंवा सेन्सर विकत घ्यावे लागतील का?" : "1. Do we need to buy hardware sensors for this project?"}
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {isMr 
                    ? "नाही! हा १००% सॉफ्टवेअर-आधारित प्रकल्प आहे. सर्व वजन आणि प्रवासी संख्या सिम्युलेटरद्वारे गणिती पद्धतीने मोजली जाते. कोणताही सेन्सर न जोडता सर्व फीचर्स व्यवस्थित चालतात."
                    : "No! This is a 100% software-only project. All coach weights and passenger counts are generated mathematically by the built-in simulator. Everything runs completely without physical hardware."}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm space-y-1">
                <h4 className="font-bold text-[#003366] dark:text-blue-300">
                  {isMr ? "२. डब्यातील प्रवासी संख्या कशी मोजली जाते?" : "2. How is the passenger count estimated?"}
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {isMr 
                    ? "एकूण वजनातून रिकाम्या डब्याचे मूळ वजन (Tare Weight) वजा केले जाते, आणि उरलेल्या वजनाला एका प्रवाशाच्या सरासरी वजनाने (७५ किलो) भागले जाते."
                    : "The empty coach weight (Tare Weight) is subtracted from the total measured weight, and the remaining payload is divided by the standard average passenger + luggage weight (75 kg)."}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm space-y-1">
                <h4 className="font-bold text-[#003366] dark:text-blue-300">
                  {isMr ? "३. रंगांचे अर्थ काय आहेत?" : "3. What do the coach colors mean?"}
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {isMr 
                    ? "• हिरवा: डब्यात बसायला मोकळी जागा आहे.\n• पिवळा: डबा मध्यम भरला आहे.\n• लाल: डबा ओव्हरलोड किंवा खूप गर्दीचा आहे."
                    : "• Green: Space is available to sit.\n• Yellow: Coach is moderately crowded.\n• Red: Critical crowd or weight overload warning."}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm space-y-1">
                <h4 className="font-bold text-[#003366] dark:text-blue-300">
                  {isMr ? "४. सिम्युलेटर कसा रीसेट करावा?" : "4. How do I reset the simulator after testing?"}
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {isMr 
                    ? "सिम्युलेटर पानावर जाऊन 'पूर्वस्थितीत आणा' (Reset Demo) बटण दाबा. सर्व डबे मूळ रिकाम्या किंवा सामान्य वजनावर परत येतील."
                    : "Go to the Simulator page and click the 'Reset to Defaults' button. All coaches will instantly return to normal baseline weights."}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {isMr ? "मदत हवी आहे? 'अभिप्राय आणि मदत' कक्ष वापरा." : "Need personal help? Open Feedback & Support."}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-xs bg-[#003366] text-white hover:bg-blue-900 cursor-pointer transition shadow-xs"
          >
            {isMr ? "समजले, बंद करा" : "Got it, Close Guide"}
          </button>
        </div>

      </div>
    </div>
  );
};
