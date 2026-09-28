'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function GenerateQRPage() {
  const [tableNumber, setTableNumber] = useState('')
  const [adultCount, setAdultCount] = useState('')
  const [childCount, setChildCount] = useState('0')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSessionWarning, setActiveSessionWarning] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [createdSession, setCreatedSession] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleOpenTable = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setActiveSessionWarning(null)
    setCreatedSession(null)

    if (!tableNumber || parseInt(tableNumber) <= 0) {
      setErrorMessage('กรุณากรอกเลขโต๊ะให้ถูกต้อง')
      return
    }
    if (!adultCount || parseInt(adultCount) < 0) {
      setErrorMessage('กรุณากรอกจำนวนผู้ใหญ่ให้ถูกต้อง')
      return
    }

    setLoading(true)

    try {
      const { data: existingSessions, error: checkError } = await supabase
        .from('sessions')
        .select('id, table_number, adult_count, child_count, created_at, status')
        .eq('table_number', parseInt(tableNumber))
        .eq('status', 'open')

      if (checkError) throw checkError

      if (existingSessions && existingSessions.length > 0) {
        setActiveSessionWarning(existingSessions[0])
        setLoading(false)
        return
      }

      const { data: newSession, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            table_number: parseInt(tableNumber),
            adult_count: parseInt(adultCount),
            child_count: parseInt(childCount || 0),
            status: 'open',
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      setCreatedSession(newSession)
    } catch (err) {
      console.error(err)
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getElapsedMinutes = (createdAt) => {
    if (!createdAt) return 0
    const createdTime = new Date(createdAt).getTime()
    const now = new Date().getTime()
    const diffInMinutes = Math.floor((now - createdTime) / (1000 * 60))
    return diffInMinutes < 0 ? 0 : diffInMinutes
  }

  const handleConfirmCloseOldSession = async () => {
    if (!activeSessionWarning) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', activeSessionWarning.id)
        .eq('status', 'open')

      if (error) throw error

      setShowConfirmModal(false)
      setActiveSessionWarning(null)
      alert(`ปิด Session เดิมของโต๊ะ ${activeSessionWarning.table_number} เรียบร้อยแล้ว กรุณากด "เปิดโต๊ะ" อีกครั้ง`)
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการปิดโต๊ะ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetForm = () => {
    setTableNumber('')
    setAdultCount('')
    setChildCount('0')
    setCreatedSession(null)
    setActiveSessionWarning(null)
    setErrorMessage('')
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const orderUrl = createdSession ? `${origin}/order/${createdSession.table_number}` : ''
  const qrImageUrl = createdSession
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}`
    : ''

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#d53f8c', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>🍧 Thainexsweetie</h1>
        <p style={{ color: '#4a5568', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>ระบบเปิดโต๊ะ & สร้าง QR Code</p>
      </header>

      {errorMessage && (
        <div style={{ padding: '1rem', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {createdSession ? (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2b6cb0', marginBottom: '1rem' }}>
            โต๊ะ {createdSession.table_number} · ผู้ใหญ่ {createdSession.adult_count} · เด็ก {createdSession.child_count}
          </div>

          <div style={{ margin: '1.5rem 0' }}>
            <img
              src={qrImageUrl}
              alt={`QR Code สำหรับโต๊ะ ${createdSession.table_number}`}
              style={{ width: '250px', height: '250px', border: '4px solid #ed64a6', borderRadius: '8px' }}
            />
          </div>

          <div style={{ backgroundColor: '#edf2f7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#718096' }}>ลิงก์สำหรับสั่งอาหาร:</p>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748' }}>{orderUrl}</span>
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => handleCopyLink(orderUrl)}
                style={{
                  padding: '0.4rem 1rem',
                  backgroundColor: copied ? '#38a169' : '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {copied ? '✓ คัดลอกสำเร็จ!' : '📋 คัดลอกลิงก์'}
              </button>
            </div>
          </div>

          <button
            onClick={handleResetForm}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#ed64a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ➕ เปิดโต๊ะใหม่
          </button>
        </div>
      ) : (
        <form onSubmit={handleOpenTable} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {activeSessionWarning && (
            <div style={{ backgroundColor: '#fffaf0', border: '2px solid #dd6b20', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#c05621', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.75rem 0' }}>
                ⚠️ โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน
              </p>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dd6b20',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔒 ปิดออเดอร์เดิม
              </button>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '0.5rem' }}>
              เลขโต๊ะ (ตัวเลข):
            </label>
            <input
              type="number"
              min="1"
              required
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="ระบุเลขโต๊ะ เช่น 1, 2, 7"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1.2rem',
                borderRadius: '8px',
                border: '2px solid #cbd5e0',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '0.5rem' }}>
              จำนวนผู้ใหญ่:
            </label>
            <input
              type="number"
              min="1"
              required
              value={adultCount}
              onChange={(e) => setAdultCount(e.target.value)}
              placeholder="ระบุจำนวนผู้ใหญ่"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1.2rem',
                borderRadius: '8px',
                border: '2px solid #cbd5e0',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '0.5rem' }}>
              จำนวนเด็ก:
            </label>
            <input
              type="number"
              min="0"
              required
              value={childCount}
              onChange={(e) => setChildCount(e.target.value)}
              placeholder="ระบุจำนวนเด็ก (ถ้าไม่มีใส่ 0)"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1.2rem',
                borderRadius: '8px',
                border: '2px solid #cbd5e0',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading ? '#cbd5e0' : '#38a169',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'กำลังประมวลผล...' : '🚀 เปิดโต๊ะ'}
          </button>
        </form>
      )}

      {showConfirmModal && activeSessionWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e53e3e', fontSize: '1.3rem' }}>
              🔴 ยืนยันปิดโต๊ะเดิม (โต๊ะ {activeSessionWarning.table_number})
            </h3>
            
            <div style={{ backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '1rem', color: '#2d3748', lineHeight: '1.6' }}>
              <div>• <strong>เลขโต๊ะ:</strong> โต๊ะ {activeSessionWarning.table_number}</div>
              <div>• <strong>จำนวนลูกค้าเดิม:</strong> ผู้ใหญ่ {activeSessionWarning.adult_count} คน / เด็ก {activeSessionWarning.child_count} คน</div>
              <div>• <strong>ระยะเวลาที่เปิด:</strong> เปิดมาแล้ว <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>{getElapsedMinutes(activeSessionWarning.created_at)}</span> นาที</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseOldSession}
                disabled={loading}
                style={{
                  flex: 1.5,
                  padding: '0.75rem',
                  backgroundColor: loading ? '#cbd5e0' : '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'กำลังปิดโต๊ะ...' : 'ยืนยันปิดโต๊ะเดิม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
