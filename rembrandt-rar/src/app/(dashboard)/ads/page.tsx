'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DollarSign, TrendingUp, Eye, Settings } from 'lucide-react';

export default function AdsPage() {
  const qc = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'config' | 'campaigns' | 'analytics'>('config');

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['ad-config'],
    queryFn: () => api.get('/api/v1/admin/ads/config').then(r => r.data),
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['ad-campaigns'],
    queryFn: () => api.get('/api/v1/admin/ads/campaigns').then(r => r.data.campaigns),
    enabled: selectedTab === 'campaigns',
  });

  const { data: stats } = useQuery({
    queryKey: ['ad-stats'],
    queryFn: () => api.get('/api/v1/admin/ads/stats').then(r => r.data),
    enabled: selectedTab === 'analytics',
  });

  const updateConfigMut = useMutation({
    mutationFn: (vars: { endpoint: string; data: any }) =>
      api.put(`/api/v1/admin/ads/config/${vars.endpoint}`, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-config'] }),
  });

  const approveCampaignMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/ads/campaigns/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-campaigns'] }),
  });

  const rejectCampaignMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/v1/admin/ads/campaigns/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-campaigns'] }),
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--rar-text)', marginBottom: 8 }}>
          Ad Management
        </h1>
        <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>
          Configure ad pricing, frequencies, and platform revenue
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--rar-border)' }}>
        {['config', 'campaigns', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: selectedTab === tab ? '2px solid var(--rar-primary)' : '2px solid transparent',
              color: selectedTab === tab ? 'var(--rar-primary)' : 'var(--rar-text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {selectedTab === 'config' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {loadingConfig ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Platform Cut */}
              <ConfigCard
                title="Platform Revenue Split"
                description={`Platform: ${config?.platformCutPercentage || 15}% | Creator: ${100 - (config?.platformCutPercentage || 15)}%`}
                onEdit={() => {
                  const newCut = prompt('Enter new platform cut percentage:', config?.platformCutPercentage);
                  if (newCut) {
                    updateConfigMut.mutate({
                      endpoint: 'platform-cut',
                      data: { percentage: parseFloat(newCut) },
                    });
                  }
                }}
              />

              {/* Native Ad Pricing */}
              <ConfigCard
                title="Native Feed Ads CPM"
                description={`KES ${config?.nativeAdCpmMin || 40} - ${config?.nativeAdCpmMax || 150}`}
                onEdit={() => {
                  const min = prompt('Min CPM:', config?.nativeAdCpmMin);
                  const max = prompt('Max CPM:', config?.nativeAdCpmMax);
                  if (min && max) {
                    updateConfigMut.mutate({
                      endpoint: 'native-pricing',
                      data: { minCpm: parseFloat(min), maxCpm: parseFloat(max) },
                    });
                  }
                }}
              />

              {/* Banner Ad Pricing */}
              <ConfigCard
                title="Banner Ads CPM"
                description={`KES ${config?.bannerAdCpmMin || 30} - ${config?.bannerAdCpmMax || 100}`}
                onEdit={() => {
                  const min = prompt('Min CPM:', config?.bannerAdCpmMin);
                  const max = prompt('Max CPM:', config?.bannerAdCpmMax);
                  if (min && max) {
                    updateConfigMut.mutate({
                      endpoint: 'banner-pricing',
                      data: { minCpm: parseFloat(min), maxCpm: parseFloat(max) },
                    });
                  }
                }}
              />

              {/* Story Ad Pricing */}
              <ConfigCard
                title="Story-Style Ads CPM"
                description={`KES ${config?.storyAdCpmMin || 80} - ${config?.storyAdCpmMax || 200}`}
                onEdit={() => {
                  const min = prompt('Min CPM:', config?.storyAdCpmMin);
                  const max = prompt('Max CPM:', config?.storyAdCpmMax);
                  if (min && max) {
                    updateConfigMut.mutate({
                      endpoint: 'story-pricing',
                      data: { minCpm: parseFloat(min), maxCpm: parseFloat(max) },
                    });
                  }
                }}
              />

              {/* Frequencies */}
              <ConfigCard
                title="Ad Frequencies"
                description={`Native: Every ${config?.nativeAdFrequency || 6} posts | Banner: Every ${config?.bannerAdFrequency || 15} posts | Story: Every ${config?.storyAdFrequency || 20} posts`}
                onEdit={() => {
                  const native = prompt('Native frequency:', config?.nativeAdFrequency);
                  if (native) {
                    updateConfigMut.mutate({
                      endpoint: 'native-frequency',
                      data: { frequency: parseInt(native) },
                    });
                  }
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {selectedTab === 'campaigns' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {loadingCampaigns ? (
            <div>Loading...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--rar-text-muted)' }}>
              No campaigns
            </div>
          ) : (
            campaigns.map((campaign: any) => (
              <div
                key={campaign.id}
                style={{
                  background: 'var(--rar-surface)',
                  border: '1px solid var(--rar-border)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{campaign.campaignName}</h3>
                    <p style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>by {campaign.advertiserName}</p>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: campaign.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      color: campaign.status === 'ACTIVE' ? '#22c55e' : '#eab308',
                    }}
                  >
                    {campaign.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Impressions</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.impressions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Clicks</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.clicks?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>CTR</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.ctr?.toFixed(2) || 0}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Spent</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>KES {campaign.spent?.toLocaleString() || 0}</div>
                  </div>
                </div>

                {campaign.status === 'PENDING_APPROVAL' && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => approveCampaignMut.mutate(campaign.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'var(--rar-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) rejectCampaignMut.mutate({ id: campaign.id, reason });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <StatCard icon={<DollarSign />} label="Total Revenue" value={`KES ${stats.campaigns?.totalSpent?.toLocaleString() || 0}`} />
          <StatCard icon={<TrendingUp />} label="Active Campaigns" value={stats.campaigns?.activeCampaigns || 0} />
          <StatCard icon={<Eye />} label="Total Impressions" value={(stats.campaigns?.totalImpressions || 0).toLocaleString()} />
        </div>
      )}
    </div>
  );
}

function ConfigCard({ title, description, onEdit }: any) {
  return (
    <div
      style={{
        background: 'var(--rar-surface)',
        border: '1px solid var(--rar-border)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--rar-text-muted)' }}>{description}</p>
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: '8px 16px',
          background: 'var(--rar-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Settings size={16} />
        Edit
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div
      style={{
        background: 'var(--rar-surface)',
        border: '1px solid var(--rar-border)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--rar-primary)' }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
