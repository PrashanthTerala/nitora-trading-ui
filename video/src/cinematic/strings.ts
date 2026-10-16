/**
 * On-screen text for the cinematic videos, per language. The narration scripts live in
 * narration/<video>.json; these are the short labels and headlines drawn in the frame. Telugu
 * and Hindi keep the English trading terms (in their own scripts), as the narration does.
 * te, hi and es were written by the production assistant: awaiting native-speaker review.
 */
import { useLang } from '../kit';

const STRINGS = {
  kicker: { en: 'Module 5 · Indicators · Lesson 3', te: 'మాడ్యూల్ 5 · ఇండికేటర్స్ · పాఠం 3', hi: 'मॉड्यूल 5 · इंडिकेटर्स · लेसन 3', es: 'Módulo 5 · Indicadores · Lección 3' },
  title: { en: 'Moving Average Crossovers', te: 'మూవింగ్ యావరేజ్ క్రాస్‌ఓవర్స్', hi: 'मूविंग एवरेज क्रॉसओवर', es: 'Cruces de medias móviles' },
  subtitle: {
    en: 'When a fast average overtakes a slow one',
    te: 'ఫాస్ట్ యావరేజ్, స్లో యావరేజ్‌ని దాటినప్పుడు',
    hi: 'जब फ़ास्ट एवरेज, स्लो एवरेज से आगे निकलता है',
    es: 'Cuando una media rápida rebasa a una lenta',
  },
  refresher: { en: 'Refresher: what is a moving average?', te: 'రివిజన్: మూవింగ్ యావరేజ్ అంటే ఏంటి?', hi: 'रिवीज़न: मूविंग एवरेज क्या है?', es: 'Repaso: ¿qué es una media móvil?' },
  waves: {
    en: 'One wave tells you little. The average of the last ten shows the tide.',
    te: 'ఒక్క అల చూసి ఏమీ చెప్పలేం. చివరి పది అలల యావరేజ్ సముద్రం దిశను చూపిస్తుంది.',
    hi: 'एक लहर से कुछ पता नहीं चलता। आख़िरी दस लहरों का एवरेज दिशा दिखाता है।',
    es: 'Una ola dice poco. El promedio de las últimas diez muestra la marea.',
  },
  wavesLegend: { en: '● where each wave reached · illustration', te: '● ఒక్కో అల చేరిన చోటు · ఉదాహరణ చిత్రం', hi: '● हर लहर कहाँ तक पहुँची · उदाहरण चित्र', es: '● hasta dónde llegó cada ola · ilustración' },
  tide: { en: 'average = the tide', te: 'యావరేజ్ = సముద్రం దిశ', hi: 'एवरेज = समुद्र की दिशा', es: 'promedio = la marea' },
  addDivide: { en: 'Add the last five closes, then divide by five.', te: 'చివరి ఐదు క్లోజింగ్ ధరలు కలిపి, ఐదుతో భాగించండి.', hi: 'आख़िरी पाँच क्लोज़िंग प्राइस जोड़िए, फिर पाँच से भाग दीजिए।', es: 'Suma los últimos cinco cierres y divide entre cinco.' },
  theAverage: { en: 'the average', te: 'యావరేజ్', hi: 'एवरेज', es: 'el promedio' },
  slide: {
    en: 'Tomorrow: drop the oldest, add the newest. The window slides, so the average moves.',
    te: 'రేపు: పాతదాన్ని తీసేసి, కొత్తదాన్ని కలపండి. విండో జరుగుతుంది, యావరేజ్ కదులుతుంది.',
    hi: 'कल: सबसे पुराना हटाइए, नया जोड़िए। विंडो खिसकती है, एवरेज चलता है।',
    es: 'Mañana: quita el más antiguo, agrega el más nuevo. La ventana avanza y el promedio se mueve.',
  },
  last5: { en: 'the last 5 closes', te: 'చివరి 5 క్లోజింగ్ ధరలు', hi: 'आख़िरी 5 क्लोज़', es: 'los últimos 5 cierres' },
  newClose: { en: 'new', te: 'కొత్తది', hi: 'नया', es: 'nuevo' },
  famousPair: { en: 'The famous pair', te: 'ప్రసిద్ధ జంట', hi: 'मशहूर जोड़ी', es: 'El par famoso' },
  wideHead: { en: '50-day and 200-day simple moving averages', te: '50 రోజుల, 200 రోజుల సింపుల్ మూవింగ్ యావరేజ్‌లు', hi: '50 दिन और 200 दिन के सिंपल मूविंग एवरेज', es: 'Medias móviles simples de 50 y 200 días' },
  goldenHead: { en: 'Golden cross: the 50-day crosses above the 200-day', te: 'గోల్డెన్ క్రాస్: 50 రోజులది, 200 రోజులదాని పైకి', hi: 'गोल्डन क्रॉस: 50 दिन वाला, 200 दिन वाले के ऊपर', es: 'Cruce dorado: la de 50 días cruza por encima de la de 200' },
  deathHead: { en: 'Death cross: the 50-day crosses below', te: 'డెత్ క్రాస్: 50 రోజులది కిందకి', hi: 'डेथ क्रॉस: 50 दिन वाला नीचे', es: 'Cruce de la muerte: la de 50 días cruza por debajo' },
  golden: { en: 'golden cross', te: 'గోల్డెన్ క్రాస్', hi: 'गोल्डन क्रॉस', es: 'cruce dorado' },
  death: { en: 'death cross', te: 'డెత్ క్రాస్', hi: 'डेथ क्रॉस', es: 'cruce de la muerte' },
  price: { en: 'price', te: 'ధర', hi: 'प्राइस', es: 'precio' },
  synthetic: { en: 'Synthetic data, for teaching', te: 'సింథటిక్ డేటా, బోధన కోసం', hi: 'सिंथेटिक डेटा, सिखाने के लिए', es: 'Datos sintéticos, para enseñar' },
  barN: { en: 'bar {n}', te: 'బార్ {n}', hi: 'बार {n}', es: 'barra {n}' },
  lagKicker: { en: 'The lag', te: 'లాగ్', hi: 'लैग', es: 'El retraso' },
  lagHead: { en: 'The cross waits for enough new closes', te: 'సరిపడా కొత్త క్లోజింగ్ ధరలు వచ్చే దాకా క్రాస్ రాదు', hi: 'क्रॉस तब तक रुकता है जब तक नए क्लोज़ जमा न हों', es: 'El cruce espera a que haya suficientes cierres nuevos' },
  waited: { en: '{n} bars after the low', te: 'కనిష్ఠం తర్వాత {n} బార్లు', hi: 'निचले स्तर के {n} बार बाद', es: '{n} barras después del mínimo' },
  waitedHigh: { en: '{n} bars after the high', te: 'గరిష్ఠం తర్వాత {n} బార్లు', hi: 'ऊँचे स्तर के {n} बार बाद', es: '{n} barras después del máximo' },
  missed: { en: 'Missed: {a} → {b}', te: 'మిస్ అయింది: {a} → {b}', hi: 'छूट गया: {a} → {b}', es: 'Te perdiste: {a} → {b}' },
  gaveBack: { en: 'Gave back: {a} → {b}', te: 'తిరిగి ఇచ్చింది: {a} → {b}', hi: 'वापस दिया: {a} → {b}', es: 'Devolviste: {a} → {b}' },
  ship: {
    en: 'A big ship turns slowly. So does a slow average: late, but steady.',
    te: 'పెద్ద ఓడ నెమ్మదిగా తిరుగుతుంది. స్లో యావరేజ్ కూడా అంతే: ఆలస్యంగా, కానీ స్థిరంగా.',
    hi: 'बड़ा जहाज़ धीरे मुड़ता है। स्लो एवरेज भी: देर से, पर मज़बूती से।',
    es: 'Un barco grande gira despacio. Una media lenta también: tarde, pero firme.',
  },
} as const;

export type StringKey = keyof typeof STRINGS;

/** The text for `key` in the language being rendered, with {placeholders} filled in. */
export function useT() {
  const lang = useLang() as 'en' | 'te' | 'hi' | 'es';
  return (key: StringKey, vars: Record<string, string | number> = {}) =>
    (STRINGS[key][lang] ?? STRINGS[key].en).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
