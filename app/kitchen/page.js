'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['received', 'cooking'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleStartCooking = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cooking' })
        .eq('id', orderId)

      if (error) throw error
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cooking' } : o))
      )
    } catch (err) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + err.message)
    }
  }

  const handleServeOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', orderId)

      if (error) throw error

      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (err) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + err.message)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1.8rem', color: '#fff', backgroundColor: '#1a202c', minHeight: '100vh' }}>
        🔄 กำลังเปิดระบบห้องครัว Thainexsweetie...
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#1a202c', minHeight: '100vh', padding: '1.5rem', fontFamily: 'sans-serif', color: 'white' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d3748', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#f6ad55', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🍳 จอแสดงรายการอาหารในครัว (Kitchen Display)
        </h1>
        <div style={{ backgroundColor: '#2d3748', padding: '0.5rem 1.2rem', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          ออเดอร์ค้างทำ: <span style={{ color: '#e53e3e', fontSize: '1.5rem' }}>{orders.length}</span> รายการ
        </div>
      </header>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#a0aec0' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>ไม่มีออเดอร์ค้างในขณะนี้</h2>
          <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>ระบบจะอัปเดตอัตโนมัติเมื่อมีออเดอร์ใหม่เข้ามา</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {orders.map((order) => {
            const isCooking = order.status === 'cooking'

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: isCooking ? '0 0 15px rgba(237, 137, 54, 0.6)' : '0 4px 10px rgba(0,0,0,0.3)',
                  border: isCooking ? '4px solid #ed8936' : '4px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{
                  backgroundColor: isCooking ? '#ed8936' : '#3182ce',
                  color: 'white',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '900' }}>
                    โต๊ะ {order.table_number}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      {isCooking ? '🔥 กำลังทำ' : '📥 ออเดอร์ใหม่'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {formatTime(order.created_at)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.2rem', color: '#2d3748', flexGrow: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.6rem 0',
                          borderBottom: idx !== order.items.length - 1 ? '1px dashed #e2e8f0' : 'none',
                          fontSize: '1.3rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <span style={{ color: '#1a202c' }}>{item.name}</span>
                        <span style={{
                          backgroundColor: '#edf2f7',
                          color: '#c53030',
                          padding: '0.2rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '1.4rem',
                          fontWeight: '900'
                        }}>
                          x{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderTop: '1px solid #edf2f7', display: 'flex', gap: '0.5rem' }}>
                  {!isCooking ? (
                    <button
                      onClick={() => handleStartCooking(order.id)}
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        backgroundColor: '#dd6b20',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🔥 เริ่มทำ
                    </button>
                  ) : (
                    <button
                      onClick={() => handleServeOrder(order.id)}
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        backgroundColor: '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ จัดเสิร์ฟแล้ว
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
