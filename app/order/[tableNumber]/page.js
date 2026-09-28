'use client'

import { use, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function OrderPage({ params }) {
  const { tableNumber } = use(params)

  const [session, setSession] = useState(null)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState({})
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    async function initData() {
      if (!tableNumber) return
      setLoading(true)

      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('id, table_number, adult_count, child_count, status')
          .eq('table_number', parseInt(tableNumber))
          .eq('status', 'open')
          .single()

        if (sessionError || !sessionData) {
          setSession(null)
          setLoading(false)
          return
        }

        setSession(sessionData)

        const { data: catData } = await supabase
          .from('menu_categories')
          .select('*')
          .order('sort_order', { ascending: true })

        const { data: itemData } = await supabase
          .from('menu_items')
          .select('*')

        if (catData && catData.length > 0) {
          setCategories(catData)
          setActiveCategory(catData[0].id)
        }
        if (itemData) {
          setMenuItems(itemData)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [tableNumber])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const currentQty = prev[item.id]?.quantity || 0
      if (currentQty >= 5) {
        alert('เลือกรายการนี้ได้สูงสุด 5 ชิ้นต่อการสั่ง 1 ครั้ง')
        return prev
      }
      return {
        ...prev,
        [item.id]: {
          name: item.name,
          quantity: currentQty + 1,
        },
      }
    })
  }

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => {
      const currentQty = prev[itemId]?.quantity || 0
      if (currentQty <= 1) {
        const newCart = { ...prev }
        delete newCart[itemId]
        return newCart
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: currentQty - 1,
        },
      }
    })
  }

  const handleSubmitOrder = async () => {
    if (totalCartCount === 0) return
    if (totalCartCount > 10) {
      alert('สั่งได้สูงสุดไม่เกิน 10 รายการต่อการส่ง 1 ครั้ง')
      return
    }

    setIsSubmitting(true)

    const orderItems = Object.values(cart).map((i) => ({
      name: i.name,
      quantity: i.quantity,
    }))

    try {
      const { error } = await supabase.from('orders').insert([
        {
          session_id: session.id,
          table_number: parseInt(tableNumber),
          items: orderItems,
          status: 'received',
        },
      ])

      if (error) throw error

      setCart({})
      showToast('🎉 ส่งออเดอร์เรียบร้อยแล้ว!')
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งออเดอร์: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCheckout = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', session.id)

      if (error) throw error

      setShowCheckoutModal(false)
      setIsClosed(true)
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเช็คบิล: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#ed64a6' }}>
        🔄 กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (isClosed) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', minHeight: '100vh', backgroundColor: '#fff5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#d53f8c', marginBottom: '1rem' }}>💖 ขอบคุณที่ใช้บริการ</h1>
        <p style={{ fontSize: '1.2rem', color: '#4a5568' }}>ทานขนมหวาน Thainexsweetie ให้อร่อยนะครับ/ค่ะ</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', minHeight: '100vh', backgroundColor: '#fff5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.8rem', color: '#e53e3e', marginBottom: '0.5rem' }}>โต๊ะนี้ยังไม่เปิดใช้งาน</h2>
        <p style={{ fontSize: '1.2rem', color: '#4a5568' }}>กรุณาแจ้งพนักงานหน้าร้านเพื่อเปิดโต๊ะก่อนสั่งอาหาร</p>
      </div>
    )
  }

  const adultPrice = (session.adult_count || 0) * 289
  const childPrice = (session.child_count || 0) * 145
  const totalPrice = adultPrice + childPrice

  const filteredMenuItems = menuItems.filter((item) => item.category_id === activeCategory)

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f7fafc', position: 'relative', fontFamily: 'sans-serif' }}>
      
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#38a169',
          color: 'white',
          padding: '0.8rem 1.5rem',
          borderRadius: '30px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2000,
          whiteSpace: 'nowrap'
        }}>
          {toastMessage}
        </div>
      )}

      <header style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.8rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#d53f8c', fontWeight: 'bold' }}>
            🍧 โต๊ะ {session.table_number}
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>
            ผู้ใหญ่ {session.adult_count} · เด็ก {session.child_count}
          </span>
        </div>

        <button
          onClick={() => setShowCheckoutModal(true)}
          style={{
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          💳 เรียกเก็บเงิน
        </button>
      </header>

      <nav style={{
        display: 'flex',
        overflowX: 'auto',
        backgroundColor: 'white',
        borderBottom: '2px solid #edf2f7',
        padding: '0.5rem',
        gap: '0.5rem'
      }}>
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0,
                padding: '0.6rem 1.2rem',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: isActive ? '#ed64a6' : '#edf2f7',
                color: isActive ? 'white' : '#4a5568',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {cat.name}
            </button>
          )
        })}
      </nav>

      <main style={{ padding: '1rem', paddingBottom: '120px' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filteredMenuItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem' }}>ไม่มีรายการเมนูในหมวดนี้</p>
          ) : (
            filteredMenuItems.map((item) => {
              const currentQty = cart[item.id]?.quantity || 0
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748' }}>
                    {item.name}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {currentQty > 0 && (
                      <>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid #cbd5e0',
                            backgroundColor: 'white',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: '#e53e3e',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                          {currentQty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleAddToCart(item)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#ed64a6',
                        color: 'white',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {totalCartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '2px solid #edf2f7',
          padding: '1rem',
          boxShadow: '0 -4px 15px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>เลือกทั้งหมด {totalCartCount} รายการ (สูงสุด 10)</span>
              {totalCartCount > 10 && <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>เกินจำนวนที่สั่งได้</span>}
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || totalCartCount > 10}
              style={{
                width: '100%',
                padding: '0.9rem',
                backgroundColor: totalCartCount > 10 || isSubmitting ? '#cbd5e0' : '#38a169',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: totalCartCount > 10 || isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? 'กำลังส่ง...' : `🚀 ส่งออเดอร์ (${totalCartCount} ชิ้น)`}
            </button>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#d53f8c', fontSize: '1.4rem', textAlign: 'center' }}>
              💳 ยืนยันเรียกเก็บเงิน (โต๊ะ {session.table_number})
            </h2>

            <div style={{ backgroundColor: '#fff5f5', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ผู้ใหญ่ ({session.adult_count} คน × 289 บาท)</span>
                <strong>{adultPrice.toLocaleString()} บาท</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>เด็ก ({session.child_count} คน × 145 บาท)</span>
                <strong>{childPrice.toLocaleString()} บาท</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #feb2b2', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', color: '#c53030' }}>
                <strong>ราคารวมสุทธิ</strong>
                <strong>{totalPrice.toLocaleString()} บาท</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCheckoutModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmCheckout}
                disabled={isSubmitting}
                style={{
                  flex: 1.5,
                  padding: '0.8rem',
                  backgroundColor: isSubmitting ? '#cbd5e0' : '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันชำระเงิน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
