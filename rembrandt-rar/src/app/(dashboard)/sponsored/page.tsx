'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Eye, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface SponsoredCampaign {
  id: string;
  brandUserId: string;
  brandUser: { username: string; displayName: string };
  contentType: string;
  campaignName: string;
  budget: number;
  spent: number;
  pricingModel: string;
  bidAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  impressions: number;
  views: number;
  engagements: number;
  clicks: number;
  createdAt: string;
}

export default function SponsoredPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  const { data: pendingCampaigns = [], isLoading: loadingPending } = useQuery({
    queryKey: ['sponsored', 'pending'],
    queryFn: () => api.get('/api/v1/sponsored/campaigns/pending').then(r => r.data),
  });

  const { data: allCampaigns = [], isLoading: loadingAll } = useQuery({
    queryKey: ['sponsored', 'all'],
    queryFn: () => api.get('/api/v1/sponsored/campaigns/all').then(r => r.data),
    enabled: selectedTab === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/sponsored/campaigns/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/sponsored/campaigns/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored'] });
    },
  });

  const campaigns = selectedTab === 'pending' ? pendingCampaigns : allCampaigns;
  const isLoading = selectedTab === 'pending' ? loadingPending : loadingAll;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--rar-text)', marginBottom: 8 }}>
          Sponsored Campaigns
        </h1>
        <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>
          Review and approve sponsored content campaigns
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--rar-border)' }}>
        <button
          onClick={() => setSelectedTab('pending')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'pending' ? '2px solid var(--rar-primary)' : '2px solid transparent',
            color: selectedTab === 'pending' ? 'var(--rar-primary)' : 'var(--rar-text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Pending Approval ({pendingCampaigns.length})
        </button>
        <button
          onClick={() => setSelectedTab('all')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'all' ? '2px solid var(--rar-primary)' : '2px solid transparent',
            color: selectedTab === 'all' ? 'var(--rar-primary)' : 'var(--rar-text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          All Campaigns
        </button>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--rar-text-muted)' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--rar-text-muted)' }}>
          No {selectedTab === 'pending' ? 'pending' : ''} campaigns
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {campaigns.map((campaign: SponsoredCampaign) => (
            <div
              key={campaign.id}
              style={{
                background: 'var(--rar-surface)',
                border: '1px solid var(--rar-border)',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 4 }}>
                    {campaign.campaignName}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>
                    by @{campaign.brandUser.username}
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      campaign.status === 'ACTIVE'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : campaign.status === 'PENDING_REVIEW'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : campaign.status === 'REJECTED'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(148, 163, 184, 0.1)',
                    color:
                      campaign.status === 'ACTIVE'
                        ? '#22c55e'
                        : campaign.status === 'PENDING_REVIEW'
                        ? '#eab308'
                        : campaign.status === 'REJECTED'
                        ? '#ef4444'
                        : '#94a3b8',
                  }}
                >
                  {campaign.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginBottom: 4 }}>Type</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                    {campaign.contentType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginBottom: 4 }}>Budget</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                    {campaign.budget.toLocaleString()} KR
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginBottom: 4 }}>Spent</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                    {campaign.spent.toLocaleString()} KR
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginBottom: 4 }}>Model</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                    {campaign.pricingModel}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} style={{ color: 'var(--rar-text-muted)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Impressions</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.impressions.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} style={{ color: 'var(--rar-text-muted)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Views</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.views.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={16} style={{ color: 'var(--rar-text-muted)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Engagements</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.engagements.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} style={{ color: 'var(--rar-text-muted)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>Clicks</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{campaign.clicks.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {campaign.status === 'PENDING_REVIEW' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => approveMutation.mutate(campaign.id)}
                    disabled={approveMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'var(--rar-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(campaign.id)}
                    disabled={rejectMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
