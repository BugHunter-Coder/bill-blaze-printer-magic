import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Receipt, 
  User, 
  Calendar, 
  CreditCard, 
  Package, 
  Printer, 
  Download,
  Copy,
  X
} from 'lucide-react';
import { Transaction, ShopDetails } from '@/types/pos';
import { BluetoothPrinter } from './BluetoothPrinter';
import { useShop } from '@/hooks/useShop';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TransactionDetailsProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetails = ({ transaction, isOpen, onClose }: TransactionDetailsProps) => {
  const { selectedShop } = useShop();
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'bank_transfer':
        return '🏦';
      default:
        return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'upi':
        return 'UPI';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return 'Other';
    }
  };

  const handlePrintReceipt = () => {
    setShowPrintDialog(true);
  };

  const generatePDFReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      setGeneratingPDF(true);
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`receipt-${transaction.invoice_number}-${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateReceiptText = () => {
    const shopDetails = selectedShop;
    const WIDTH = 32;

    const center = (text: string, width: number) => {
      const padding = Math.max(0, width - text.length);
      const leftPadding = Math.floor(padding / 2);
      const rightPadding = padding - leftPadding;
      return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
    };

    const divider = '-'.repeat(WIDTH);
    
    let txt = `\n${center(shopDetails?.name || 'POS SYSTEM', WIDTH)}\n`;
    txt += `${divider}\n`;
    txt += `\nDate : ${formatDate(transaction.created_at)}\n`;
    txt += `Bill#: ${transaction.invoice_number}\n`;
    txt += `Cashier: ${transaction.cashier_id}\n`;
    txt += `${divider}\n`;
    txt += `Item             QTY   Price    Total\n${divider}\n`;
    
    // Add transaction items here if available
    // For now, showing total amount
    txt += `${divider}\n`;
    txt += `Subtotal : ₹${(transaction.total_amount - transaction.discount_amount).toFixed(2).padStart(10)}\n`;
    if (transaction.discount_amount > 0) {
      txt += `Discount : ₹${transaction.discount_amount.toFixed(2).padStart(10)}\n`;
    }
    txt += `${divider}\n`;
    txt += `TOTAL    : ₹${transaction.total_amount.toFixed(2).padStart(10)}\n\n`;
    txt += `Payment: ${getPaymentMethodLabel(transaction.payment_method)}\n`;
    txt += `${divider}\n`;
    txt += `${center('Thank you for your business!', WIDTH)}\n`;
    txt += `${center('Visit us again soon.', WIDTH)}\n`;
    txt += `${center('*** DUPLICATE BILL ***', WIDTH)}\n`;
    
    return txt;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-96 sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Transaction Details
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Transaction Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Invoice #{transaction.invoice_number}</span>
                  <Badge variant="outline">
                    {transaction.is_direct_billing ? 'Direct Billing' : 'Regular Sale'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Date & Time</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatDate(transaction.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Cashier</span>
                  </div>
                  <span className="text-sm font-medium">{transaction.cashier_id}</span>
                </div>

                {transaction.customer_id && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">Customer</span>
                    </div>
                    <span className="text-sm font-medium">{transaction.customer_id}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <div className="flex items-center">
                    <span className="mr-2">{getPaymentMethodIcon(transaction.payment_method)}</span>
                    <span className="font-medium">{getPaymentMethodLabel(transaction.payment_method)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(transaction.total_amount - transaction.discount_amount).toFixed(2)}</span>
                </div>
                
                {transaction.discount_amount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-₹{transaction.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-blue-600">₹{transaction.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {transaction.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{transaction.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handlePrintReceipt}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Duplicate Bill
              </Button>
              
              <Button 
                variant="outline"
                onClick={generatePDFReceipt}
                disabled={generatingPDF}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingPDF ? 'Generating PDF...' : 'Download PDF Bill'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(transaction.invoice_number)}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Invoice Number
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden Receipt for PDF Generation */}
      <div 
        ref={receiptRef}
        className="hidden"
        style={{
          width: '400px',
          padding: '20px',
          backgroundColor: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {selectedShop?.name || 'POS SYSTEM'}
          </h2>
          <div style={{ borderTop: '1px solid #000', marginBottom: '10px' }}></div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '5px 0' }}><strong>Date:</strong> {formatDate(transaction.created_at)}</p>
          <p style={{ margin: '5px 0' }}><strong>Bill #:</strong> {transaction.invoice_number}</p>
          <p style={{ margin: '5px 0' }}><strong>Cashier:</strong> {transaction.cashier_id}</p>
          {transaction.customer_id && (
            <p style={{ margin: '5px 0' }}><strong>Customer:</strong> {transaction.customer_id}</p>
          )}
        </div>
        
        <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span><strong>Subtotal:</strong></span>
            <span>₹{(transaction.total_amount - transaction.discount_amount).toFixed(2)}</span>
          </div>
          {transaction.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span><strong>Discount:</strong></span>
              <span>-₹{transaction.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid #000', marginTop: '10px', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL:</span>
              <span>₹{transaction.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '5px 0' }}><strong>Payment Method:</strong> {getPaymentMethodLabel(transaction.payment_method)}</p>
        </div>
        
        <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
          <p style={{ margin: '5px 0' }}>Visit us again soon.</p>
        </div>
        
        <div style={{ textAlign: 'center', borderTop: '2px solid #000', paddingTop: '10px' }}>
          <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>*** DUPLICATE BILL ***</p>
        </div>
      </div>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Duplicate Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose how you want to print the duplicate bill for invoice #{transaction.invoice_number}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Handle Bluetooth printing
                  setShowPrintDialog(false);
                }}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print via Bluetooth Printer
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  // Handle browser printing
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Receipt - ${transaction.invoice_number}</title>
                          <style>
                            body { font-family: monospace; font-size: 12px; line-height: 1.4; }
                            .receipt { white-space: pre; }
                          </style>
                        </head>
                        <body>
                          <div class="receipt">${generateReceiptText()}</div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                  setShowPrintDialog(false);
                }}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print via Browser
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 