# Frontend UI Examples - Content Locking System

## 1. Create Content Screen (Shorts/Drips/Live)

### React/React Native Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, Button } from 'react-native';

interface CreateContentProps {
  userCurrency: string; // e.g., 'KES', 'USD', 'NGN'
  onSubmit: (data: any) => void;
}

export const CreateContentScreen: React.FC<CreateContentProps> = ({ 
  userCurrency, 
  onSubmit 
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockAmountFiat, setLockAmountFiat] = useState('');
  const [lockAmountKr, setLockAmountKr] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Real-time conversion as creator types
  useEffect(() => {
    if (!lockAmountFiat || Number(lockAmountFiat) <= 0) {
      setLockAmountKr(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsConverting(true);
      try {
        const response = await fetch('/api/content-lock/convert-fiat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fiatAmount: Number(lockAmountFiat),
            currency: userCurrency
          })
        });
        
        const data = await response.json();
        setLockAmountKr(data.krAmount);
      } catch (error) {
        console.error('Conversion failed:', error);
      } finally {
        setIsConverting(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [lockAmountFiat, userCurrency]);

  const handleSubmit = () => {
    onSubmit({
      isLocked,
      unlockAmountKr: isLocked && lockAmountRc > 0 ? lockAmountRc : undefined,
      requiredTier: selectedTier
    });
  };

  return (
    <View style={styles.container}>
      {/* Lock Content Toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Lock Content</Text>
        <Switch value={isLocked} onValueChange={setIsLocked} />
      </View>

      {isLocked && (
        <>
          {/* Subscription Tier Option */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Method</Text>
            
            <Button
              title="Require Subscription"
              onPress={() => setSelectedTier('TOP_FUN')}
            />
            
            <Text style={styles.orText}>OR</Text>
            
            {/* Individual Unlock Option */}
            <View style={styles.unlockSection}>
              <Text style={styles.label}>One-Time Unlock Price</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>{userCurrency}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={lockAmountFiat}
                  onChangeText={setLockAmountFiat}
                />
              </View>

              {/* Show Rc conversion */}
              {lockAmountRc > 0 && (
                <View style={styles.conversionDisplay}>
                  <Text style={styles.krAmount}>
                    {lockAmountKr} Rc
                  </Text>
                  <Text style={styles.fiatAmount}>
                    (≈ {lockAmountFiat} {userCurrency})
                  </Text>
                  {isConverting && <Text>Converting...</Text>}
                </View>
              )}
            </View>
          </>
        )}

        <Button title="Create Content" onPress={handleSubmit} />
      </View>
    </View>
  );
};

const styles = {
  container: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  orText: { textAlign: 'center', marginVertical: 12, color: '#666' },
  unlockSection: { marginTop: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  currencySymbol: { fontSize: 16, marginRight: 8, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 },
  conversionDisplay: { marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  krAmount: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  fiatAmount: { fontSize: 14, color: '#666', marginTop: 4 }
};
```

## 2. Locked Content Display (Feed)

### React/React Native Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';

interface LockedContentProps {
  content: {
    id: string;
    type: 'SHORT' | 'POST' | 'LIVE';
    isLocked: boolean;
    hasAccess: boolean;
    unlockAmountKr?: number;
    requiresSubscription?: boolean;
    requiresUnlock?: boolean;
    creator: {
      id: string;
      displayName: string;
      avatarUrl: string;
    };
  };
  userCurrency: string;
  onUnlock: () => void;
  onSubscribe: () => void;
}

export const LockedContentOverlay: React.FC<LockedContentProps> = ({
  content,
  userCurrency,
  onUnlock,
  onSubscribe
}) => {
  const [unlockPrice, setUnlockPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content.unlockAmountKr) {
      fetchUnlockPrice();
    }
  }, [content.unlockAmountKr, userCurrency]);

  const fetchUnlockPrice = async () => {
    try {
      const response = await fetch(
        `/api/content-lock/price?unlockAmountKr=${content.unlockAmountKr}&currency=${userCurrency}`
      );
      const data = await response.json();
      setUnlockPrice(data);
    } catch (error) {
      console.error('Failed to fetch price:', error);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content-lock/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          contentType: content.type
        })
      });

      if (response.ok) {
        onUnlock();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to unlock content');
      }
    } catch (error) {
      alert('Failed to unlock content');
    } finally {
      setLoading(false);
    }
  };

  if (!content.isLocked || content.hasAccess) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.lockContainer}>
        {/* Lock Icon */}
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>

        {/* Creator Info */}
        <Image 
          source={{ uri: content.creator.avatarUrl }} 
          style={styles.avatar}
        />
        <Text style={styles.creatorName}>{content.creator.displayName}</Text>
        
        <Text style={styles.lockTitle}>This content is locked</Text>

        {/* Unlock Options */}
        <View style={styles.optionsContainer}>
          {/* Subscription Option */}
          {content.requiresSubscription && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onSubscribe}
            >
              <Text style={styles.buttonText}>
                Subscribe to Unlock
              </Text>
            </TouchableOpacity>
          )}

          {/* Individual Unlock Option */}
          {content.requiresUnlock && unlockPrice && (
            <>
              {content.requiresSubscription && (
                <Text style={styles.orText}>OR</Text>
              )}
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleUnlock}
                disabled={loading}
              >
                <View style={styles.priceContainer}>
                  <Text style={styles.krPrice}>
                    {unlockPrice.krAmount} Rc
                  </Text>
                  <Text style={styles.fiatPrice}>
                    (≈ {unlockPrice.fiatAmount} {unlockPrice.currency})
                  </Text>
                </View>
                <Text style={styles.buttonText}>
                  {loading ? 'Unlocking...' : 'Unlock Once'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  lockContainer: {
    alignItems: 'center',
    padding: 24
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  lockEmoji: {
    fontSize: 40
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 300
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 12,
    fontSize: 14
  },
  priceContainer: {
    marginBottom: 8,
    alignItems: 'center'
  },
  krPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  fiatPrice: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4
  }
};
```

## 3. Live Stream Unlock Modal

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';

interface LiveUnlockModalProps {
  visible: boolean;
  streamId: string;
  unlockAmountKr: number;
  userCurrency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const LiveUnlockModal: React.FC<LiveUnlockModalProps> = ({
  visible,
  streamId,
  unlockAmountKr,
  userCurrency,
  onClose,
  onSuccess
}) => {
  const [price, setPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && unlockAmountKr) {
      fetchPrice();
    }
  }, [visible, unlockAmountKr, userCurrency]);

  const fetchPrice = async () => {
    try {
      const response = await fetch(
        `/api/content-lock/price?unlockAmountKr=${unlockAmountKr}&currency=${userCurrency}`
      );
      const data = await response.json();
      setPrice(data);
    } catch (error) {
      console.error('Failed to fetch price:', error);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content-lock/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: streamId,
          contentType: 'LIVE'
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to unlock stream');
      }
    } catch (error) {
      alert('Failed to unlock stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔒 Unlock Live Stream</Text>
          
          <Text style={styles.modalDescription}>
            This live stream is locked. Unlock it to join and watch.
          </Text>

          {price && (
            <View style={styles.priceBox}>
              <Text style={styles.krAmount}>{price.krAmount} Rc</Text>
              <Text style={styles.fiatAmount}>
                ≈ {price.fiatAmount} {price.currency}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.unlockButton}
              onPress={handleUnlock}
              disabled={loading || !price}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.unlockButtonText}>Unlock</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  priceBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  krAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  fiatAmount: {
    fontSize: 16,
    color: '#666',
    marginTop: 8
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  unlockButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center'
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
};
```

## 4. Usage in Feed Component

```typescript
import React from 'react';
import { FlatList } from 'react-native';

export const ShortsFeed = () => {
  const [shorts, setShorts] = useState([]);
  const userCurrency = 'KES'; // Get from user profile

  const fetchShorts = async () => {
    const response = await fetch('/api/shorts/feed/discover');
    const data = await response.json();
    setShorts(data.items);
  };

  const handleUnlock = () => {
    // Refresh feed to show unlocked content
    fetchShorts();
  };

  return (
    <FlatList
      data={shorts}
      renderItem={({ item }) => (
        <View>
          {/* Video Player */}
          {item.hasAccess ? (
            <Video source={{ uri: item.videoUrl }} />
          ) : (
            <View style={{ backgroundColor: '#000', aspectRatio: 9/16 }}>
              <LockedContentOverlay
                content={item}
                userCurrency={userCurrency}
                onUnlock={handleUnlock}
                onSubscribe={() => {/* Navigate to subscription */}}
              />
            </View>
          )}
          
          {/* Other UI elements */}
        </View>
      )}
    />
  );
};
```

## Key UI/UX Principles

1. **Rc in Focus**: Always display Rc amount prominently
2. **Fiat as Secondary**: Show fiat conversion below or beside Rc
3. **Real-time Conversion**: Update conversions as user types or changes currency
4. **Clear Options**: Clearly separate subscription vs one-time unlock options
5. **Loading States**: Show loading indicators during conversion and unlock
6. **Error Handling**: Display clear error messages for insufficient balance, etc.
7. **Visual Hierarchy**: Lock icon → Creator info → Price → Action buttons
