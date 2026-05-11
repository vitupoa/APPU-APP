'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

const locationScopes = [
  { key: 'COUNTRY', label: 'Countries' },
  { key: 'REGION', label: 'Regions' },
  { key: 'CITY', label: 'Cities' },
  { key: 'TOWN', label: 'Towns' },
  { key: 'ROAD', label: 'Roads' },
  { key: 'LANDMARK', label: 'Landmarks' },
  { key: 'SHOPPING_CENTER', label: 'Shopping Centers' },
];

export default function LocationsPage() {
  const qc = useQueryClient();
  const [selectedScope, setSelectedScope] = useState('COUNTRY');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    latitude: '',
    longitude: '',
    population: '',
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', selectedScope],
    queryFn: () => api.get(`/api/v1/admin/locations`, { params: { scope: selectedScope } }).then(r => r.data),
  });

  const addLocationMut = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/locations', { ...data, scope: selectedScope }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      setShowAddModal(false);
      setFormData({ name: '', parentId: '', latitude: '', longitude: '', population: '' });
    },
  });

  const deleteLocationMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--rar-text)', marginBottom: 8 }}>
            Location Management
          </h1>
          <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>
            Manage geographic locations for ad targeting
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: 'var(--rar-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {/* Scope Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
        {locationScopes.map(scope => (
          <button
            key={scope.key}
            onClick={() => setSelectedScope(scope.key)}
            style={{
              padding: '10px 16px',
              background: selectedScope === scope.key ? 'var(--rar-primary)' : 'var(--rar-surface)',
              color: selectedScope === scope.key ? 'white' : 'var(--rar-text)',
              border: selectedScope === scope.key ? 'none' : '1px solid var(--rar-border)',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            {scope.label}
          </button>
        ))}
      </div>

      {/* Locations List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : locations.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            background: 'var(--rar-surface)',
            borderRadius: 12,
            border: '1px solid var(--rar-border)',
          }}
        >
          <MapPin size={48} style={{ color: 'var(--rar-text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--rar-text-muted)' }}>No {selectedScope.toLowerCase()}s added yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {locations.map((location: any) => (
            <div
              key={location.id}
              style={{
                background: 'var(--rar-surface)',
                border: '1px solid var(--rar-border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{location.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>
                  {location.latitude && location.longitude && (
                    <span>📍 {location.latitude}, {location.longitude}</span>
                  )}
                  {location.population && (
                    <span style={{ marginLeft: 12 }}>👥 {location.population.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${location.name}?`)) {
                      deleteLocationMut.mutate(location.id);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={`Add ${selectedScope}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedScope !== 'COUNTRY' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Parent Location
              </label>
              <input
                type="text"
                className="rar-input"
                value={formData.parentId}
                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                placeholder="Parent location ID"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Location Name *
            </label>
            <input
              type="text"
              className="rar-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter location name"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Latitude</label>
              <input
                type="text"
                className="rar-input"
                value={formData.latitude}
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="0.0000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Longitude</label>
              <input
                type="text"
                className="rar-input"
                value={formData.longitude}
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="0.0000"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Population (Optional)
            </label>
            <input
              type="text"
              className="rar-input"
              value={formData.population}
              onChange={e => setFormData({ ...formData, population: e.target.value })}
              placeholder="100000"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--rar-border)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => addLocationMut.mutate(formData)}
              disabled={!formData.name || addLocationMut.isPending}
              style={{
                padding: '10px 20px',
                background: 'var(--rar-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: formData.name ? 'pointer' : 'not-allowed',
                opacity: formData.name ? 1 : 0.5,
              }}
            >
              {addLocationMut.isPending ? 'Adding...' : 'Add Location'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
