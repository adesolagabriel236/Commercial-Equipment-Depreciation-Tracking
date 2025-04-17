import { describe, it, expect, vi } from 'vitest';

// Mock the Clarity contract environment
const mockClarity = {
  assets: new Map(),
  lastAssetId: 0,
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  
  registerAsset(name, serialNumber, manufacturer, purchaseDate, category) {
    const newId = this.lastAssetId + 1;
    this.lastAssetId = newId;
    
    this.assets.set(newId, {
      name,
      'serial-number': serialNumber,
      manufacturer,
      'purchase-date': purchaseDate,
      owner: this.txSender,
      category,
      status: 'active'
    });
    
    return { ok: newId };
  },
  
  updateAssetStatus(assetId, newStatus) {
    if (!this.assets.has(assetId)) {
      return { err: 404 };
    }
    
    const asset = this.assets.get(assetId);
    if (asset.owner !== this.txSender) {
      return { err: 403 };
    }
    
    asset.status = newStatus;
    this.assets.set(assetId, asset);
    return { ok: true };
  },
  
  getAsset(assetId) {
    return this.assets.get(assetId) || null;
  },
  
  getAssetCount() {
    return this.lastAssetId;
  }
};

describe('Asset Registration Contract', () => {
  it('should register a new asset', () => {
    const result = mockClarity.registerAsset(
        'Forklift XL2000',
        'SN12345',
        'Heavy Machinery Inc',
        1609459200, // Jan 1, 2021
        'Heavy Equipment'
    );
    
    expect(result).toEqual({ ok: 1 });
    expect(mockClarity.getAssetCount()).toBe(1);
    
    const asset = mockClarity.getAsset(1);
    expect(asset).toEqual({
      name: 'Forklift XL2000',
      'serial-number': 'SN12345',
      manufacturer: 'Heavy Machinery Inc',
      'purchase-date': 1609459200,
      owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      category: 'Heavy Equipment',
      status: 'active'
    });
  });
  
  it('should update asset status', () => {
    // Register an asset first
    mockClarity.registerAsset('Computer', 'ABC123', 'Dell', 1609459200, 'Office Equipment');
    const assetId = 2;
    
    // Update status
    const result = mockClarity.updateAssetStatus(assetId, 'maintenance');
    expect(result).toEqual({ ok: true });
    
    // Verify status was updated
    const asset = mockClarity.getAsset(assetId);
    expect(asset.status).toBe('maintenance');
  });
  
  it('should fail to update non-existent asset', () => {
    const result = mockClarity.updateAssetStatus(999, 'retired');
    expect(result).toEqual({ err: 404 });
  });
  
  it('should fail to update asset if not owner', () => {
    // Register an asset
    mockClarity.registerAsset('Printer', 'XYZ789', 'HP', 1609459200, 'Office Equipment');
    const assetId = 3;
    
    // Change tx-sender to simulate different user
    const originalSender = mockClarity.txSender;
    mockClarity.txSender = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    // Try to update
    const result = mockClarity.updateAssetStatus(assetId, 'retired');
    expect(result).toEqual({ err: 403 });
    
    // Restore original sender
    mockClarity.txSender = originalSender;
  });
});
