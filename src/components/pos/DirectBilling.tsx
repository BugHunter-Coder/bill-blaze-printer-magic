import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PrinterManager from '@/lib/PrinterManager';
import { supabase } from '@/integrations/supabase/client';
import type { Shop, UserProfile } from '@/types/pos';
import { Badge } from '@/components/ui/badge';
import { FileText, IndianRupee } from 'lucide-react';

interface DirectBillingProps {
  title?: string;
  amount?: number | string;
  shopDetails: Shop;
  cashier: UserProfile;
  printerConnected: boolean;
  onComplete?: (transactionId: string) => void;
  onPrintComplete?: () => void;
}

export function DirectBilling({
  title = '',
  amount = '',
  shopDetails,
  cashier,
  printerConnected,
  onComplete,
  onPrintComplete,
}: DirectBillingProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [billingTitle, setBillingTitle] = useState('');
  const [billingAmount, setBillingAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validate = () => {
    if (!billingTitle.trim()) {
      setError('Please enter a title for this transaction.');
      return false;
    }
    if (!billingAmount || isNaN(Number(billingAmount)) || Number(billingAmount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSaveAndPrint = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      // Save transaction
      const subtotal = Number(billingAmount);
      const taxAmount = subtotal * (shopDetails.tax_rate || 0);
      const totalAmount = subtotal + taxAmount;
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          shop_id: shopDetails.id,
          cashier_id: cashier.id,
          type: 'sale',
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          payment_method: 'cash',
          is_direct_billing: true,
          notes: billingTitle.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Success', description: 'Transaction saved!' });
      if (onComplete) onComplete(transaction.id);
      // Print
      setIsPrinting(true);
      if (printerConnected) {
        try {
          await PrinterManager.printReceipt({
            cart: [],
            total: subtotal,
            shopDetails,
            directAmount: subtotal,
            toast,
          });
          toast({ title: 'Print Success', description: 'Bill printed.' });
          if (onPrintComplete) onPrintComplete();
        } catch (e: any) {
          toast({ title: 'Print Failed', description: e.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Printer Not Connected', description: 'Connect a printer to print the bill.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setIsPrinting(false);
    }
  };

  return (
    <div className="relative">
      <Card className="max-w-md mx-auto my-8 shadow-2xl border-0 rounded-3xl bg-gradient-to-br from-white via-blue-50 to-blue-100 animate-fade-in">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-4 shadow-lg mb-2 border-4 border-white">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-center text-3xl font-extrabold tracking-tight text-blue-900 drop-shadow-lg">
              Direct Billing
            </CardTitle>
            <div className="text-center text-gray-500 text-base mt-1 font-medium">
              Create a custom bill for any purpose
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-7"
            onSubmit={e => { e.preventDefault(); handleSaveAndPrint(); }}
          >
            <div>
              <label className="block text-base font-semibold mb-1 text-blue-900" htmlFor="billing-title">
                Transaction Title
              </label>
              <div className="relative">
                <Input
                  id="billing-title"
                  value={billingTitle}
                  onChange={e => setBillingTitle(e.target.value)}
                  placeholder="e.g. Custom Bill, Service Charge, etc."
                  className="pl-12 text-lg h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-white shadow-sm"
                  maxLength={64}
                  required
                />
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-blue-900" htmlFor="billing-amount">
                Amount
              </label>
              <div className="relative">
                <Input
                  id="billing-amount"
                  type="number"
                  value={billingAmount}
                  onChange={e => setBillingAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-12 text-4xl font-extrabold h-16 text-green-700 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200 focus:border-green-500 shadow-md"
                  min={0.01}
                  step={0.01}
                  required
                />
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-7 w-7 text-green-500" />
              </div>
            </div>
            {error && <Badge variant="destructive" className="w-full text-center py-2 text-base">{error}</Badge>}
            <Button
              type="submit"
              disabled={isProcessing || isPrinting || !billingTitle.trim() || !billingAmount || isNaN(Number(billingAmount)) || Number(billingAmount) <= 0}
              className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl shadow-xl transition-all duration-200 mt-2"
            >
              {isProcessing || isPrinting ? 'Processing...' : 'Save & Print Bill'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-gray-400 mt-2 mb-1 select-none">
        Powered by <span className="font-bold text-blue-500">Bill Blaze</span>
      </div>
    </div>
  );
}

export default DirectBilling; 