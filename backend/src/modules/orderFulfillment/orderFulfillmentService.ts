export type FulfillmentOrder = {
  id: string;
  channel: 'E-commerce' | 'Retail' | 'Wholesale';
  status: 'picked' | 'packed' | 'shipped';
  etaDays: number;
};

export type OrderFulfillmentSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    fulfillmentRate: number;
    onTimeDelivery: number;
    inventoryCoverage: number;
  };
  orders: FulfillmentOrder[];
};

export function getOrderFulfillmentSummary(): OrderFulfillmentSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      fulfillmentRate: 97.1,
      onTimeDelivery: 95.4,
      inventoryCoverage: 92.8
    },
    orders: [
      { id: 'OF-1001', channel: 'E-commerce', status: 'shipped', etaDays: 2 },
      { id: 'OF-1002', channel: 'Retail', status: 'packed', etaDays: 3 },
      { id: 'OF-1003', channel: 'Wholesale', status: 'picked', etaDays: 5 }
    ]
  };
}
