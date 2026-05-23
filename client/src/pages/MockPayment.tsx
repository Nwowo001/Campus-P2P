import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ShieldCheck, XCircle, CreditCard, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export const MockPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const reference = searchParams.get('reference') || '';
  const amount = Number(searchParams.get('amount')) || 0;
  const email = searchParams.get('email') || '';

  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [error, setError] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSimulateSuccess = async () => {
    if (!reference) return;
    setPaying(true);
    setError('');

    try {
      // Call verify endpoint on backend. In simulated mode this marks order as PAID, escrowHeld = TRUE, product = SOLD.
      const res = await API.get(`/payments/verify/${reference}`);
      if (res.data.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/orders');
        }, 2500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to verify transaction. Try again.');
      setStatus('failed');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulateCancel = () => {
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans antialiased">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full bg-primary-500/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 fade-in">
        
        {/* Gateway Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
              P
            </div>
            <span className="font-extrabold text-sm tracking-tight">
              paystack <span className="text-emerald-400 font-bold text-xs uppercase ml-1">Sandbox</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">{email}</span>
        </div>

        {/* Transaction Summary */}
        <div className="text-center py-4 bg-slate-900/50 rounded-2xl border border-slate-800/40">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pay CampusMart Store</p>
          <h2 className="text-3xl font-black mt-1 text-emerald-400">{formatPrice(amount)}</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1 select-all">Ref: {reference}</p>
        </div>

        {/* Conditional states */}
        {status === 'success' ? (
          <div className="py-6 text-center space-y-3 animate-bounce">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">Payment Successful</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Escrow payment received. Funds are secured. Redirecting you to orders...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Simulation Instructions */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-start space-x-3 text-xs leading-relaxed text-slate-400">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Payment Gateway Simulation</strong>
                <p className="mt-0.5">Click the checkout action to simulate Paystack receiving card details and hitting the backend verification webhook.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl">
                {error}
              </div>
            )}

            {/* Credit Card Mock graphic */}
            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/30 flex items-center space-x-3">
              <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold">Simulated Checkout Card</p>
                <p className="text-[10px] text-slate-500 mt-0.5">•••• •••• •••• 4242</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleSimulateSuccess}
                disabled={paying}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-200"
              >
                <span>{paying ? 'Authorizing Card...' : 'Authorize Escrow Payment'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={handleSimulateCancel}
                disabled={paying}
                className="w-full flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl border border-slate-800 bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-sm transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Check</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
              <Lock className="w-3 h-3 text-slate-600" />
              <span>Secured by CampusMart Escrow API</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
