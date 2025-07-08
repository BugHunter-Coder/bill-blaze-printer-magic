import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';

interface LoyaltyProgram {
  id: string;
  name: string;
  points_per_purchase: number;
  reward: string;
  details: string | null;
  is_active: boolean;
  created_at: string;
}

const TEMPLATES = [
  {
    label: 'Classic Points',
    value: 'classic',
    programName: 'Classic Points',
    pointsPerPurchase: 1,
    reward: '₹100 off after 10 points',
    details: 'Customers earn 1 point for every purchase. After collecting 10 points, they get ₹100 off their next bill.'
  },
  {
    label: 'Spend & Save',
    value: 'spend',
    programName: 'Spend & Save',
    pointsPerPurchase: 1,
    reward: '₹50 off for every ₹1000 spent',
    details: 'Customers earn 1 point for every ₹100 spent. After 20 points (₹2000 spent), they get ₹50 off.'
  },
  {
    label: 'Birthday Bonus',
    value: 'birthday',
    programName: 'Birthday Bonus',
    pointsPerPurchase: 1,
    reward: 'Double points on birthday month',
    details: 'Customers earn double points for all purchases made during their birthday month.'
  },
  {
    label: 'Refer & Earn',
    value: 'referral',
    programName: 'Refer & Earn',
    pointsPerPurchase: 1,
    reward: '₹100 off for every friend referred',
    details: 'Customers earn 1 point per purchase and get ₹100 off for every friend who joins and makes a purchase.'
  },
  {
    label: 'Tiered Loyalty',
    value: 'tiered',
    programName: 'Silver/Gold/Platinum',
    pointsPerPurchase: 1,
    reward: 'Higher rewards for higher tiers',
    details: 'Customers start at Silver (1 point per purchase), move to Gold after 20 points (get 2x rewards), and Platinum after 50 points (get 3x rewards).'
  }
];

export default function LoyaltyProgramStartPage() {
  const { selectedShopId } = useShop();
  const { toast } = useToast();
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState({
    programName: '',
    pointsPerPurchase: 1,
    reward: '',
    details: '',
  });
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (selectedShopId) fetchPrograms();
  }, [selectedShopId]);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('shop_id', selectedShopId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch loyalty programs', variant: 'destructive' });
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const handleStart = () => {
    setShowSetup(true);
    setEditingId(null);
    setForm({ programName: '', pointsPerPurchase: 1, reward: '', details: '' });
    setSelectedTemplate('');
  };

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTemplate(value);
    const template = TEMPLATES.find(t => t.value === value);
    if (template) {
      setForm({
        programName: template.programName,
        pointsPerPurchase: template.pointsPerPurchase,
        reward: template.reward,
        details: template.details,
      });
    }
  };

  const handleEdit = (program: LoyaltyProgram) => {
    setEditingId(program.id);
    setShowSetup(true);
    setForm({
      programName: program.name,
      pointsPerPurchase: program.points_per_purchase,
      reward: program.reward,
      details: program.details || '',
    });
    setSelectedTemplate('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedShopId) return;
    if (editingId) {
      // Update existing program
      const { error } = await supabase.from('loyalty_programs').update({
        name: form.programName,
        points_per_purchase: Number(form.pointsPerPurchase),
        reward: form.reward,
        details: form.details,
      }).eq('id', editingId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to update loyalty program', variant: 'destructive' });
      } else {
        toast({ title: 'Loyalty Program Updated!', description: `Program "${form.programName}" updated.`, variant: 'default' });
        setShowSetup(false);
        setEditingId(null);
        setForm({ programName: '', pointsPerPurchase: 1, reward: '', details: '' });
        setSelectedTemplate('');
        fetchPrograms();
      }
    } else {
      // Create new program
      const { error } = await supabase.from('loyalty_programs').insert({
        shop_id: selectedShopId,
        name: form.programName,
        points_per_purchase: Number(form.pointsPerPurchase),
        reward: form.reward,
        details: form.details,
        is_active: true,
      });
      if (error) {
        toast({ title: 'Error', description: 'Failed to create loyalty program', variant: 'destructive' });
      } else {
        toast({
          title: 'Loyalty Program Started!',
          description: `Program "${form.programName}" is now active for this shop.`,
          variant: 'default',
        });
        setShowSetup(false);
        setForm({ programName: '', pointsPerPurchase: 1, reward: '', details: '' });
        setSelectedTemplate('');
        fetchPrograms();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-blue-50 to-white py-12">
      <Card className="w-full max-w-lg shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-700">Loyalty Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No loyalty programs found for this shop.</div>
          ) : (
            <div className="space-y-4">
              {programs.map(program => (
                <div key={program.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
                  <div>
                    <div className="font-semibold text-lg text-blue-800">{program.name}</div>
                    <div className="text-gray-600 text-sm">Reward: {program.reward}</div>
                    <div className="text-gray-500 text-xs">Points per purchase: {program.points_per_purchase}</div>
                    {program.details && <div className="text-gray-700 text-xs mt-2"><span className="font-semibold">How it works:</span> {program.details}</div>}
                  </div>
                  <div className="mt-2 md:mt-0 flex flex-col items-end gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${program.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{program.is_active ? 'Active' : 'Inactive'}</span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(program)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-700">{editingId ? 'Edit Loyalty Program' : 'Start a New Loyalty Program'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showSetup ? (
            <>
              <p className="text-gray-700 mb-6">
                Reward your loyal customers! Start a loyalty program to give points for every purchase and offer exciting rewards. Increase repeat business and customer satisfaction.
              </p>
              <Button size="lg" className="w-full" onClick={handleStart} disabled={!selectedShopId}>
                Start Loyalty Program
              </Button>
              {!selectedShopId && <p className="text-red-500 text-sm mt-2">Please select a shop to continue.</p>}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Choose a Template</label>
                <select
                  className="block w-full border rounded px-2 py-2 mb-2"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                >
                  <option value="">-- Select a template (optional) --</option>
                  {TEMPLATES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Program Name</label>
                <Input name="programName" value={form.programName} onChange={handleChange} required placeholder="e.g. Blaze Rewards" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points per Purchase</label>
                <Input name="pointsPerPurchase" type="number" min={1} value={form.pointsPerPurchase} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reward</label>
                <Input name="reward" value={form.reward} onChange={handleChange} required placeholder="e.g. ₹100 off after 10 points" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">How does it work? (Details)</label>
                <Input name="details" value={form.details} onChange={handleChange} required placeholder="e.g. Customers earn 1 point per ₹100 spent. 10 points = ₹100 off." />
              </div>
              <Button type="submit" size="lg" className="w-full mt-2">
                {editingId ? 'Update Program' : 'Save & Activate'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 