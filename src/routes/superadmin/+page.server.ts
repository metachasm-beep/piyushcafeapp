import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  let totalRevenue = 0;
  let platformFees = 0;
  let activeRestaurantsCount = 0;
  let totalOrdersToday = 0;
  let recentActivity = [];
  let chartData = [
    { date: new Date(Date.now() - 6 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now() - 5 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now() - 4 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now() - 3 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now() - 2 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now() - 1 * 86400000).toISOString(), revenue: 0 },
    { date: new Date(Date.now()).toISOString(), revenue: 0 },
  ];

  if (supabase) {
    // Fetch total revenue and platform fees from paid orders
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total_amount, platform_fee, created_at')
      .eq('status', 'paid');
    
    if (paidOrders) {
      totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      platformFees = paidOrders.reduce((sum, order) => sum + Number(order.platform_fee), 0);

      // Orders today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      totalOrdersToday = paidOrders.filter(o => new Date(o.created_at) >= today).length;

      // Populate chart data (past 7 days)
      const now = new Date();
      for (const order of paidOrders) {
        const d = new Date(order.created_at);
        const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 7) {
          // The index is 6 - daysAgo
          const idx = 6 - daysAgo;
          chartData[idx].revenue += Number(order.total_amount);
        }
      }
    }

    const { count: restCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    activeRestaurantsCount = restCount || 0;

    // Recent activity (e.g. recent paid orders)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, status, created_at, restaurants(name)')
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (recentOrders) {
      recentActivity = recentOrders.map(o => {
        let action = '';
        let status = 'INFO';
        if (o.status === 'paid') {
          action = `Order ${o.id.substring(0, 8)} paid`;
          status = 'OK';
        } else if (o.status === 'cancelled') {
          action = `Order ${o.id.substring(0, 8)} cancelled`;
          status = 'ERR';
        } else {
          action = `New order ${o.id.substring(0, 8)} created`;
          status = 'INFO';
        }
        
        return {
          restaurant: (o.restaurants as any)?.name || 'Unknown',
          action,
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status
        };
      });
    }
  }

  return {
    stats: {
      totalRevenue,
      platformFees,
      activeRestaurantsCount,
      totalOrdersToday
    },
    chartData,
    recentActivity
  };
};
