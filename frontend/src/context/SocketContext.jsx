import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const reconnectTimeoutRef = useRef(null);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Connect socket when token AND user are both available.
  // All handlers are defined inline so they can be properly cleaned up in the
  // return function — this prevents handler accumulation across re-renders.
  useEffect(() => {
    if (!token || !user) return;

    console.log('[SocketContext] Initializing socket connection...');
    socketService.connect(token);

    const isAdmin = user?.role === 'admin' || user?.role === 'pharmacist';

    // ─── Handlers ────────────────────────────────────────────────

    const onConnect = () => {
      console.log('✅ Socket connected in context');
      setIsConnected(true);
      // toast.success('Connected to real-time updates', { id: 'socket-connect' });
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected in context');
      setIsConnected(false);
      toast.error('Disconnected from real-time updates', { id: 'socket-disconnect' });
    };

    const onConnectionSuccess = (data) => {
      console.log('[SocketContext] Connection success:', data);
    };

    // New order — notify admins/pharmacists
    const onNewOrder = (data) => {
      if (!isAdmin) return;
      console.log('[SocketContext] New order received:', data);
      toast.success(`New order from ${data.user?.name || 'Customer'}`, { duration: 5000 });
      addNotification({
        type: 'order',
        title: 'New Order',
        message: `New order received from ${data.user?.name || 'Customer'}`,
        data,
      });
    };

    // Order status updates — for the customer who placed the order
    const onOrderStatusUpdated = (data) => {
      console.log('[SocketContext] Order status updated:', data);
      toast.success(`Order ${data.orderId.slice(-6)} status: ${data.status}`, { duration: 5000 });
      addNotification({
        type: 'order',
        title: 'Order Update',
        message: `Your order status has been updated to ${data.status}`,
        data,
      });
    };

    const onOrderDispatched = (data) => {
      console.log('[SocketContext] Order dispatched:', data);
      toast.success(data.message, { duration: 5000 });
      addNotification({
        type: 'order',
        title: 'Order Dispatched',
        message: data.message,
        data,
      });
    };

    const onOrderRejected = (data) => {
      console.log('[SocketContext] Order rejected:', data);
      toast.error(`Order rejected: ${data.reason}`, { duration: 5000 });
      addNotification({
        type: 'order',
        title: 'Order Rejected',
        message: data.reason,
        data,
      });
    };

    // Admin-broadcast update (all connected admins/pharmacists)
    const onAdminOrderUpdate = (data) => {
      console.log('[SocketContext] Admin order update:', data);
      if (isAdmin) {
        addNotification({
          type: 'admin',
          title: 'Order Updated',
          message: `Order for ${data.userName} updated to ${data.status}`,
          data,
        });
      }
    };

    const onPrescriptionUpdated = (data) => {
      console.log('[SocketContext] Prescription updated:', data);
      toast.info(`Prescription status: ${data.status}`, { duration: 5000 });
      addNotification({
        type: 'prescription',
        title: 'Prescription Update',
        message: `Your prescription for ${data.medicine} has been updated`,
        data,
      });
    };

    const onPrescriptionAdminUpdated = (data) => {
      console.log('[SocketContext] Admin prescription update:', data);
      if (isAdmin) {
        addNotification({
          type: 'admin',
          title: 'Prescription Updated',
          message: `Prescription for ${data.userName} - ${data.medicine}`,
          data,
        });
      }
    };

    const onMedicineUpdated = (data) => {
      console.log('[SocketContext] Medicine updated:', data);
      if (isAdmin) {
        addNotification({
          type: 'inventory',
          title: 'Inventory Update',
          message: `${data.medicine.name} updated`,
          data,
        });
      }
    };

    const onMedicineRestocked = (data) => {
      console.log('[SocketContext] Medicine restocked:', data);
      if (isAdmin) {
        const qty = data.medicine.quantityAdded;
        if (qty > 0) {
          // Only show toast for actual restocks, not dispatch deductions
          toast.success(`${data.medicine.name} restocked (+${qty})`, { duration: 4000 });
          addNotification({
            type: 'inventory',
            title: 'Medicine Restocked',
            message: `${data.medicine.name}: ${data.medicine.previousStock} → ${data.medicine.newStock}`,
            data,
          });
        }
      }
    };

    const onLowStockAlert = (data) => {
      console.log('[SocketContext] Low stock alert:', data);
      if (isAdmin) {
        toast.error(`Low stock: ${data.medicine.name} (${data.medicine.stock} left)`, { duration: 6000 });
        addNotification({
          type: 'inventory',
          title: 'Low Stock Alert',
          message: `${data.medicine.name} is running low (${data.medicine.stock} units)`,
          data,
          priority: 'high',
        });
      }
    };

    const onLowStockManualAlert = (data) => {
      console.log('[SocketContext] Manual low stock alert:', data);
      if (isAdmin) {
        addNotification({
          type: 'inventory',
          title: 'Low Stock Alert Sent',
          message: `Alert sent for ${data.alertedCount} medicines`,
          data,
        });
      }
    };

    const onRefillAlertUpdated = (data) => {
      console.log('[SocketContext] Refill alert updated:', data);
      toast.info(`Refill alert for ${data.medicine} - ${data.status}`, { duration: 4000 });
      addNotification({
        type: 'refill',
        title: 'Refill Alert',
        message: `${data.medicine} refill status: ${data.status}`,
        data,
      });
    };

    const onRefillAdminUpdated = (data) => {
      console.log('[SocketContext] Refill admin updated:', data);
      if (isAdmin) {
        addNotification({
          type: 'refill',
          title: 'Refill Alert Updated',
          message: `Alert for ${data.userName} (${data.medicine}) → ${data.status}`,
          data,
        });
      }
    };

    const onPrescriptionSubmitted = (data) => {
      console.log('[SocketContext] Prescription submitted:', data);
      if (!isAdmin) return;
      toast(`New prescription from ${data.userName}`, { icon: '📋', duration: 5000 });
      addNotification({
        type: 'prescription',
        title: 'New Prescription',
        message: `${data.userName} uploaded ${data.medicineCount} medicine(s) for review`,
        data,
        priority: 'high',
      });
    };

    const onErrorResponse = (data) => {
      console.error('[SocketContext] Socket error:', data.message);
      toast.error(data.message, { duration: 4000 });
    };

    // ─── Register ────────────────────────────────────────────────
    socketService.on('connect', onConnect);
    socketService.on('disconnect', onDisconnect);
    socketService.on('connection:success', onConnectionSuccess);
    socketService.on('order:new', onNewOrder);
    socketService.on('order:status-updated', onOrderStatusUpdated);
    socketService.on('order:dispatched', onOrderDispatched);
    socketService.on('order:rejected', onOrderRejected);
    socketService.on('order:admin-updated', onAdminOrderUpdate);
    socketService.on('prescription:updated', onPrescriptionUpdated);
    socketService.on('prescription:admin-updated', onPrescriptionAdminUpdated);
    socketService.on('inventory:medicine-updated', onMedicineUpdated);
    socketService.on('inventory:medicine-restocked', onMedicineRestocked);
    socketService.on('inventory:low-stock-alert', onLowStockAlert);
    socketService.on('inventory:low-stock-manual-alert', onLowStockManualAlert);
    socketService.on('refill:alert-updated', onRefillAlertUpdated);
    socketService.on('refill:admin-updated', onRefillAdminUpdated);
    socketService.on('prescription:submitted', onPrescriptionSubmitted);
    socketService.on('error:response', onErrorResponse);

    return () => {
      console.log('[SocketContext] Cleaning up socket connection...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      // ─── Deregister all SocketContext handlers ────────────────
      socketService.off('connect', onConnect);
      socketService.off('disconnect', onDisconnect);
      socketService.off('connection:success', onConnectionSuccess);
      socketService.off('order:new', onNewOrder);
      socketService.off('order:status-updated', onOrderStatusUpdated);
      socketService.off('order:dispatched', onOrderDispatched);
      socketService.off('order:rejected', onOrderRejected);
      socketService.off('order:admin-updated', onAdminOrderUpdate);
      socketService.off('prescription:updated', onPrescriptionUpdated);
      socketService.off('prescription:admin-updated', onPrescriptionAdminUpdated);
      socketService.off('inventory:medicine-updated', onMedicineUpdated);
      socketService.off('inventory:medicine-restocked', onMedicineRestocked);
      socketService.off('inventory:low-stock-alert', onLowStockAlert);
      socketService.off('inventory:low-stock-manual-alert', onLowStockManualAlert);
      socketService.off('refill:alert-updated', onRefillAlertUpdated);
      socketService.off('refill:admin-updated', onRefillAdminUpdated);
      socketService.off('prescription:submitted', onPrescriptionSubmitted);
      socketService.off('error:response', onErrorResponse);

      // disconnect() keeps page-level listeners buffered; reset() (on logout) clears them
      socketService.disconnect();
    };
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === notificationId ? { ...notif, read: true } : notif)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const joinRoom = useCallback((roomId) => socketService.joinRoom(roomId), []);
  const leaveRoom = useCallback((roomId) => socketService.leaveRoom(roomId), []);
  const sendMessage = useCallback((roomId, content, type, metadata) =>
    socketService.sendMessage(roomId, content, type, metadata), []);

  const on = useCallback((event, callback) => { socketService.on(event, callback); }, []);
  const off = useCallback((event, callback) => { socketService.off(event, callback); }, []);
  const emit = useCallback((event, data) => socketService.emit(event, data), []);

  const value = {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    joinRoom,
    leaveRoom,
    sendMessage,
    on,
    off,
    emit,
    socket: socketService.socket,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
