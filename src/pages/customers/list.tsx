import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Edit, Trash2, Cake, Star } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useShop } from '@/hooks/useShop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  total_purchases: number;
  last_purchase_date?: string;
  date_of_birth?: string;
}

export default function CustomerListPage() {
  const { selectedShopId } = useShop();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [editModal, setEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ id: '', name: '', phone: '', email: '', date_of_birth: '' });
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', date_of_birth: '' });
  const pageSize = 10;

  useEffect(() => {
    if (selectedShopId) fetchCustomers();
  }, [selectedShopId]);

  const fetchCustomers = async () => {
    setLoading(true);
    if (!selectedShopId) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', selectedShopId)
      .order('last_purchase_date', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      date_of_birth: customer.date_of_birth || '',
    });
    setEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, name, phone, email, date_of_birth } = editForm;
    const { error } = await supabase.from('customers').update({
      name,
      phone,
      email,
      date_of_birth,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update customer', variant: 'destructive' });
    } else {
      toast({ title: 'Customer updated', variant: 'default' });
      setEditModal(false);
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    } else {
      toast({ title: 'Customer deleted', variant: 'default' });
      setDeleteId(null);
      fetchCustomers();
    }
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return;
    const { name, phone, email, date_of_birth } = createForm;
    const { error } = await supabase.from('customers').insert({
      name,
      phone,
      email,
      date_of_birth,
      shop_id: selectedShopId,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
    } else {
      toast({ title: 'Customer created', variant: 'default' });
      setCreateModal(false);
      setCreateForm({ name: '', phone: '', email: '', date_of_birth: '' });
      fetchCustomers();
    }
  };

  // Helper: get customers with birthday in next 7 days
  const today = new Date();
  const upcomingBirthdays = customers.filter(c => {
    if (!c.date_of_birth) return false;
    const dob = new Date(c.date_of_birth);
    dob.setFullYear(today.getFullYear());
    const diff = (dob.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  // Helper: get top 5 loyal customers
  const loyalCustomers = [...customers]
    .filter(c => c.total_purchases > 0)
    .sort((a, b) => b.total_purchases - a.total_purchases)
    .slice(0, 5);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      { accessorKey: 'name', header: 'Name', cell: info => info.getValue() },
      { accessorKey: 'phone', header: 'Phone', cell: info => info.getValue() || '—' },
      { accessorKey: 'email', header: 'Email', cell: info => info.getValue() || '—' },
      { accessorKey: 'date_of_birth', header: 'Date of Birth', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '—' },
      { accessorKey: 'total_purchases', header: 'Total Purchases', cell: info => `₹${Number(info.getValue() || 0).toFixed(2)}` },
      { accessorKey: 'last_purchase_date', header: 'Last Purchase', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '—' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleEdit(row.original)}><Edit className="h-3 w-3" /></Button>
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        setPageIndex(updater({ pageIndex, pageSize }).pageIndex);
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    pageCount: Math.ceil(customers.length / pageSize),
  });

  // In the table, highlight birthday customers
  const isBirthdaySoon = (date_of_birth?: string) => {
    if (!date_of_birth) return false;
    const today = new Date();
    const dob = new Date(date_of_birth);
    dob.setFullYear(today.getFullYear());
    const diff = (dob.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  return (
    <div className="w-full py-8 px-4">
      {/* Birthday and Loyal Customers Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-yellow-700 font-bold text-lg">
            <Cake className="h-5 w-5 text-yellow-500" /> Upcoming Birthdays
          </div>
          {upcomingBirthdays.length === 0 ? (
            <div className="text-gray-500 text-sm">No birthdays in the next 7 days.</div>
          ) : (
            <ul className="space-y-1">
              {upcomingBirthdays.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-gray-500">({new Date(c.date_of_birth!).toLocaleDateString()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-lg">
            <Star className="h-5 w-5 text-blue-500" /> Loyal Customers
          </div>
          {loyalCustomers.length === 0 ? (
            <div className="text-gray-500 text-sm">No loyal customers yet.</div>
          ) : (
            <ul className="space-y-1">
              {loyalCustomers.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-gray-500">(₹{Number(c.total_purchases).toFixed(2)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer List</CardTitle>
          <Button size="sm" onClick={() => setCreateModal(true)}>+ Add Customer</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading customers...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="text-left p-2 cursor-pointer select-none" onClick={header.column.getToggleSortingHandler?.()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() ? (
                            header.column.getIsSorted() === 'asc' ? ' ▲' : ' ▼'
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className={`border-b hover:bg-gray-50 ${isBirthdaySoon(row.original.date_of_birth) ? 'bg-yellow-50' : ''}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-2">
                          {cell.column.id === 'name' && isBirthdaySoon(row.original.date_of_birth) ? (
                            <span className="inline-flex items-center gap-1 text-yellow-700 font-semibold">
                              <Cake className="h-4 w-4 inline-block text-yellow-500" />
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </span>
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Previous
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Next
                  </Button>
                </div>
                <span className="text-xs text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input name="name" value={editForm.name} onChange={handleEditChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input name="phone" value={editForm.phone} onChange={handleEditChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" value={editForm.email} onChange={handleEditChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <Input name="date_of_birth" type="date" value={editForm.date_of_birth} onChange={handleEditChange} />
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Are you sure you want to delete this customer?</div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input name="name" value={createForm.name} onChange={handleCreateChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input name="phone" value={createForm.phone} onChange={handleCreateChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" value={createForm.email} onChange={handleCreateChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <Input name="date_of_birth" type="date" value={createForm.date_of_birth} onChange={handleCreateChange} />
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 