'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SCOPES = ['GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY'];
const CATEGORIES = ['VEHICLES', 'SPARE_PARTS', 'REAL_ESTATE', 'FASHION', 'SHOES', 'ELECTRONICS', 'FOOD_FMCG', 'BOOKS', 'DIGITAL_PRODUCTS', 'SERVICES', 'OTHER'];

export default function ListingFeesPage() {
  const [configs, setConfigs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(false);

  const [formData, setFormData] = useState({
    scope: 'GLOBAL',
    scopeValue: '',
    category: '',
    baseFeeKr: '',
    dailyFreeQuota: '0',
    weeklyFreeQuota: '0',
    monthlyFreeQuota: '0',
    isEnabled: true,
    priority: '0'
  });

  useEffect(() => {
    loadConfigs();
    loadAnalytics();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/rembrandt-rar/listing-fees/config');
      const data = await res.json();
      setConfigs(data);
      setGlobalEnabled(data.some(c => c.is_enabled));
    } catch (error) {
      toast.error('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/rembrandt-rar/listing-fees/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rembrandt-rar/listing-fees/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: formData.scope,
          scopeValue: formData.scopeValue || null,
          category: formData.category || null,
          baseFeeKr: parseFloat(formData.baseFeeKr),
          dailyFreeQuota: parseInt(formData.dailyFreeQuota),
          weeklyFreeQuota: parseInt(formData.weeklyFreeQuota),
          monthlyFreeQuota: parseInt(formData.monthlyFreeQuota),
          isEnabled: formData.isEnabled,
          priority: parseInt(formData.priority)
        })
      });

      if (res.ok) {
        toast.success('Configuration saved');
        loadConfigs();
        setFormData({
          scope: 'GLOBAL',
          scopeValue: '',
          category: '',
          baseFeeKr: '',
          dailyFreeQuota: '0',
          weeklyFreeQuota: '0',
          monthlyFreeQuota: '0',
          isEnabled: true,
          priority: '0'
        });
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
    }
  };

  const toggleGlobal = async () => {
    try {
      const res = await fetch('/api/rembrandt-rar/listing-fees/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !globalEnabled })
      });

      if (res.ok) {
        setGlobalEnabled(!globalEnabled);
        toast.success(`Listing fees ${!globalEnabled ? 'enabled' : 'disabled'}`);
        loadConfigs();
      }
    } catch (error) {
      toast.error('Failed to toggle listing fees');
    }
  };

  const deleteConfig = async (id) => {
    if (!confirm('Delete this configuration?')) return;
    
    try {
      const res = await fetch(`/api/rembrandt-rar/listing-fees/config/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Configuration deleted');
        loadConfigs();
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shop Listing Fees</h1>
        <div className="flex items-center gap-2">
          <Label>Listing Fees</Label>
          <Switch checked={globalEnabled} onCheckedChange={toggleGlobal} />
          <Badge variant={globalEnabled ? 'default' : 'secondary'}>
            {globalEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add/Update Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scope</Label>
                    <Select value={formData.scope} onValueChange={(v) => setFormData({...formData, scope: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Scope Value (e.g., KE, US)</Label>
                    <Input 
                      value={formData.scopeValue} 
                      onChange={(e) => setFormData({...formData, scopeValue: e.target.value})}
                      placeholder="Leave empty for GLOBAL"
                    />
                  </div>

                  <div>
                    <Label>Category (Optional)</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Base Fee (KR)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.baseFeeKr} 
                      onChange={(e) => setFormData({...formData, baseFeeKr: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label>Daily Free Quota</Label>
                    <Input 
                      type="number" 
                      value={formData.dailyFreeQuota} 
                      onChange={(e) => setFormData({...formData, dailyFreeQuota: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>Weekly Free Quota</Label>
                    <Input 
                      type="number" 
                      value={formData.weeklyFreeQuota} 
                      onChange={(e) => setFormData({...formData, weeklyFreeQuota: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>Monthly Free Quota</Label>
                    <Input 
                      type="number" 
                      value={formData.monthlyFreeQuota} 
                      onChange={(e) => setFormData({...formData, monthlyFreeQuota: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Input 
                      type="number" 
                      value={formData.priority} 
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.isEnabled} 
                    onCheckedChange={(v) => setFormData({...formData, isEnabled: v})}
                  />
                  <Label>Enabled</Label>
                </div>

                <Button type="submit">Save Configuration</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scope</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fee (KR)</TableHead>
                    <TableHead>Free Quota</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>{config.scope}</TableCell>
                      <TableCell>{config.scope_value || '-'}</TableCell>
                      <TableCell>{config.category || 'All'}</TableCell>
                      <TableCell>{config.base_fee_kr}</TableCell>
                      <TableCell>
                        D:{config.daily_free_quota} W:{config.weekly_free_quota} M:{config.monthly_free_quota}
                      </TableCell>
                      <TableCell>{config.priority}</TableCell>
                      <TableCell>
                        <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
                          {config.is_enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => deleteConfig(config.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.totalRevenue.toFixed(2)} KR</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.totalListings}</p>
                  <p className="text-sm text-muted-foreground">
                    Paid: {analytics.paidListings} | Free: {analytics.freeListings}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.averageFee.toFixed(2)} KR</p>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.byCategory.map((item) => (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.revenue.toFixed(2)} KR</TableCell>
                          <TableCell>{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
