 import { useState }    from 'react';
import Sidebar         from '../components/common/Sidebar';
import Modal           from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import { useWallet }   from '../context/WalletContext';
import api             from '../services/api';
import toast           from 'react-hot-toast';

export default function Advisors() {
  const { t, language } = useLanguage();
  const { wallet, fetchWallet } = useWallet();
  const isHindi         = language === 'hi';
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [booked,    setBooked]    = useState([]);

  const advisors = [
    {
      id:      1,
      name:    isHindi ? 'डॉ. राजेश कुमार'  : 'Dr. Rajesh Kumar',
      spec:    isHindi ? 'फसल प्रबंधन'       : 'Crop Management',
      exp:     15,
      rating:  4.8,
      price:   500,
      lang:    isHindi ? ['हिंदी','अंग्रेजी'] : ['Hindi','English'],
      photo:   '👨‍🌾',
      bio:     isHindi
        ? '15 साल का अनुभव, गेहूं और धान के विशेषज्ञ'
        : '15 years experience, specialist in wheat and paddy',
    },
    {
      id:      2,
      name:    isHindi ? 'प्रिया शर्मा'      : 'Priya Sharma',
      spec:    isHindi ? 'मिट्टी की सेहत'   : 'Soil Health',
      exp:     8,
      rating:  4.6,
      price:   400,
      lang:    isHindi ? ['हिंदी','पंजाबी']  : ['Hindi','Punjabi'],
      photo:   '👩‍🌾',
      bio:     isHindi
        ? 'मिट्टी परीक्षण और जैविक खेती की विशेषज्ञ'
        : 'Expert in soil testing and organic farming',
    },
    {
      id:      3,
      name:    isHindi ? 'मोहन वर्मा'        : 'Mohan Verma',
      spec:    isHindi ? 'कीट नियंत्रण'     : 'Pest Control',
      exp:     12,
      rating:  4.9,
      price:   600,
      lang:    isHindi ? ['हिंदी','अंग्रेजी'] : ['Hindi','English'],
      photo:   '👨‍🌾',
      bio:     isHindi
        ? 'प्राकृतिक कीट नियंत्रण के विशेषज्ञ'
        : 'Expert in natural and organic pest control',
    },
    {
      id:      4,
      name:    isHindi ? 'सुनीता देवी'       : 'Sunita Devi',
      spec:    isHindi ? 'जैविक खेती'       : 'Organic Farming',
      exp:     10,
      rating:  4.7,
      price:   450,
      lang:    isHindi ? ['हिंदी']           : ['Hindi'],
      photo:   '👩‍🌾',
      bio:     isHindi
        ? 'जैविक प्रमाणन और प्राकृतिक खेती विशेषज्ञ'
        : 'Organic certification and natural farming expert',
    },
  ];

  const handleBookSession = async () => {
    if (!selected) return;

    // Check wallet
    if (!wallet?.isActive) {
      toast.error(isHindi
        ? 'वॉलेट सक्रिय नहीं! पहले खेत प्रोफाइल भरें'
        : 'Wallet not active! Complete farm profile first');
      return;
    }

    const available = (wallet?.creditLimit || 0) - (wallet?.usedCredit || 0);
    if (selected.price > available) {
      toast.error(isHindi
        ? `अपर्याप्त बैलेंस। उपलब्ध: ₹${available.toLocaleString()}`
        : `Insufficient balance. Available: ₹${available.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/wallet/spend', {
        amount:      selected.price,
        category:    'advisor',
        description: `${isHindi ? 'सलाहकार सत्र' : 'Advisor session'} - ${selected.name}`,
      });

      fetchWallet();
      setBooked(prev => [...prev, selected.id]);
      setSelected(null);
      toast.success(isHindi
        ? `${selected.name} के साथ सत्र बुक हुआ! ✅`
        : `Session booked with ${selected.name}! ✅`);

    } catch (err) {
      toast.error(err.response?.data?.message || (isHindi
        ? 'बुकिंग विफल'
        : 'Booking failed'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title">👨‍🌾 {t('advisors')}</h1>
          <p className="page-sub">
            {isHindi
              ? 'अपने खेत के लिए विशेषज्ञ मार्गदर्शन बुक करें'
              : 'Book expert guidance for your farm'}
          </p>
        </div>

        {/* Wallet Balance Info */}
        {wallet && (
          <div className="bg-gradient-to-r from-forest to-fgreen
            rounded-2xl p-4 text-white mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60 mb-1">
                {isHindi ? 'उपलब्ध बैलेंस' : 'Available Balance'}
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency((wallet.creditLimit || 0) - (wallet.usedCredit || 0))}
              </div>
            </div>
            <div className="text-4xl">👛</div>
          </div>
        )}

        {/* Advisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {advisors.map((a) => {
            const isBooked = booked.includes(a.id);
            return (
              <div key={a.id}
                className={`card hover:shadow-xl transition-all duration-300
                  hover:-translate-y-1 ${isBooked ? 'border-2 border-green-400' : ''}`}>

                {/* Booked badge */}
                {isBooked && (
                  <div className="badge-green text-xs mb-3 inline-block">
                    ✅ {isHindi ? 'बुक हो गया' : 'Session Booked'}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="text-5xl">{a.photo}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-forest text-lg">{a.name}</h3>
                    <p className="text-fgreen text-sm font-semibold">{a.spec}</p>
                    <p className="text-gray-400 text-xs mt-1">{a.bio}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                      <span>⭐ {a.rating}</span>
                      <span>📅 {a.exp} {isHindi ? 'साल' : 'yrs'}</span>
                      <span>🗣️ {a.lang.join(', ')}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-forest">₹{a.price}</div>
                    <div className="text-xs text-gray-400">
                      {isHindi ? 'प्रति सत्र' : 'per session'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      30 {isHindi ? 'मिनट' : 'mins'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isBooked && setSelected(a)}
                  disabled={isBooked}
                  className={`w-full mt-4 text-sm py-3 rounded-xl font-bold
                    transition-all duration-200
                    ${isBooked
                      ? 'bg-green-100 text-green-600 cursor-not-allowed'
                      : 'btn-primary hover:scale-[1.02]'}`}>
                  {isBooked
                    ? (isHindi ? '✅ बुक हो गया' : '✅ Already Booked')
                    : (isHindi ? 'सत्र बुक करें →' : 'Book Session →')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Booking Modal */}
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={isHindi ? '👨‍🌾 सत्र बुक करें' : '👨‍🌾 Book Advisory Session'}>
          {selected && (
            <div className="flex flex-col gap-4">

              {/* Advisor info */}
              <div className="flex items-center gap-4 bg-cream rounded-xl p-4">
                <div className="text-4xl">{selected.photo}</div>
                <div>
                  <div className="font-bold text-forest text-lg">
                    {selected.name}
                  </div>
                  <div className="text-fgreen text-sm">{selected.spec}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    ⭐ {selected.rating} · {selected.exp}{' '}
                    {isHindi ? 'साल अनुभव' : 'years experience'}
                  </div>
                </div>
              </div>

              {/* Session details */}
              <div className="space-y-2">
                {[
                  [
                    isHindi ? '⏱️ सत्र अवधि' : '⏱️ Session Duration',
                    isHindi ? '30 मिनट'       : '30 minutes',
                  ],
                  [
                    isHindi ? '🗣️ भाषा'       : '🗣️ Language',
                    selected.lang.join(', '),
                  ],
                  [
                    isHindi ? '💳 भुगतान'     : '💳 Payment',
                    isHindi ? 'वॉलेट से'     : 'From Wallet',
                  ],
                  [
                    isHindi ? '💰 शुल्क'      : '💰 Session Fee',
                    `₹${selected.price}`,
                  ],
                ].map(([label, value], i) => (
                  <div key={i}
                    className="flex justify-between items-center py-2
                      border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <span className="font-semibold text-forest text-sm">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wallet balance */}
              <div className={`rounded-xl p-3 text-sm
                ${(wallet?.creditLimit - wallet?.usedCredit) >= selected.price
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {(wallet?.creditLimit - wallet?.usedCredit) >= selected.price ? (
                  <span>
                    ✅ {isHindi ? 'उपलब्ध बैलेंस' : 'Available balance'}:{' '}
                    {formatCurrency(wallet?.creditLimit - wallet?.usedCredit)}
                  </span>
                ) : (
                  <span>
                    ❌ {isHindi ? 'अपर्याप्त बैलेंस' : 'Insufficient balance'}
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="bg-forest text-white rounded-xl p-4
                flex justify-between items-center">
                <span className="font-semibold">
                  {isHindi ? 'कुल भुगतान' : 'Total Payment'}
                </span>
                <span className="text-2xl font-bold">₹{selected.price}</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  className="btn-outline flex-1"
                  onClick={() => setSelected(null)}>
                  {t('cancel')}
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleBookSession}
                  disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white
                        border-t-transparent rounded-full animate-spin" />
                      {isHindi ? 'बुक हो रहा...' : 'Booking...'}
                    </span>
                  ) : (isHindi ? 'बुक करें ✅' : 'Confirm Booking ✅')}
                </button>
              </div>
            </div>
          )}
        </Modal>

      </main>
    </div>
  );
}